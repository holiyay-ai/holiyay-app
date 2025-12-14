/**
 * AI Routes
 *
 * HTTP endpoints for AI-powered features: checklist generation, activity
 * recommendations, and destination suggestions. All routes require authentication.
 * Includes cache management endpoints for monitoring and debugging.
 */

import { Hono } from "hono"
import { ForbiddenError, handleError } from "../lib/errors"
import {
	generateChecklistSchema,
	recommendActivitiesSchema,
} from "../lib/schemas"
import { authMiddleware } from "../middleware/auth.middleware"
import { aiService } from "../services/ai.service"
import { calendarService } from "../services/calendar.service"

const router = new Hono()

router.use("*", authMiddleware)

router.get("/status", (c) => {
	return c.json({
		available: aiService.isAvailable(),
		message: aiService.isAvailable()
			? "AI features are available"
			: "AI features are not configured. Set OPENAI_API_KEY to enable.",
	})
})

router.get("/cache/stats", (c) => {
	const stats = aiService.getCacheStats()
	return c.json({
		caches: stats,
		total: stats.checklists + stats.recommendations + stats.destinations,
	})
})

router.post("/cache/clear", (c) => {
	aiService.clearCache()
	return c.json({ message: "All AI caches cleared" })
})

router.post("/checklist", async (c) => {
	const body = await c.req.json()
	const user = c.get("user")
	const userId = user.id

	const result = generateChecklistSchema.safeParse(body)
	if (!result.success) {
		return c.json(
			{ error: "Validation error", details: result.error.flatten() },
			400,
		)
	}

	try {
		if (result.data.calendarId) {
			const access = await calendarService.checkAccess(
				result.data.calendarId,
				userId,
				true,
			)

			if (!access.hasAccess) {
				throw new ForbiddenError(
					"You don't have permission to add checklists to this calendar",
				)
			}
		}

		const checklist = await aiService.generateChecklist(result.data)
		return c.json(checklist)
	} catch (error) {
		return handleError(c, error)
	}
})

router.post("/recommend", async (c) => {
	const body = await c.req.json()

	const result = recommendActivitiesSchema.safeParse(body)
	if (!result.success) {
		return c.json(
			{ error: "Validation error", details: result.error.flatten() },
			400,
		)
	}

	try {
		const recommendations = await aiService.recommendActivities(result.data)
		return c.json(recommendations)
	} catch (error) {
		return handleError(c, error)
	}
})

router.post("/destinations", async (c) => {
	const body = await c.req.json()

	const preferences = {
		climate: body.climate as
			| "tropical"
			| "temperate"
			| "cold"
			| "any"
			| undefined,
		budget: body.budget as "budget" | "moderate" | "luxury" | undefined,
		interests: Array.isArray(body.interests) ? body.interests : undefined,
		duration: typeof body.duration === "number" ? body.duration : undefined,
	}

	try {
		const destinations = await aiService.suggestDestinations(preferences)
		return c.json({ destinations })
	} catch (error) {
		return handleError(c, error)
	}
})

export { router as aiRoutes }
