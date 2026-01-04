"use server"

import { cookies } from "next/headers"
import { authService } from "@/api/services/auth.service"
import type { AuthUser } from "@/api/types"

export async function getCurrentUser(): Promise<AuthUser | null> {
	const cookieStore = await cookies()
	const accessToken = cookieStore.get("holiyay_session")?.value

	if (accessToken) {
		try {
			const user = await authService.verifyAccessToken(accessToken)
			if (user) return user
		} catch {
			// fall through to try refresh
		}
	}

	// Try refresh flow if refresh cookie exists
	const refreshToken = cookieStore.get("holiyay_refresh")?.value
	if (refreshToken) {
		try {
			const tokens = await authService.refreshToken(refreshToken)

			// set refreshed cookies on response
			cookieStore.set({
				name: "holiyay_session",
				value: tokens.accessToken,
				httpOnly: true,
				secure: process.env.NODE_ENV === "production",
				sameSite: "strict",
				maxAge: tokens.expiresIn,
			})

			if (tokens.refreshToken) {
				// Keep refresh token rotation
				cookieStore.set({
					name: "holiyay_refresh",
					value: tokens.refreshToken,
					httpOnly: true,
					secure: process.env.NODE_ENV === "production",
					sameSite: "strict",
					// keep refresh cookie longer
					maxAge: 60 * 60 * 24 * 30, // 30 days
				})
			}

			return await authService.verifyAccessToken(tokens.accessToken)
		} catch {
			return null
		}
	}

	return null
}
