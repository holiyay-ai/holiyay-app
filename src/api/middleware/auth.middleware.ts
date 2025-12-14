/**
 * Auth Middleware
 *
 * Provider-agnostic authentication middleware for Hono. Uses the configured
 * auth adapter to verify tokens, supporting both JWT and Supabase auth.
 *
 * Provides two variants:
 * - authMiddleware: Requires valid authentication, rejects unauthenticated requests
 * - optionalAuthMiddleware: Attaches user if token present, allows anonymous access
 *
 * Extends Hono's context with a typed 'user' variable containing id, email, and name.
 */

import type { Context, Next } from "hono"
import { HTTPException } from "hono/http-exception"
import { getAuthAdapter } from "../auth/factory"

export interface AuthUser {
	id: string
	email: string
	name: string
	avatarUrl?: string | null
}

declare module "hono" {
	interface ContextVariableMap {
		user: AuthUser
	}
}

function extractBearerToken(authHeader: string | undefined): string | null {
	if (!authHeader) return null

	const parts = authHeader.split(" ")
	if (parts.length !== 2 || parts[0] !== "Bearer") {
		return null
	}

	return parts[1] ?? null
}

export const authMiddleware = async (c: Context, next: Next) => {
	const authHeader = c.req.header("Authorization")

	if (!authHeader) {
		throw new HTTPException(401, {
			message: "Authorization header required",
		})
	}

	const token = extractBearerToken(authHeader)

	if (!token) {
		throw new HTTPException(401, {
			message: "Invalid authorization format. Use: Bearer <token>",
		})
	}

	try {
		const adapter = getAuthAdapter()
		const user = await adapter.verifyToken(token)

		if (!user) {
			throw new HTTPException(401, {
				message: "Invalid or expired token",
			})
		}

		c.set("user", {
			id: user.id,
			email: user.email,
			name: user.name,
			avatarUrl: user.avatarUrl ?? null,
		})

		await next()
	} catch (error) {
		if (error instanceof HTTPException) {
			throw error
		}
		throw new HTTPException(401, { message: "Invalid or expired token" })
	}
}

export const optionalAuthMiddleware = async (c: Context, next: Next) => {
	const authHeader = c.req.header("Authorization")
	const token = extractBearerToken(authHeader)

	if (!token) {
		await next()
		return
	}

	try {
		const adapter = getAuthAdapter()
		const user = await adapter.verifyToken(token)

		if (user) {
			c.set("user", {
				id: user.id,
				email: user.email,
				name: user.name,
				avatarUrl: user.avatarUrl ?? null,
			})
		}
	} catch {
		// Token invalid, continue without user
	}

	await next()
}
