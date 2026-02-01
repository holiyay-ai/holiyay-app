/**
 * Supabase Browser Client
 *
 * Creates a Supabase client for use in Client Components.
 * Uses the anon key and automatically handles session management via cookies.
 */

import { createBrowserClient } from "@supabase/ssr"
import type { Database } from "@/lib/supabase/database.types"

export function createClient() {
	const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
	const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

	// During build/prerender, return a dummy client that won't be used
	if (!supabaseUrl || !supabaseAnonKey) {
		if (typeof window === "undefined") {
			// Server-side during build - return a mock that throws on use
			return {
				auth: {
					getUser: async () => ({ data: { user: null }, error: null }),
					getSession: async () => ({ data: { session: null }, error: null }),
					signOut: async () => ({ error: null }),
					onAuthStateChange: () => ({
						data: { subscription: { unsubscribe: () => {} } },
					}),
				},
			} as unknown as ReturnType<typeof createBrowserClient<Database>>
		}
		throw new Error(
			"Supabase URL and Anon Key are required. Check your environment variables.",
		)
	}

	return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey)
}
