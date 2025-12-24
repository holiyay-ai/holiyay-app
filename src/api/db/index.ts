/**
 * Supabase DB Client (server-side)
 *
 * Provides a lazily-initialized Supabase admin client (uses SERVICE_ROLE_KEY)
 * and a lightweight health check using the DATABASE_URL via `postgres` (
 * which is still handy for lightweight checks).
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js"
import { createLogger } from "@/api/lib/logger"
import { AppError } from "../types"

const log = createLogger("db")

let supabaseAdmin: SupabaseClient | null = null

export function getSupabaseAdmin(): SupabaseClient {
	if (supabaseAdmin) return supabaseAdmin

	const url = process.env.SUPABASE_URL
	const key = process.env.SUPABASE_SERVICE_ROLE_KEY

	if (!url) {
		throw new AppError(
			"SUPABASE_URL environment variable is required for DB access",
			"INTERNAL_ERROR",
		)
	}

	if (!key) {
		throw new AppError(
			"SUPABASE_SERVICE_ROLE_KEY environment variable is required for server-side DB access",
			"INTERNAL_ERROR",
		)
	}

	log.info("Creating Supabase admin client")
	supabaseAdmin = createClient(url, key, {
		auth: { autoRefreshToken: false, persistSession: false },
	})

	return supabaseAdmin
}
