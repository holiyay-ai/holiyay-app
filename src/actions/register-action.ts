"use server"

import { cookies } from "next/headers"
import api from "@/lib/api"

const COOKIE_NAME = "holiyay_session"
const DEFAULT_MAX_AGE = 60 * 60 * 24 * 7 // 7 days

export async function registerAction(
	name: string,
	email: string,
	password: string,
) {
	const result = await api.auth.register({ name, email, password })

	// If registration succeeded, set the session cookie on the response so the
	// browser receives it. This forwards the session token from the backend to
	// the client when using server actions.
	if (result.data) {
		try {
			const { accessToken, expiresIn } = result.data
			const cookieStore = await cookies()
			cookieStore.set({
				name: COOKIE_NAME,
				value: accessToken,
				httpOnly: true,
				secure: process.env.NODE_ENV === "production",
				sameSite: "lax",
				path: "/",
				maxAge: expiresIn ?? DEFAULT_MAX_AGE,
			})
		} catch (err) {
			// Log but don't throw - still return the registration result
			console.error("Failed to set session cookie:", err)
		}
	}

	return result
}
