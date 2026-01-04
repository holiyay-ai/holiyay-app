"use server"

import { cookies } from "next/headers"
import { authService } from "@/api/services/auth.service"
import type { AuthUser } from "@/api/types"

const COOKIE_NAME = "holiyay_session"
const REFRESH_COOKIE = "holiyay_refresh"

export async function loginAction(email: string, password: string) {
	try {
		const authResult = await authService.login({ email, password })

		if (authResult.tokens) {
			const cookieStore = await cookies()
			cookieStore.set({
				name: COOKIE_NAME,
				value: authResult.tokens.accessToken,
				httpOnly: true,
				secure: process.env.NODE_ENV === "production",
				sameSite: "strict",
				path: "/",
				maxAge: authResult.tokens.expiresIn,
			})

			if (authResult.tokens.refreshToken) {
				cookieStore.set({
					name: REFRESH_COOKIE,
					value: authResult.tokens.refreshToken,
					httpOnly: true,
					secure: process.env.NODE_ENV === "production",
					sameSite: "strict",
					path: "/",
					maxAge: 60 * 60 * 24 * 30, // 30 days
				})
			}
		}

		return {
			data: { user: authResult.user } as { user: AuthUser },
			error: null,
			headers: {},
		}
	} catch (err) {
		return {
			data: null,
			error: { message: err instanceof Error ? err.message : "Login failed" },
			headers: {},
		}
	}
}
