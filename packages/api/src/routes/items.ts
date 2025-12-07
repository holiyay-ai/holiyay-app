/**
 * Item Routes
 *
 * HTTP endpoints for calendar items: list, create, read, update, delete,
 * reorder, duplicate, and move. All routes require authentication.
 * Business logic is delegated to itemService.
 */

import { Hono } from "hono"
import { handleError } from "../lib/errors"
import {
	createItemSchema,
	reorderItemsSchema,
	updateItemSchema,
} from "../lib/schemas"
import { authMiddleware } from "../middleware/auth.middleware"
import { itemService } from "../services/item.service"

const router = new Hono()

router.get("/calendars/:calendarId/items", authMiddleware, async (c) => {
	const user = c.get("user")
	const calendarId = c.req.param("calendarId")

	try {
		const items = await itemService.listByCalendar(calendarId, user.id)
		return c.json(items)
	} catch (error) {
		return handleError(c, error)
	}
})

router.post("/calendars/:calendarId/items", authMiddleware, async (c) => {
	const user = c.get("user")
	const calendarId = c.req.param("calendarId")
	const body = await c.req.json()

	const result = createItemSchema.safeParse(body)
	if (!result.success) {
		return c.json(
			{ error: "Validation error", details: result.error.flatten() },
			400,
		)
	}

	try {
		const item = await itemService.create(calendarId, user.id, result.data)
		return c.json(item, 201)
	} catch (error) {
		return handleError(c, error)
	}
})

router.post(
	"/calendars/:calendarId/items/reorder",
	authMiddleware,
	async (c) => {
		const user = c.get("user")
		const calendarId = c.req.param("calendarId")
		const body = await c.req.json()

		const result = reorderItemsSchema.safeParse(body)
		if (!result.success) {
			return c.json(
				{ error: "Validation error", details: result.error.flatten() },
				400,
			)
		}

		try {
			await itemService.reorder(calendarId, user.id, result.data.items)
			return c.json({ success: true })
		} catch (error) {
			return handleError(c, error)
		}
	},
)

router.get("/items/:itemId", authMiddleware, async (c) => {
	const user = c.get("user")
	const itemId = c.req.param("itemId")

	try {
		const item = await itemService.getById(itemId, user.id)
		return c.json(item)
	} catch (error) {
		return handleError(c, error)
	}
})

router.patch("/items/:itemId", authMiddleware, async (c) => {
	const user = c.get("user")
	const itemId = c.req.param("itemId")
	const body = await c.req.json()

	const result = updateItemSchema.safeParse(body)
	if (!result.success) {
		return c.json(
			{ error: "Validation error", details: result.error.flatten() },
			400,
		)
	}

	try {
		const updated = await itemService.update(itemId, user.id, result.data)
		return c.json(updated)
	} catch (error) {
		return handleError(c, error)
	}
})

router.delete("/items/:itemId", authMiddleware, async (c) => {
	const user = c.get("user")
	const itemId = c.req.param("itemId")

	try {
		await itemService.delete(itemId, user.id)
		return c.json({ success: true })
	} catch (error) {
		return handleError(c, error)
	}
})

router.post("/items/:itemId/duplicate", authMiddleware, async (c) => {
	const user = c.get("user")
	const itemId = c.req.param("itemId")
	const body = await c.req.json().catch(() => ({}))

	const targetDate = body.targetDate as string | undefined

	try {
		const duplicated = await itemService.duplicate(itemId, user.id, targetDate)
		return c.json(duplicated, 201)
	} catch (error) {
		return handleError(c, error)
	}
})

router.post("/items/:itemId/move", authMiddleware, async (c) => {
	const user = c.get("user")
	const itemId = c.req.param("itemId")
	const body = await c.req.json()

	const newDate = body.date as string | undefined
	if (!newDate) {
		return c.json({ error: "date is required" }, 400)
	}

	try {
		const moved = await itemService.moveToDate(itemId, user.id, newDate)
		return c.json(moved)
	} catch (error) {
		return handleError(c, error)
	}
})

export { router as itemRoutes }
