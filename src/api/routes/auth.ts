/**
 * Auth Routes
 *
 * HTTP endpoints for authentication: registration, login, logout, and user info.
 * All business logic is delegated to authService.
 * Sets HTTP-only cookies for secure session management.
 */

import type { Provider } from "@supabase/supabase-js"
import { Hono } from "hono"
import { deleteCookie, setCookie } from "hono/cookie"
import { treeifyError } from "zod"
import { getSupabaseClient } from "../auth/supabase.auth"
import { handleError } from "../lib/errors"
import { loginSchema, registerSchema } from "../lib/schemas"
import { authMiddleware } from "../middleware/auth.middleware"
import { authService } from "../services/auth.service"

const router = new Hono()

// Cookie configuration
const COOKIE_NAME = "holiyay_session"

router.post("/register", async (c) => {
	const body = await c.req.json()

	const result = registerSchema.safeParse(body)
	if (!result.success) {
		return c.json(
			{ error: "Validation error", details: treeifyError(result.error) },
			400,
		)
	}

	try {
		const authResult = await authService.register(result.data)

		if (!authResult.tokens) {
			// Email verification required - no session created yet
			return c.json(
				{
					user: authResult.user,
					code: "EMAIL_VERIFICATION_REQUIRED",
					message: "Please verify your email address to complete registration",
				},
				200,
			)
		}

		// Set HTTP-only cookie
		setCookie(c, COOKIE_NAME, authResult.tokens.accessToken, {
			httpOnly: true,
			secure: process.env.NODE_ENV === "production",
			sameSite: "lax",
			maxAge: authResult.tokens.expiresIn,
		})

		return c.json(
			{
				user: authResult.user,
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
			{ error: "Validation error", details: treeifyError(result.error) },
			400,
		)
	}

	try {
		const authResult = await authService.login(result.data)

		if (!authResult.tokens) {
			return c.json({ error: "No tokens returned from login" }, 500)
		}

		// Set HTTP-only cookie
		setCookie(c, COOKIE_NAME, authResult.tokens.accessToken, {
			httpOnly: true,
			secure: process.env.NODE_ENV === "production",
			sameSite: "strict",
			maxAge: authResult.tokens.expiresIn,
		})

		return c.json({
			user: authResult.user,
		})
	} catch (error) {
		return handleError(c, error)
	}
})

router.get("/oauth/:provider", async (c) => {
	const provider = c.req.param("provider")

	const redirectTo =
		c.req.query?.("redirectTo") ??
		`${c.req.header("x-forwarded-proto") ?? "https"}://${c.req.header(
			"host",
		)}/auth/oauth/callback`

	console.log("OAuth redirectTo:", redirectTo)

	try {
		// Use server supabase client (service role key)
		const supabase = getSupabaseClient()

		const { data, error } = await supabase.auth.signInWithOAuth({
			provider: provider as Provider,
			options: { redirectTo },
		})

		if (error) {
			return c.json({ error: error.message }, 400)
		}

		if (!data?.url) {
			return c.json({ error: "Failed to get redirect URL from supabase" }, 500)
		}

		// Redirect browser to Supabase/GCP Google consent page
		return c.redirect(data.url)
	} catch (err) {
		return handleError(c, err)
	}
})

router.post("/oauth/callback", async (c) => {
	const body = await c.req.json().catch(() => ({}))
	const { accessToken, refreshToken, expiresIn } = body ?? {}

	if (!accessToken) {
		return c.json({ error: "accessToken is required" }, 400)
	}

	try {
		// Verify and build an AuthResult
		const authResult = await authService.exchangeOAuthSession({
			accessToken,
			refreshToken,
			expiresIn,
		})

		if (!authResult.tokens) {
			return c.json({ error: "No tokens returned from OAuth exchange" }, 500)
		}

		// Set HTTP-only cookie
		setCookie(c, COOKIE_NAME, authResult.tokens.accessToken, {
			httpOnly: true,
			secure: process.env.NODE_ENV === "production",
			sameSite: "strict",
			maxAge: authResult.tokens.expiresIn,
		})

		return c.json({
			user: authResult.user,
		})
	} catch (err) {
		return handleError(c, err)
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
