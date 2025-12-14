/**
 * Auth Routes
 *
 * HTTP endpoints for authentication: registration, login, logout, and user info.
 * All business logic is delegated to authService.
 * Sets HTTP-only cookies for secure session management.
 */

import { Hono } from "hono"
import { deleteCookie, setCookie } from "hono/cookie"
import { handleError } from "../lib/errors"
import { loginSchema, registerSchema } from "../lib/schemas"
import { authMiddleware } from "../middleware/auth.middleware"
import { authService } from "../services/auth.service"

const router = new Hono()

// Cookie configuration
const COOKIE_NAME = "holiyay_session"
const COOKIE_OPTIONS = {
	httpOnly: true,
	secure: process.env.NODE_ENV === "production",
	sameSite: "lax" as const,
	path: "/",
	maxAge: 60 * 60 * 24 * 7, // 7 days
}

router.post("/register", async (c) => {
	const body = await c.req.json()

	const result = registerSchema.safeParse(body)
	if (!result.success) {
		return c.json(
			{ error: "Validation error", details: result.error.flatten() },
			400,
		)
	}

	try {
		const authResult = await authService.register(result.data)

		// Set HTTP-only cookie
		setCookie(c, COOKIE_NAME, authResult.tokens.accessToken, COOKIE_OPTIONS)

		return c.json(
			{
				user: authResult.user,
				expiresIn: authResult.tokens.expiresIn,
				accessToken: authResult.tokens.accessToken,
			},
			201,
		)
	} catch (error) {
		return handleError(c, error)
	}
})

router.post("/login", async (c) => {
	const body = await c.req.json()

	const result = loginSchema.safeParse(body)
	if (!result.success) {
		return c.json(
			{ error: "Validation error", details: result.error.flatten() },
			400,
		)
	}

	try {
		const authResult = await authService.login(result.data)

		// Set HTTP-only cookie
		setCookie(c, COOKIE_NAME, authResult.tokens.accessToken, COOKIE_OPTIONS)

		return c.json({
			user: authResult.user,
			expiresIn: authResult.tokens.expiresIn,
			accessToken: authResult.tokens.accessToken,
		})
	} catch (error) {
		return handleError(c, error)
	}
})

router.post("/logout", authMiddleware, async (c) => {
	const authHeader = c.req.header("Authorization")
	const token = authHeader?.replace("Bearer ", "") ?? ""

	await authService.logout(token)

	// Delete session cookie
	deleteCookie(c, COOKIE_NAME)

	return c.json({ message: "Logged out successfully" })
})

router.get("/me", authMiddleware, async (c) => {
	const user = c.get("user")

	try {
		const freshUser = await authService.getUserById(user.id)
		return c.json({ user: freshUser })
	} catch (error) {
		return handleError(c, error)
	}
})

export { router as authRoutes }
