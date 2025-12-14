/**
 * Auth Adapter Interface
 *
 * Abstraction layer for authentication providers. Allows swapping the
 * underlying auth implementation (JWT, Supabase, Lucia, Auth.js) without
 * changing application logic. Define adapters by implementing AuthAdapter.
 */

export interface AuthUser {
	id: string
	email: string
	name: string
	avatarUrl?: string | null
}

export interface AuthTokens {
	accessToken: string
	refreshToken?: string
	expiresIn: number
}

export interface AuthResult {
	user: AuthUser
	tokens: AuthTokens
}

export interface RegisterInput {
	email: string
	password: string
	name: string
}

export interface LoginInput {
	email: string
	password: string
}

export interface AuthAdapter {
	register(input: RegisterInput): Promise<AuthResult>
	login(input: LoginInput): Promise<AuthResult>
	logout(accessToken: string): Promise<void>
	verifyToken(accessToken: string): Promise<AuthUser | null>
	refreshToken?(refreshToken: string): Promise<AuthTokens>
	getUserById(id: string): Promise<AuthUser | null>
	getUserByEmail(email: string): Promise<AuthUser | null>
}

export type AuthErrorCode =
	| "INVALID_CREDENTIALS"
	| "USER_NOT_FOUND"
	| "USER_ALREADY_EXISTS"
	| "INVALID_TOKEN"
	| "TOKEN_EXPIRED"
	| "WEAK_PASSWORD"
	| "INVALID_EMAIL"
	| "UNKNOWN_ERROR"

export class AuthError extends Error {
	constructor(
		message: string,
		public code: AuthErrorCode,
	) {
		super(message)
		this.name = "AuthError"
	}
}
