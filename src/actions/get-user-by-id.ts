"use server"

import { createAdminClient } from "@/lib/supabase/server"
import type { ActionResponse, AuthUser } from "@/types"

/**
 * Get a user by their ID using the admin client.
 * This is used to fetch user details for display (e.g., calendar owner info).
 */
export async function getUserByIdAction(
	userId: string,
): Promise<ActionResponse<{ user: Partial<AuthUser> }>> {
	const supabase = await createAdminClient()

	const { data, error } = await supabase.auth.admin.getUserById(userId)

	if (error) {
		return {
			data: null,
			error: { message: error.message, code: error.code },
		}
	}

	if (!data.user) {
		return {
			data: null,
			error: { message: "User not found", code: "NOT_FOUND" },
		}
	}

	return {
		data: {
			user: {
				id: data.user.id,
				email: data.user.email ?? "",
				name:
					data.user.user_metadata?.name ?? data.user.email?.split("@")[0] ?? "",
				avatarUrl: data.user.user_metadata?.avatar_url ?? null,
			},
		},
		error: null,
	}
}
