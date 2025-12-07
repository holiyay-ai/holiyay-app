/**
 * Auth Routes
 *
 * HTTP endpoints for authentication: registration, login, logout, and user info.
 * All business logic is delegated to authService.
 */

import { Hono } from "hono"
import { handleError } from "../lib/errors"
import { loginSchema, registerSchema } from "../lib/schemas"
import { authMiddleware } from "../middleware/auth.middleware"
import { authService } from "../services/auth.service"

const router = new Hono()

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

		return c.json(
			{
				user: authResult.user,
				accessToken: authResult.tokens.accessToken,
				expiresIn: authResult.tokens.expiresIn,
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

		return c.json({
			user: authResult.user,
			accessToken: authResult.tokens.accessToken,
			expiresIn: authResult.tokens.expiresIn,
		})
	} catch (error) {
		return handleError(c, error)
	}
})

router.post("/logout", authMiddleware, async (c) => {
	const authHeader = c.req.header("Authorization")
	const token = authHeader?.replace("Bearer ", "") ?? ""

	await authService.logout(token)

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
