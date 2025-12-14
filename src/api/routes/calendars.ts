/**
 * Calendar Routes
 *
 * HTTP endpoints for calendar management: list, create, read, update, delete.
 * All routes require authentication. Business logic is delegated to calendarService.
 */

import { Hono } from "hono"
import { handleError } from "../lib/errors"
import { createCalendarSchema, updateCalendarSchema } from "../lib/schemas"
import { authMiddleware } from "../middleware/auth.middleware"
import { calendarService } from "../services/calendar.service"

const router = new Hono()

router.use("*", authMiddleware)

router.get("/", async (c) => {
	const user = c.get("user")

	try {
		const calendars = await calendarService.listForUser(user.id)
		return c.json(calendars)
	} catch (error) {
		return handleError(c, error)
	}
})

router.post("/", async (c) => {
	const user = c.get("user")
	const body = await c.req.json()

	const result = createCalendarSchema.safeParse(body)
	if (!result.success) {
		return c.json(
			{ error: "Validation error", details: result.error.flatten() },
			400,
		)
	}

	try {
		const calendar = await calendarService.create(user.id, result.data)
		return c.json(calendar, 201)
	} catch (error) {
		return handleError(c, error)
	}
})

router.get("/:id", async (c) => {
	const user = c.get("user")
	const calendarId = c.req.param("id")

	try {
		const calendar = await calendarService.getWithItems(calendarId, user.id)
		return c.json(calendar)
	} catch (error) {
		return handleError(c, error)
	}
})

router.patch("/:id", async (c) => {
	const user = c.get("user")
	const calendarId = c.req.param("id")
	const body = await c.req.json()

	const result = updateCalendarSchema.safeParse(body)
	if (!result.success) {
		return c.json(
			{ error: "Validation error", details: result.error.flatten() },
			400,
		)
	}

	try {
		const updated = await calendarService.update(
			calendarId,
			user.id,
			result.data,
		)
		return c.json(updated)
	} catch (error) {
		return handleError(c, error)
	}
})

router.delete("/:id", async (c) => {
	const user = c.get("user")
	const calendarId = c.req.param("id")

	try {
		await calendarService.delete(calendarId, user.id)
		return c.json({ success: true })
	} catch (error) {
		return handleError(c, error)
	}
})

export { router as calendarRoutes }
