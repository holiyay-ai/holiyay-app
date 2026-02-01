"use server"

import { createClient } from "@/lib/supabase/server"
import type { ActionResponse } from "@/types"

/**
 * Log out the current user using Supabase Auth.
 * Session cookies are automatically cleared by @supabase/ssr.
 */
export async function logoutAction(): Promise<
	ActionResponse<{ message: string }>
> {
	const supabase = await createClient()

	const { error } = await supabase.auth.signOut()

	if (error) {
		return {
			data: null,
			error: { message: error.message, code: error.code },
		}
	}

	return {
		data: { message: "Logged out successfully" },
		error: null,
	}
}
