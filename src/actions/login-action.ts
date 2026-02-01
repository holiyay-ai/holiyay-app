"use server"

import { createClient } from "@/lib/supabase/server"
import type { ActionResponse, AuthUser } from "@/types"

/**
 * Log in a user with email and password using Supabase Auth.
 * Session is automatically managed via cookies by @supabase/ssr.
 */
export async function loginAction(
	email: string,
	password: string,
): Promise<ActionResponse<{ user: AuthUser }>> {
	const supabase = await createClient()

	const { data, error } = await supabase.auth.signInWithPassword({
		email,
		password,
	})

	if (error) {
		return {
			data: null,
			error: { message: error.message, code: error.code },
		}
	}

	if (!data.user) {
		return {
			data: null,
			error: { message: "Login failed: no user returned" },
		}
	}

	return {
		data: {
			user: {
				id: data.user.id,
				email: data.user.email ?? email,
				name:
					data.user.user_metadata?.name ?? data.user.email?.split("@")[0] ?? "",
				avatarUrl: data.user.user_metadata?.avatar_url ?? null,
			},
		},
		error: null,
	}
}
