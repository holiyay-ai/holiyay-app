/**
 * Auth Adapter Factory
 *
 * Provides environment-based selection of authentication provider.
 * Set AUTH_PROVIDER environment variable to choose:
 * - "jwt" (default): Local JWT auth with database users
 * - "supabase": Supabase Auth for production
 *
 * The factory lazily creates and caches the adapter instance.
 */

import type { AuthAdapter } from "./adapter"
import { createJwtAuthAdapter } from "./jwt.auth"
import { createSupabaseAuthAdapter } from "./supabase.auth"

export type AuthProvider = "jwt" | "supabase"

let cachedAdapter: AuthAdapter | null = null
let cachedProvider: AuthProvider | null = null

function getProviderFromEnv(): AuthProvider {
	const provider = process.env.AUTH_PROVIDER

	if (provider === "supabase") {
		return "supabase"
	}

	// Default to JWT for development and standalone deployments
	return "jwt"
}

export function getAuthAdapter(provider?: AuthProvider): AuthAdapter {
	const selectedProvider = provider ?? getProviderFromEnv()

	// Return cached adapter if provider hasn't changed
	if (cachedAdapter && cachedProvider === selectedProvider) {
		return cachedAdapter
	}

	switch (selectedProvider) {
		case "supabase":
			cachedAdapter = createSupabaseAuthAdapter()
			break
		default:
			cachedAdapter = createJwtAuthAdapter()
			break
	}

	cachedProvider = selectedProvider
	return cachedAdapter
}

/**
 * Reset the cached adapter. Useful for testing.
 */
export function resetAuthAdapter(): void {
	cachedAdapter = null
	cachedProvider = null
}
