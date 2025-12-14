/**
 * JWT Auth Adapter
 *
 * Local JWT-based authentication adapter. Used for development and
 * standalone deployments without external auth providers.
 *
 * Requires:
 * - JWT_SECRET environment variable
 * - Local PostgreSQL database with users table
 *
 * This adapter manages users in the local database and issues JWTs
 * for stateless authentication.
 */

import bcrypt from "bcryptjs"
import { decode, sign, verify } from "hono/jwt"
import type { JWTPayload } from "hono/utils/jwt/types"
import { userRepository } from "../repositories/user.repository"
import {
	type AuthAdapter,
	AuthError,
	type AuthResult,
	type AuthTokens,
	type AuthUser,
	type LoginInput,
	type RegisterInput,
} from "./adapter"

export interface AuthPayload extends JWTPayload {
	sub: string
	email: string
	name: string
}

const TOKEN_EXPIRY_SECONDS = 60 * 60 * 24 * 7 // 7 days

function getSecret(): string {
	const secret = process.env.JWT_SECRET
	if (!secret) {
		throw new Error("JWT_SECRET environment variable is not set")
	}
	return secret
}

async function hashPassword(password: string): Promise<string> {
	return bcrypt.hash(password, 10)
}

async function verifyPassword(
	password: string,
	hash: string,
): Promise<boolean> {
	return bcrypt.compare(password, hash)
}

export async function createToken(payload: {
	userId: string
	email: string
	name: string
}): Promise<string> {
	const now = Math.floor(Date.now() / 1000)

	const tokenPayload: AuthPayload = {
		sub: payload.userId,
		email: payload.email,
		name: payload.name,
		iat: now,
		exp: now + TOKEN_EXPIRY_SECONDS,
	}

	return await sign(tokenPayload, getSecret())
}

export async function verifyToken(
	token: string | undefined,
): Promise<AuthPayload | null> {
	try {
		const payload = await verify(token || "", getSecret())
		return payload as AuthPayload
	} catch {
		return null
	}
}

export function decodeToken(token: string): AuthPayload | null {
	try {
		const { payload } = decode(token)
		return payload as AuthPayload
	} catch {
		return null
	}
}

export function extractBearerToken(
	authHeader: string | undefined,
): string | null {
	if (!authHeader?.startsWith("Bearer ")) return null
	return authHeader.slice(7)
}

function toAuthUser(user: {
	id: string
	email: string
	name: string
	avatarUrl?: string | null
}): AuthUser {
	return {
		id: user.id,
		email: user.email,
		name: user.name,
		avatarUrl: user.avatarUrl ?? null,
	}
}

export function createJwtAuthAdapter(): AuthAdapter {
	return {
		async register(input: RegisterInput): Promise<AuthResult> {
			if (input.password.length < 8) {
				throw new AuthError(
					"Password must be at least 8 characters",
					"WEAK_PASSWORD",
				)
			}

			const exists = await userRepository.existsByEmail(input.email)
			if (exists) {
				throw new AuthError(
					"User with this email already exists",
					"USER_ALREADY_EXISTS",
				)
			}

			const passwordHash = await hashPassword(input.password)
			const user = await userRepository.create({
				email: input.email,
				name: input.name,
				passwordHash,
			})

			const accessToken = await createToken({
				userId: user.id,
				email: user.email,
				name: user.name,
			})

			return {
				user: toAuthUser(user),
				tokens: {
					accessToken,
					expiresIn: TOKEN_EXPIRY_SECONDS,
				},
			}
		},

		async login(input: LoginInput): Promise<AuthResult> {
			const user = await userRepository.findByEmail(input.email)
			if (!user) {
				throw new AuthError("Invalid email or password", "INVALID_CREDENTIALS")
			}

			const valid = await verifyPassword(input.password, user.passwordHash)
			if (!valid) {
				throw new AuthError("Invalid email or password", "INVALID_CREDENTIALS")
			}

			const accessToken = await createToken({
				userId: user.id,
				email: user.email,
				name: user.name,
			})

			return {
				user: toAuthUser(user),
				tokens: {
					accessToken,
					expiresIn: TOKEN_EXPIRY_SECONDS,
				},
			}
		},

		async logout(_accessToken: string): Promise<void> {
			// JWT is stateless - logout is a no-op on the server
			// Client should discard the token
			// For revocation, implement a token blacklist
			return
		},

		async verifyToken(accessToken: string): Promise<AuthUser | null> {
			const payload = await verifyToken(accessToken)
			if (!payload) {
				return null
			}

			const user = await userRepository.findById(payload.sub)
			if (!user) {
				return null
			}

			return toAuthUser(user)
		},

		async refreshToken(_refreshToken: string): Promise<AuthTokens> {
			// Basic JWT implementation doesn't support refresh tokens
			// For refresh token support, store refresh tokens in DB
			throw new AuthError(
				"Refresh tokens not supported in JWT adapter",
				"INVALID_TOKEN",
			)
		},

		async getUserById(id: string): Promise<AuthUser | null> {
			const user = await userRepository.findById(id)
			return user ? toAuthUser(user) : null
		},

		async getUserByEmail(email: string): Promise<AuthUser | null> {
			const user = await userRepository.findByEmail(email)
			return user ? toAuthUser(user) : null
		},
	}
}
