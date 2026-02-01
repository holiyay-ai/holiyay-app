/**
 * Next.js Middleware
 *
 * Handles Supabase session refresh and route protection.
 * Uses @supabase/ssr for cookie-based authentication.
 */

import type { NextRequest } from "next/server"
import {
	DEFAULT_LOCALE,
	detectLocaleFromAcceptLanguage,
	type Locale,
	SUPPORTED_LOCALES,
} from "@/lib/i18n/i18n"
import { updateSession } from "@/lib/supabase/middleware"

const LOCALE_COOKIE = "NEXT_LOCALE"
const LOCALE_MAX_AGE = 60 * 60 * 24 * 365 // 1 year

export async function middleware(request: NextRequest) {
	const res = await updateSession(request)
	const cookieLocale = request.cookies.get(LOCALE_COOKIE)?.value
	if (!cookieLocale || !SUPPORTED_LOCALES.includes(cookieLocale as Locale)) {
		const accept = request.headers.get("accept-language") ?? ""
		const detected = detectLocaleFromAcceptLanguage(accept) ?? DEFAULT_LOCALE
		res.cookies.set(LOCALE_COOKIE, detected, {
			path: "/",
			maxAge: LOCALE_MAX_AGE,
			sameSite: "lax",
			secure: process.env.NODE_ENV === "production",
		})

		res.headers.set("content-language", detected)
		res.headers.append("Vary", "Accept-Language")
	}

	return res
}

export const config = {
	matcher: [
		/*
		 * Match all request paths except for the ones starting with:
		 * - _next/static (static files)
		 * - _next/image (image optimization files)
		 * - favicon.ico (favicon file)
		 * - public folder assets
		 */
		"/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
	],
}
