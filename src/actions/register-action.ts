"use server"

import { cookies } from "next/headers"
import { authService } from "@/api/services/auth.service"

const COOKIE_NAME = "holiyay_session"
const REFRESH_COOKIE = "holiyay_refresh"

export async function registerAction(
	name: string,
	email: string,
	password: string,
) {
	try {
		const authResult = await authService.register({ name, email, password })

		if (authResult.tokens) {
			const cookieStore = await cookies()
			cookieStore.set({
				name: COOKIE_NAME,
				value: authResult.tokens.accessToken,
				httpOnly: true,
				secure: process.env.NODE_ENV === "production",
				sameSite: "lax",
				path: "/",
				maxAge: authResult.tokens.expiresIn,
			})

			if (authResult.tokens.refreshToken) {
				cookieStore.set({
					name: REFRESH_COOKIE,
					value: authResult.tokens.refreshToken,
					httpOnly: true,
					secure: process.env.NODE_ENV === "production",
					sameSite: "lax",
					path: "/",
					maxAge: 60 * 60 * 24 * 30,
				})
			}
		}

		if (authResult.tokens) {
			return {
				data: { user: authResult.user },
				error: null,
				headers: {},
			}
		}

		return {
			data: { user: authResult.user, code: "EMAIL_VERIFICATION_REQUIRED" },
			error: null,
			headers: {},
		}
	} catch (err) {
		return {
			data: null,
			error: {
				message: err instanceof Error ? err.message : "Registration failed",
			},
			headers: {},
		}
	}
}
