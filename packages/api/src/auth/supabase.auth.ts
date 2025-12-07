/**
 * Supabase Auth Adapter
 *
 * Authentication adapter for Supabase Auth. Used in production when
 * AUTH_PROVIDER=supabase. Handles user registration, login, and token
 * verification via Supabase's auth service.
 *
 * Requires environment variables:
 * - SUPABASE_URL
 * - SUPABASE_SERVICE_ROLE_KEY (server-side only, never expose to client)
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js"
import {
	type AuthAdapter,
	AuthError,
	type AuthResult,
	type AuthTokens,
	type AuthUser,
	type LoginInput,
	type RegisterInput,
} from "./adapter"

let supabaseClient: SupabaseClient | null = null

function getSupabaseClient(): SupabaseClient {
	if (supabaseClient) {
		return supabaseClient
	}

	const url = process.env.SUPABASE_URL
	const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

	if (!url) {
		throw new Error("SUPABASE_URL environment variable is required")
	}

	if (!serviceRoleKey) {
		throw new Error(
			"SUPABASE_SERVICE_ROLE_KEY environment variable is required",
		)
	}

	supabaseClient = createClient(url, serviceRoleKey, {
		auth: {
			autoRefreshToken: false,
			persistSession: false,
		},
	})

	return supabaseClient
}

function mapSupabaseError(message: string): AuthError {
	const lowerMessage = message.toLowerCase()

	if (lowerMessage.includes("already registered")) {
		return new AuthError(
			"User with this email already exists",
			"USER_ALREADY_EXISTS",
		)
	}
	if (lowerMessage.includes("invalid login")) {
		return new AuthError("Invalid email or password", "INVALID_CREDENTIALS")
	}
	if (lowerMessage.includes("invalid email")) {
		return new AuthError("Invalid email format", "INVALID_EMAIL")
	}
	if (lowerMessage.includes("password")) {
		return new AuthError("Password does not meet requirements", "WEAK_PASSWORD")
	}
	if (lowerMessage.includes("expired")) {
		return new AuthError("Token has expired", "TOKEN_EXPIRED")
	}
	if (lowerMessage.includes("invalid") && lowerMessage.includes("token")) {
		return new AuthError("Invalid token", "INVALID_TOKEN")
	}

	return new AuthError(message, "UNKNOWN_ERROR")
}

export function createSupabaseAuthAdapter(): AuthAdapter {
	return {
		async register(input: RegisterInput): Promise<AuthResult> {
			const supabase = getSupabaseClient()

			const { data, error } = await supabase.auth.signUp({
				email: input.email,
				password: input.password,
				options: {
					data: {
						name: input.name,
					},
				},
			})

			if (error) {
				throw mapSupabaseError(error.message)
			}

			if (!data.user || !data.session) {
				throw new AuthError(
					"Registration failed: no user or session returned",
					"UNKNOWN_ERROR",
				)
			}

			return {
				user: {
					id: data.user.id,
					email: data.user.email ?? input.email,
					name: data.user.user_metadata?.name ?? input.name,
					avatarUrl: data.user.user_metadata?.avatar_url ?? null,
				},
				tokens: {
					accessToken: data.session.access_token,
					refreshToken: data.session.refresh_token,
					expiresIn: data.session.expires_in ?? 3600,
				},
			}
		},

		async login(input: LoginInput): Promise<AuthResult> {
			const supabase = getSupabaseClient()

			const { data, error } = await supabase.auth.signInWithPassword({
				email: input.email,
				password: input.password,
			})

			if (error) {
				throw mapSupabaseError(error.message)
			}

			if (!data.user || !data.session) {
				throw new AuthError(
					"Login failed: no user or session returned",
					"INVALID_CREDENTIALS",
				)
			}

			return {
				user: {
					id: data.user.id,
					email: data.user.email ?? input.email,
					name: data.user.user_metadata?.name ?? "",
					avatarUrl: data.user.user_metadata?.avatar_url ?? null,
				},
				tokens: {
					accessToken: data.session.access_token,
					refreshToken: data.session.refresh_token,
					expiresIn: data.session.expires_in ?? 3600,
				},
			}
		},

		async logout(accessToken: string): Promise<void> {
			const supabase = getSupabaseClient()

			// Sign out the user associated with this token
			// Note: Supabase's signOut invalidates the session server-side
			await supabase.auth.admin.signOut(accessToken)
		},

		async verifyToken(accessToken: string): Promise<AuthUser | null> {
			const supabase = getSupabaseClient()

			const { data, error } = await supabase.auth.getUser(accessToken)

			if (error || !data.user) {
				return null
			}

			return {
				id: data.user.id,
				email: data.user.email ?? "",
				name: data.user.user_metadata?.name ?? "",
				avatarUrl: data.user.user_metadata?.avatar_url ?? null,
			}
		},

		async refreshToken(refreshToken: string): Promise<AuthTokens> {
			const supabase = getSupabaseClient()

			const { data, error } = await supabase.auth.refreshSession({
				refresh_token: refreshToken,
			})

			if (error) {
				throw mapSupabaseError(error.message)
			}

			if (!data.session) {
				throw new AuthError("Failed to refresh token", "INVALID_TOKEN")
			}

			return {
				accessToken: data.session.access_token,
				refreshToken: data.session.refresh_token,
				expiresIn: data.session.expires_in ?? 3600,
			}
		},

		async getUserById(id: string): Promise<AuthUser | null> {
			const supabase = getSupabaseClient()

			const { data, error } = await supabase.auth.admin.getUserById(id)

			if (error || !data.user) {
				return null
			}

			return {
				id: data.user.id,
				email: data.user.email ?? "",
				name: data.user.user_metadata?.name ?? "",
				avatarUrl: data.user.user_metadata?.avatar_url ?? null,
			}
		},

		async getUserByEmail(email: string): Promise<AuthUser | null> {
			const supabase = getSupabaseClient()

			// Supabase doesn't have a direct "get by email" for admin
			// We need to list users and filter, or use a different approach
			const { data, error } = await supabase.auth.admin.listUsers()

			if (error || !data.users) {
				return null
			}

			const user = data.users.find((u) => u.email === email)

			if (!user) {
				return null
			}

			return {
				id: user.id,
				email: user.email ?? "",
				name: user.user_metadata?.name ?? "",
				avatarUrl: user.user_metadata?.avatar_url ?? null,
			}
		},
	}
}
