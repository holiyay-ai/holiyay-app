"use server"

import { cookies } from "next/headers"
import api from "@/lib/api"
import { parseSetCookie } from "@/lib/utils"

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
	const setCookieHeader = result.headers?.["set-cookie"]
	if (setCookieHeader) {
		try {
			const cookieStore = await cookies()
			const parsed = parseSetCookie(setCookieHeader)
			cookieStore.set({
				name: parsed.name ?? COOKIE_NAME,
				value: parsed.value ?? "",
				httpOnly: parsed.httpOnly ?? true,
				secure: parsed.secure ?? process.env.NODE_ENV === "production",
				sameSite: parsed.sameSite ?? "lax",
				path: parsed.path ?? "/",
				maxAge: parsed.maxAge ?? result.data?.expiresIn ?? DEFAULT_MAX_AGE,
				expires: parsed.expires,
				domain: parsed.domain,
			})
		} catch (err) {
			// Log but don't throw - we still want the login result returned
			console.error("Failed to set session cookie:", err)
		}
	}

	return result
}
