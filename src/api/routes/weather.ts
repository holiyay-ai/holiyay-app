/**
 * Weather Routes
 *
 * Exposes a small, authenticated HTTP surface for fetching weather data
 * for calendar date ranges. Delegates to the provider-agnostic `weatherClient`.
 *
 * Endpoints:
 *  - GET /api/weather?location=...&startDate=YYYY-MM-DD&endDate=YYYY-MM-DD&units=metric|imperial
 *  - GET /api/weather/status
 *
 * Notes:
 *  - The route validates input and returns per-date weather (or `null` when
 *    a reliable forecast isn't available for that date).
 *  - Authentication is required (keeps usage consistent with other calendar APIs).
 */

import { Hono } from "hono"
import { z } from "zod"
import { weatherClient } from "../external/weather.client"
import { handleError } from "../lib/errors"
import { authMiddleware } from "../middleware/auth.middleware"

const router = new Hono()

router.use("*", authMiddleware)

const isoDateRegex = /^\d{4}-\d{2}-\d{2}$/

const querySchema = z
	.object({
		location: z.string().min(1, "Location is required"),
		startDate: z.string().regex(isoDateRegex).optional(),
		endDate: z.string().regex(isoDateRegex).optional(),
		units: z.enum(["metric", "imperial"]).optional(),
	})
	.refine(
		(vals) =>
			!vals.endDate ||
			(!vals.startDate ? true : vals.startDate <= vals.endDate),
		{
			message: "endDate must be greater than or equal to startDate",
			path: ["endDate"],
		},
	)

/**
 * Status — indicates whether server-side weather features are configured.
 */
router.get("/status", (c) => {
	const available = weatherClient.isAvailable()
	return c.json({
		available,
		message: available
			? "Weather features are available"
			: "Weather features are not configured. Set WEATHER_API_KEY to enable.",
	})
})

/**
 * GET /
 *
 * Query params:
 *  - location (required)
 *  - startDate (YYYY-MM-DD) optional
 *  - endDate (YYYY-MM-DD) optional
 *  - units (metric|imperial) optional
 *
 * Returns the same structured object produced by `weatherClient.getWeatherForRange`.
 */
router.get("/", async (c) => {
	const raw = {
		location: c.req.query("location") ?? "",
		startDate: c.req.query("startDate") ?? undefined,
		endDate: c.req.query("endDate") ?? undefined,
		units:
			(c.req.query("units") as "metric" | "imperial" | undefined) ?? undefined,
	}

	const parsed = querySchema.safeParse(raw)
	if (!parsed.success) {
		return c.json(
			{ error: "Validation error", details: parsed.error.flatten() },
			400,
		)
	}

	try {
		// If caller supplied endDate but not startDate, treat it as a single-day query.
		const { location, startDate: sDate, endDate: eDate, units } = parsed.data
		const startDate = sDate ?? eDate ?? undefined
		const endDate = eDate ?? startDate

		const result = await weatherClient.getWeatherForRange({
			location,
			startDate,
			endDate,
			units,
		})

		return c.json(result)
	} catch (err) {
		// Let centralized handler normalize known AppErrors
		return handleError(c, err)
	}
})

export { router as weatherRoutes }
