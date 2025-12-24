/**
 * Auth Service
 *
 * Provides authentication operations using the configured auth adapter.
 * The underlying provider (JWT or Supabase) is selected via the
 * AUTH_PROVIDER environment variable.
 *
 * This service wraps the auth adapter and provides a consistent API
 * for routes to use, with additional application-specific logic.
 */

import { AuthError } from "../auth/adapter"
import { getAuthAdapter } from "../auth/factory"
import {
	ConflictError,
	EmailRequiredConfirmation,
	NotFoundError,
	UnauthorizedError,
	ValidationError,
} from "../lib/errors"
import type { AuthResult, AuthUser } from "../types"

export interface RegisterInput {
	email: string
	password: string
	name: string
}

export interface LoginInput {
	email: string
	password: string
}

function mapAuthError(error: unknown): never {
	if (error instanceof AuthError) {
		switch (error.code) {
			case "USER_ALREADY_EXISTS":
				throw new ConflictError(error.message, "USER_ALREADY_EXISTS")
			case "INVALID_CREDENTIALS":
				throw new UnauthorizedError(error.message, "INVALID_CREDENTIALS")
			case "USER_NOT_FOUND":
				throw new NotFoundError("User")
			case "WEAK_PASSWORD":
			case "INVALID_EMAIL":
				throw new ValidationError(error.message)
			case "INVALID_TOKEN":
			case "TOKEN_EXPIRED":
				throw new UnauthorizedError(error.message, error.code)
			case "EMAIL_NOT_CONFIRMED":
				throw new EmailRequiredConfirmation(error.message)
			default:
				throw new UnauthorizedError(error.message, "AUTH_ERROR")
		}
	}

	throw error
}

export const authService = {
	async register(input: RegisterInput): Promise<AuthResult> {
		const adapter = getAuthAdapter()

		try {
			return await adapter.register(input)
		} catch (error) {
			mapAuthError(error)
		}
	},

	async login(input: LoginInput): Promise<AuthResult> {
		const adapter = getAuthAdapter()

		try {
			return await adapter.login(input)
		} catch (error) {
			mapAuthError(error)
		}
	},

	async logout(accessToken: string): Promise<void> {
		const adapter = getAuthAdapter()
		await adapter.logout(accessToken)
	},

	async verifyAccessToken(accessToken: string): Promise<AuthUser | null> {
		const adapter = getAuthAdapter()
		return await adapter.verifyToken(accessToken)
	},

	async getUserById(userId: string): Promise<AuthUser> {
		const adapter = getAuthAdapter()
		const user = await adapter.getUserById(userId)

		if (!user) {
			throw new NotFoundError("User")
		}

		return user
	},

	async getUserByEmail(email: string): Promise<AuthUser | null> {
		const adapter = getAuthAdapter()
		return await adapter.getUserByEmail(email)
	},

	async exchangeOAuthSession(input: {
		accessToken: string
		refreshToken?: string
		expiresIn?: number
	}): Promise<AuthResult> {
		const adapter = getAuthAdapter()

		// verify token using the adapter (supabase adapter checks supabase.auth.getUser)
		const user = await adapter.verifyToken(input.accessToken)
		if (!user) {
			// keep error types consistent
			throw new UnauthorizedError("Invalid or expired token")
		}

		return {
			user,
			tokens: {
				accessToken: input.accessToken,
				refreshToken: input.refreshToken,
				expiresIn: input.expiresIn ?? 3600,
			},
		}
	},
}

export type AuthService = typeof authService
