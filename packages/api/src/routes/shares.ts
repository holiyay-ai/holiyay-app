/**
 * Share Routes
 *
 * HTTP endpoints for calendar sharing: generating share links, inviting users,
 * managing permissions, and joining shared calendars via token. Supports both
 * authenticated and public (token-based) access patterns.
 */

import { Hono } from "hono"
import { handleError } from "../lib/errors"
import { inviteSchema, updateShareSchema } from "../lib/schemas"
import {
	authMiddleware,
	optionalAuthMiddleware,
} from "../middleware/auth.middleware"
import { shareService } from "../services/share.service"

const router = new Hono()

router.post("/calendars/:id/share", authMiddleware, async (c) => {
	const user = c.get("user")
	const calendarId = c.req.param("id")

	try {
		const shareLink = await shareService.getShareLink(calendarId, user.id)
		return c.json(shareLink)
	} catch (error) {
		return handleError(c, error)
	}
})

router.post("/calendars/:id/invite", authMiddleware, async (c) => {
	const user = c.get("user")
	const calendarId = c.req.param("id")
	const body = await c.req.json()

	const result = inviteSchema.safeParse(body)
	if (!result.success) {
		return c.json(
			{ error: "Validation error", details: result.error.flatten() },
			400,
		)
	}

	try {
		const { share, isNew } = await shareService.inviteByEmail(
			calendarId,
			user.id,
			result.data,
		)

		const message = isNew ? "Calendar shared successfully" : "Share updated"

		return c.json({ message, share }, isNew ? 201 : 200)
	} catch (error) {
		return handleError(c, error)
	}
})

router.get("/calendars/:id/shares", authMiddleware, async (c) => {
	const user = c.get("user")
	const calendarId = c.req.param("id")

	try {
		const shares = await shareService.listShares(calendarId, user.id)
		return c.json(shares)
	} catch (error) {
		return handleError(c, error)
	}
})

router.patch("/shares/:shareId", authMiddleware, async (c) => {
	const user = c.get("user")
	const shareId = c.req.param("shareId")
	const body = await c.req.json()

	const result = updateShareSchema.safeParse(body)
	if (!result.success) {
		return c.json(
			{ error: "Validation error", details: result.error.flatten() },
			400,
		)
	}

	try {
		const updated = await shareService.updatePermission(
			shareId,
			user.id,
			result.data.permission,
		)
		return c.json(updated)
	} catch (error) {
		return handleError(c, error)
	}
})

router.delete("/shares/:shareId", authMiddleware, async (c) => {
	const user = c.get("user")
	const shareId = c.req.param("shareId")

	try {
		await shareService.removeShare(shareId, user.id)
		return c.json({ success: true })
	} catch (error) {
		return handleError(c, error)
	}
})

router.get("/share/:token", optionalAuthMiddleware, async (c) => {
	const token = c.req.param("token")
	const user = c.get("user")

	try {
		const view = await shareService.viewByToken(token, user?.id)
		return c.json(view)
	} catch (error) {
		return handleError(c, error)
	}
})

router.post("/share/:token/join", authMiddleware, async (c) => {
	const user = c.get("user")
	const token = c.req.param("token")

	try {
		const { share, isNew } = await shareService.joinByToken(token, user.id)

		const message = isNew
			? "Successfully joined calendar"
			: "You already have access to this calendar"

		return c.json({ message, share }, isNew ? 201 : 200)
	} catch (error) {
		return handleError(c, error)
	}
})

export { router as shareRoutes }
