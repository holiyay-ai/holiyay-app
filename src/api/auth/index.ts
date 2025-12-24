/**
 * Auth barrel exports
 *
 * This module provides authentication utilities including the auth
 * adapter interface, factory, and provider implementations.
 */

// Auth adapter interface (for swappable auth providers)
export type {
	AuthAdapter,
	AuthErrorCode,
	AuthResult,
	AuthTokens,
	AuthUser,
	LoginInput,
	RegisterInput,
} from "./adapter"

export { AuthError } from "./adapter"

// Auth adapter factory (primary way to get an adapter)
export { type AuthProvider, getAuthAdapter, resetAuthAdapter } from "./factory"
// Individual adapters (for direct use if needed)
// JWT utilities (for middleware and direct token operations)
export { createSupabaseAuthAdapter } from "./supabase.auth"
