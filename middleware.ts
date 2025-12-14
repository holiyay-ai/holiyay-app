/**
 * Next.js Middleware
 *
 * Forwards session cookies to the Authorization header for API routes.
 * This allows Hono's authMiddleware to authenticate requests using cookies.
 */

import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"

const COOKIE_NAME = "holiyay_session"

export function middleware(request: NextRequest) {
	// Only process API routes
	if (!request.nextUrl.pathname.startsWith("/api")) {
		return NextResponse.next()
	}

	const sessionToken = request.cookies.get(COOKIE_NAME)?.value

	// If no session cookie, continue without modification
	if (!sessionToken) {
		return NextResponse.next()
	}

	// Clone the request headers and add Authorization
	const requestHeaders = new Headers(request.headers)
	requestHeaders.set("Authorization", `Bearer ${sessionToken}`)

	// Create response with modified headers
	return NextResponse.next({
		request: {
			headers: requestHeaders,
		},
	})
}

export const config = {
	matcher: "/api/:path*",
}
