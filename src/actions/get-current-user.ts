"use server"

import { createClient } from "@/lib/supabase/server"
import type { AuthUser } from "@/types"

/**
 * Get the currently authenticated user from Supabase session.
 * Returns null if not authenticated.
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
	const supabase = await createClient()

	const {
		data: { user },
		error,
	} = await supabase.auth.getUser()

	if (error || !user) {
		return null
	}

	return {
		id: user.id,
		email: user.email ?? "",
		name: user.user_metadata?.name ?? user.email?.split("@")[0] ?? "",
		avatarUrl: user.user_metadata?.avatar_url ?? null,
	}
}
