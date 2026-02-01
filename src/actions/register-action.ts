"use server"

import { createClient } from "@/lib/supabase/server"
import type { ActionResponse, AuthUser } from "@/types"

/**
 * Register a new user with Supabase Auth.
 * Session is automatically managed via cookies by @supabase/ssr.
 */
export async function registerAction(
	name: string,
	email: string,
	password: string,
): Promise<
	ActionResponse<{ user: AuthUser; code?: "EMAIL_VERIFICATION_REQUIRED" }>
> {
	const supabase = await createClient()

	const { data, error } = await supabase.auth.signUp({
		email,
		password,
		options: {
			data: {
				name,
			},
		},
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
			error: { message: "Registration failed: no user returned" },
		}
	}

	const authUser: AuthUser = {
		id: data.user.id,
		email: data.user.email ?? email,
		name: data.user.user_metadata?.name ?? name,
		avatarUrl: data.user.user_metadata?.avatar_url ?? null,
	}

	// If no session returned, email confirmation is required
	if (!data.session) {
		return {
			data: { user: authUser, code: "EMAIL_VERIFICATION_REQUIRED" },
			error: null,
		}
	}

	return {
		data: { user: authUser },
		error: null,
	}
}
