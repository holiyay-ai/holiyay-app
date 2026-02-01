/** biome-ignore-all lint/style/noNonNullAssertion: Hard crash if not set */
import { createServerClient } from "@supabase/ssr"
import { type NextRequest, NextResponse } from "next/server"
import type { Database } from "@/lib/supabase/database.types"

export async function updateSession(request: NextRequest) {
	let supabaseResponse = NextResponse.next({
		request,
	})

	const supabase = createServerClient<Database>(
		process.env.NEXT_PUBLIC_SUPABASE_URL!,
		process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
		{
			cookies: {
				getAll() {
					return request.cookies.getAll()
				},
				setAll(cookiesToSet) {
					for (const { name, value } of cookiesToSet) {
						request.cookies.set(name, value)
					}
					supabaseResponse = NextResponse.next({
						request,
					})
					for (const { name, value, options } of cookiesToSet) {
						supabaseResponse.cookies.set(name, value, options)
					}
				},
			},
		},
	)

	// Do not run code between createServerClient and
	// supabase.auth.getUser(). A simple mistake could make it very hard to debug
	// issues with users being randomly logged out.

	// IMPORTANT: Avoid writing any logic between createServerClient and
	// supabase.auth.getUser(). A simple mistake could make it very hard to debug
	// issues with users being randomly logged out.

	const {
		data: { user },
	} = await supabase.auth.getUser()

	// Protect routes that require authentication
	const isAuthRoute =
		request.nextUrl.pathname.startsWith("/auth/login") ||
		request.nextUrl.pathname.startsWith("/auth/register") ||
		request.nextUrl.pathname.startsWith("/auth/callback")

	const isPublicRoute =
		request.nextUrl.pathname === "/" ||
		request.nextUrl.pathname.startsWith("/privacy") ||
		request.nextUrl.pathname.startsWith("/terms") ||
		request.nextUrl.pathname.startsWith("/shared/")

	const isApiRoute = request.nextUrl.pathname.startsWith("/api")

	// Allow API routes and public routes through
	if (isApiRoute || isPublicRoute) {
		return supabaseResponse
	}

	// Redirect unauthenticated users to login (except for auth routes)
	if (!user && !isAuthRoute) {
		const url = request.nextUrl.clone()
		url.pathname = "/auth/login"
		return NextResponse.redirect(url)
	}

	// Redirect authenticated users away from auth routes
	if (user && isAuthRoute) {
		const url = request.nextUrl.clone()
		url.pathname = "/"
		return NextResponse.redirect(url)
	}

	return supabaseResponse
}
