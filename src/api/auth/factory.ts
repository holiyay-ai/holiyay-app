/**
 * Auth Adapter Factory
 *
 * The factory lazily creates and caches the adapter instance.
 */

import { AppError } from "../types"
import type { AuthAdapter } from "./adapter"
import { createSupabaseAuthAdapter } from "./supabase.auth"

export type AuthProvider = "supabase"

let cachedAdapter: AuthAdapter | null = null
let cachedProvider: AuthProvider | null = null

function getProviderFromEnv(): AuthProvider {
	return "supabase"
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
			throw new AppError(
				`Unsupported auth provider: ${selectedProvider}`,
				"INTERNAL_ERROR",
			)
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
