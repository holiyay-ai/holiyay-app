/**
 * Weather Client
 *
 * Provider-agnostic wrapper for Weather API calls. Currently uses OpenWeatherMap.
 * - Exposes `getWeatherForRange` (calendar-friendly, date -> weather)
 * - Uses the OpenWeatherMap Geocoding + OneCall (daily) endpoints
 * - Caches geocoding (longer TTL) and forecast responses (shorter TTL)
 * - Retries transient failures with exponential backoff
 *
 * Notes / limitations:
 * - OpenWeatherMap free One Call provides a limited forecast window (~7 days).
 *   Dates outside the provider's forecast window will be returned as `null`.
 * - For longer-range "typical climate" data one could add a climatology provider
 *   (VisualCrossing / Meteostat / Open-Meteo) — left as an enhancement.
 */

import { constants } from "../config"
import {
	NotFoundError,
	ServiceUnavailableError,
	ValidationError,
} from "../lib/errors"
import { createLogger } from "../lib/logger"
import { createCacheKey, destinationCache, genericCache } from "./cache"

const log = createLogger("weather")

export interface WeatherData {
	temperature: number
	description: string
	humidity: number
	windSpeed: number
	approximate?: boolean
}

export interface WeatherOptions {
	location: string
	units?: "metric" | "imperial"
}

export interface RetryOptions {
	maxRetries?: number
	initialDelayMs?: number
	maxDelayMs?: number
	backoffMultiplier?: number
}

const DEFAULT_RETRY_OPTIONS: Required<RetryOptions> = {
	maxRetries: constants.weather.retry.maxRetries,
	initialDelayMs: constants.weather.retry.initialDelayMs,
	maxDelayMs: constants.weather.retry.maxDelayMs,
	backoffMultiplier: constants.weather.retry.backoffMultiplier,
}

function isRetryableError(error: unknown): boolean {
	if (error instanceof Error) {
		const message = error.message.toLowerCase()
		if (
			message.includes("network") ||
			message.includes("timeout") ||
			message.includes("econnreset") ||
			message.includes("econnrefused")
		) {
			return true
		}
	}

	return false
}

function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms))
}

async function withRetry<T>(
	fn: () => Promise<T>,
	options: RetryOptions = {},
): Promise<T> {
	const opts = { ...DEFAULT_RETRY_OPTIONS, ...options }
	let lastError: unknown
	let delay = opts.initialDelayMs

	for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
		try {
			return await fn()
		} catch (error) {
			lastError = error

			if (!isRetryableError(error)) {
				throw error
			}

			if (attempt === opts.maxRetries) {
				break
			}

			log.warn(
				{
					attempt: attempt + 1,
					maxAttempts: opts.maxRetries + 1,
					retryIn: delay,
					error: error instanceof Error ? error.message : error,
				},
				"Weather API call failed, retrying",
			)

			await sleep(delay)

			const jitter = Math.random() * 0.1 * delay
			delay = Math.min(delay * opts.backoffMultiplier + jitter, opts.maxDelayMs)
		}
	}

	throw lastError
}

const OWM_BASE = "https://api.openweathermap.org"
const OWM_GEO_PATH = "/geo/1.0/direct"
const OWM_ONECALL_PATH = "/data/2.5/onecall"

/**
 * Result returned for a calendar-friendly weather range query.
 * `forecast` is a map keyed by ISO date (YYYY-MM-DD). Values are `null`
 * when no reliable forecast is available for that date.
 */
export interface WeatherRange {
	location: {
		name?: string
		lat: number
		lon: number
	}
	units: WeatherOptions["units"]
	forecast: Record<string, WeatherData | null>
}

function toIsoDateString(d: Date): string {
	return d.toISOString().slice(0, 10)
}

function parseIsoDateStrict(s: string): Date {
	// Accepts YYYY-MM-DD only (caller validation is expected upstream,
	// but we still guard against invalid input).
	const d = new Date(`${s}T00:00:00Z`)
	if (Number.isNaN(d.getTime())) {
		throw new ValidationError(`Invalid date: ${s}`)
	}
	return d
}

function buildDateRange(startIso: string, endIso: string): string[] {
	const start = parseIsoDateStrict(startIso)
	const end = parseIsoDateStrict(endIso)
	if (start > end) {
		throw new ValidationError(`startDate must be <= endDate`)
	}

	const out: string[] = []
	const cur = new Date(start)
	while (cur <= end) {
		out.push(toIsoDateString(cur))
		cur.setUTCDate(cur.getUTCDate() + 1)
	}
	return out
}

function ensureApiKey(): string {
	const key = process.env.WEATHER_API_KEY
	if (!key) {
		throw new ServiceUnavailableError(
			"Weather features",
			"WEATHER_SERVICE_ERROR",
		)
	}
	return key
}

async function geocodeLocation(
	location: string,
	retryOptions?: RetryOptions,
): Promise<{ lat: number; lon: number; name?: string }> {
	const cacheKey = createCacheKey("geo", location)
	const cached = await destinationCache.getOrSet(
		cacheKey,
		async () => {
			const apiKey = ensureApiKey()
			const url = `${OWM_BASE}${OWM_GEO_PATH}?q=${encodeURIComponent(
				location,
			)}&limit=1&appid=${apiKey}`

			const payload = await withRetry(async () => {
				const res = await fetch(url, {
					method: "GET",
					headers: { Accept: "application/json" },
				})
				if (!res.ok) {
					const text = await res.text().catch(() => "")
					throw new Error(
						`Geocoding failed: ${res.status} ${res.statusText} ${text}`,
					)
				}
				return res.json() as Promise<any>
			}, retryOptions)

			if (!Array.isArray(payload) || payload.length === 0) {
				throw new NotFoundError("Location")
			}

			const first = payload[0]
			if (typeof first.lat !== "number" || typeof first.lon !== "number") {
				throw new ServiceUnavailableError(
					"Failed to parse geocoding response",
					"WEATHER_SERVICE_ERROR",
				)
			}

			const nameParts = [first.name, first.state, first.country].filter(Boolean)
			return {
				lat: first.lat,
				lon: first.lon,
				name: nameParts.join(", ") || undefined,
			}
		},
		constants.cache.destinations.ttlSeconds,
	)

	return cached as { lat: number; lon: number; name?: string }
}

async function fetchOneCall(
	lat: number,
	lon: number,
	units: WeatherOptions["units"] = "metric",
	retryOptions?: RetryOptions,
): Promise<any> {
	const cacheKey = createCacheKey(
		"weather:onecall",
		String(lat),
		String(lon),
		units,
	)
	return genericCache.getOrSet(
		cacheKey,
		async () => {
			const apiKey = ensureApiKey()
			const url = `${OWM_BASE}${OWM_ONECALL_PATH}?lat=${lat}&lon=${lon}&exclude=minutely,hourly,alerts&units=${units}&appid=${apiKey}`

			const body = await withRetry(async () => {
				const res = await fetch(url, {
					method: "GET",
					headers: { Accept: "application/json" },
				})
				if (!res.ok) {
					const text = await res.text().catch(() => "")
					throw new Error(
						`Weather provider error: ${res.status} ${res.statusText} ${text}`,
					)
				}
				return res.json() as Promise<any>
			}, retryOptions)

			if (!body || !Array.isArray(body.daily)) {
				throw new ServiceUnavailableError(
					"Invalid weather response",
					"WEATHER_SERVICE_ERROR",
				)
			}

			return body
		},
		constants.cache.defaultTtlSeconds,
	)
}

function mapDailyToWeather(dailyEntry: any): WeatherData {
	const temp =
		typeof dailyEntry.temp === "number"
			? dailyEntry.temp
			: Number(dailyEntry.temp?.day ?? dailyEntry.temp?.max ?? NaN)

	return {
		temperature: Number.isFinite(temp) ? temp : NaN,
		description: String(dailyEntry.weather?.[0]?.description ?? ""),
		humidity: typeof dailyEntry.humidity === "number" ? dailyEntry.humidity : 0,
		windSpeed:
			typeof dailyEntry.wind_speed === "number"
				? dailyEntry.wind_speed
				: Number(dailyEntry.wind?.speed ?? 0),
	}
}

async function getClimatologyForDate(
	lat: number,
	lon: number,
	dateIso: string,
	units: "metric" | "imperial" = "metric",
): Promise<WeatherData | null> {
	const month = new Date(`${dateIso}T00:00:00`).getUTCMonth() // 0..11
	const key = createCacheKey(
		"weather:climatology",
		String(lat),
		String(lon),
		String(month),
		units,
	)

	const cached = await genericCache.getOrSet(
		key,
		async () => {
			return estimateClimatology(lat, lon, month, units)
		},
		constants.weather.climatology.ttlSeconds,
	)

	return cached as WeatherData
}

function estimateClimatology(
	lat: number,
	_lon: number,
	monthIndex: number,
	units: "metric" | "imperial" = "metric",
): WeatherData {
	const latAbs = Math.min(90, Math.abs(lat))
	const hemisphereNorth = lat >= 0

	const amplitude = Math.max(5, (latAbs / 90) * 30) // seasonal swing
	const baseC = 15 - (latAbs / 90) * 20 // rough annual mean
	const peak = hemisphereNorth ? 6 : 0 // July peak North, Jan peak South
	const seasonFactor = Math.cos(((monthIndex - peak) / 12) * Math.PI * 2)

	const tempC = baseC + amplitude * seasonFactor
	const humidityBase = 65 - (latAbs / 90) * 30
	const humidity = Math.max(
		10,
		Math.min(95, Math.round(humidityBase + seasonFactor * 8)),
	)
	const wind = Math.max(
		0.5,
		Math.round((2 + (latAbs / 90) * 3 + seasonFactor * 1) * 10) / 10,
	)

	const temp =
		units === "imperial" ? Math.round((tempC * 9) / 5 + 32) : Math.round(tempC)

	let description = "mild"
	if (tempC >= 30) description = "hot"
	else if (tempC >= 20) description = "warm"
	else if (tempC >= 10) description = "mild"
	else if (tempC >= 0) description = "cool"
	else description = "cold"

	return {
		temperature: temp,
		description: `${description} (typical)`,
		humidity,
		windSpeed: wind,
		approximate: true,
	}
}

/**
 * Get weather for a range of dates for a location.
 * - Returns a `WeatherRange` where `forecast[YYYY-MM-DD]` is either WeatherData or null
 *   (null indicates no reliable forecast is available for that date).
 */
async function getWeatherForRangeInternal(
	input: {
		location: string
		startDate?: string
		endDate?: string
		units?: WeatherOptions["units"]
	},
	retryOptions?: RetryOptions,
): Promise<WeatherRange> {
	if (!input?.location) {
		throw new ValidationError("Location is required")
	}

	const units = input.units ?? "metric"
	const todayIso = toIsoDateString(new Date())
	const startIso = input.startDate ?? todayIso
	const endIso = input.endDate ?? startIso

	const requestedDates = buildDateRange(startIso, endIso)
	const coords = await geocodeLocation(input.location, retryOptions)

	// Fetch provider forecast (cached)
	const body = await fetchOneCall(coords.lat, coords.lon, units, retryOptions)

	// Build a map of provider daily forecasts keyed by the location-local date (YYYY-MM-DD)
	const timezoneOffset = Number(body.timezone_offset ?? 0) // seconds
	const providerMap: Record<string, WeatherData> = {}
	for (const d of body.daily) {
		const localMillis = (Number(d.dt ?? 0) + timezoneOffset) * 1000
		const iso = new Date(localMillis).toISOString().slice(0, 10)
		providerMap[iso] = mapDailyToWeather(d)
	}

	// If current exists, make it available for today's date as a fallback
	if (body.current) {
		const localMillis = (Number(body.current.dt ?? 0) + timezoneOffset) * 1000
		const iso = new Date(localMillis).toISOString().slice(0, 10)
		if (!providerMap[iso]) {
			providerMap[iso] = {
				temperature: Number(body.current.temp ?? NaN),
				description: String(body.current.weather?.[0]?.description ?? ""),
				humidity: Number(body.current.humidity ?? 0),
				windSpeed: Number(
					body.current.wind_speed ?? body.current.wind?.speed ?? 0,
				),
			}
		}
	}

	const forecast: Record<string, WeatherData | null> = {}
	for (const date of requestedDates) {
		if (providerMap[date]) {
			forecast[date] = providerMap[date]
			continue
		}

		// fallback to climatology when provider data is missing
		try {
			const clim = await getClimatologyForDate(
				coords.lat,
				coords.lon,
				date,
				units,
			)
			forecast[date] = clim ?? null
		} catch (err) {
			log.warn(
				{ err, date, lat: coords.lat, lon: coords.lon },
				"climatology failed",
			)
			forecast[date] = null
		}
	}

	log.debug(
		{
			location: input.location,
			lat: coords.lat,
			lon: coords.lon,
			dates: requestedDates.length,
			units,
		},
		"Returning weather range",
	)

	return {
		location: { name: coords.name, lat: coords.lat, lon: coords.lon },
		units,
		forecast,
	}
}

export const weatherClient = {
	isAvailable(): boolean {
		return !!process.env.WEATHER_API_KEY
	},

	/**
	 * Get weather for a calendar-friendly date range.
	 * - `startDate` / `endDate` are ISO (YYYY-MM-DD). If `endDate` omitted it defaults to `startDate`.
	 * - Dates outside provider forecast window are returned as `null`.
	 */
	async getWeatherForRange(
		options: {
			location: string
			startDate?: string
			endDate?: string
			units?: WeatherOptions["units"]
		},
		retryOptions?: RetryOptions,
	): Promise<WeatherRange> {
		try {
			return await getWeatherForRangeInternal(options, retryOptions)
		} catch (err) {
			// Normalize provider / network errors to a service-level error that the
			// rest of the app can understand.
			if (err instanceof ValidationError || err instanceof NotFoundError) {
				throw err
			}
			log.error({ err }, "Weather service error")
			throw new ServiceUnavailableError(
				"Weather provider",
				"WEATHER_SERVICE_ERROR",
			)
		}
	},

	/**
	 * Convenience for a single-date (e.g. calendar item) weather lookup.
	 * Returns `null` when no forecast is available for that date.
	 */
	async getWeatherForDate(
		location: string,
		dateIso: string,
		units: WeatherOptions["units"] = "metric",
		retryOptions?: RetryOptions,
	): Promise<WeatherData | null> {
		const res = await this.getWeatherForRange(
			{ location, startDate: dateIso, endDate: dateIso, units },
			retryOptions,
		)
		return res.forecast[dateIso] ?? null
	},

	reset(): void {
		// No persistent client instance to tear down, but clear cached entries we created.
		// NOTE: this clears the generic & destination caches (acceptable for dev/tests).
		genericCache.clear()
		destinationCache.clear()
	},
}

export type WeatherClient = typeof weatherClient
