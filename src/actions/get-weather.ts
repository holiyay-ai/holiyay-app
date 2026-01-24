"use server"

import { cookies } from "next/headers"
import type { WeatherRange } from "@/api/types"
import api from "@/lib/api"

/**
 * Server action: fetch weather for a location / date range.
 *
 * - Uses the user's session cookie (if present) to call the authenticated API.
 * - Throws when the API returns an error.
 */
export async function getWeatherAction(input: {
	location: string
	startDate?: string
	endDate?: string
	units?: "metric" | "imperial"
}): Promise<WeatherRange> {
	const { location, startDate, endDate, units } = input ?? {}

	if (!location) {
		throw new Error("Location is required")
	}

	const cookieStore = await cookies()
	const token = cookieStore.get("holiyay_session")?.value || ""

	const result = await api.weather.get(token, {
		location,
		startDate,
		endDate,
		units,
	})

	if (result.error) {
		// Keep behavior consistent with other actions: surface API error to caller
		throw result.error
	}

	return result.data
}
