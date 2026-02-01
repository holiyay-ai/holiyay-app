/**
 * Supabase Auth Callback Route Handler
 *
 * Handles OAuth callback from Supabase Auth (e.g., Google, GitHub).
 * Exchanges the code for a session and redirects to the app.
 */

import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: Request) {
	const { searchParams, origin } = new URL(request.url)
	const code = searchParams.get("code")
	const next = searchParams.get("next") ?? "/"

	if (code) {
		const supabase = await createClient()
		const { error } = await supabase.auth.exchangeCodeForSession(code)

		if (!error) {
			// Successful auth - redirect to the intended destination
			return NextResponse.redirect(`${origin}${next}`)
		}
	}

	// Return the user to an error page with instructions
	return NextResponse.redirect(`${origin}/auth/login?error=auth_callback_error`)
}
