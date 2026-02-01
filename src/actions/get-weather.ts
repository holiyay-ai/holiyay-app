"use server"

import { type WeatherRange, weatherService } from "@/services/weather.service"

/**
 * Server action: fetch weather for a location / date range.
 *
 * - Calls the weather service directly (no HTTP layer).
 * - Throws when the service returns an error.
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

	return await weatherService.getWeatherForRange({
		location,
		startDate,
		endDate,
		units,
	})
}
