/**
 * Supabase Server Client
 *
 * Creates a Supabase client for use in Server Components, Server Actions,
 * and Route Handlers. Uses cookie-based authentication via @supabase/ssr.
 */
/** biome-ignore-all lint/style/noNonNullAssertion: Hard crash if the env keys are not present */

import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import type { Database } from "@/lib/supabase/database.types"

export async function createClient() {
	const cookieStore = await cookies()

	return createServerClient<Database>(
		process.env.NEXT_PUBLIC_SUPABASE_URL!,
		process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
		{
			cookies: {
				getAll() {
					return cookieStore.getAll()
				},
				setAll(cookiesToSet) {
					try {
						for (const { name, value, options } of cookiesToSet) {
							cookieStore.set(name, value, options)
						}
					} catch {
						// The `setAll` method is called from a Server Component.
						// This can be ignored if you have middleware refreshing sessions.
					}
				},
			},
		},
	)
}

/**
 * Creates a Supabase admin client with service role key.
 * Use sparingly - this bypasses RLS! Only for admin operations.
 */
export async function createAdminClient() {
	const cookieStore = await cookies()

	return createServerClient<Database>(
		process.env.NEXT_PUBLIC_SUPABASE_URL!,
		process.env.SUPABASE_SERVICE_ROLE_KEY!,
		{
			cookies: {
				getAll() {
					return cookieStore.getAll()
				},
				setAll(cookiesToSet) {
					try {
						for (const { name, value, options } of cookiesToSet) {
							cookieStore.set(name, value, options)
						}
					} catch {
						// Ignore in Server Components
					}
				},
			},
		},
	)
}
