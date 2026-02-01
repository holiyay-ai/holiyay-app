"use server"

import { createClient } from "@/lib/supabase/server"
import type { ActionResponse } from "@/types"

/**
 * Delete an item from a calendar.
 * Checks that the user has edit permission on the calendar.
 */
export async function deleteCalendarItemAction(
	calendarId: string,
	itemId: string,
): Promise<ActionResponse<{ success: boolean }>> {
	const supabase = await createClient()

	// Get current user
	const {
		data: { user },
		error: authError,
	} = await supabase.auth.getUser()

	if (authError || !user) {
		return {
			data: null,
			error: { message: "Not authenticated", code: "UNAUTHORIZED" },
		}
	}

	// Check if user owns the calendar
	const { data: ownedCalendar } = await supabase
		.from("calendars")
		.select("id")
		.eq("id", calendarId)
		.eq("owner_id", user.id)
		.maybeSingle()

	let hasEditPermission = !!ownedCalendar

	// If not owned, check if shared with edit permission
	if (!hasEditPermission) {
		const { data: shareData } = await supabase
			.from("calendar_shares")
			.select("permission")
			.eq("calendar_id", calendarId)
			.eq("user_id", user.id)
			.maybeSingle()

		if (shareData?.permission === "edit") {
			hasEditPermission = true
		}
	}

	if (!hasEditPermission) {
		return {
			data: null,
			error: {
				message: "You don't have permission to delete items from this calendar",
				code: "FORBIDDEN",
			},
		}
	}

	// Verify the item belongs to this calendar and delete it
	const { error: deleteError } = await supabase
		.from("items")
		.delete()
		.eq("id", itemId)
		.eq("calendar_id", calendarId)

	if (deleteError) {
		return {
			data: null,
			error: { message: deleteError.message, code: "DATABASE_ERROR" },
		}
	}

	return {
		data: { success: true },
		error: null,
	}
}
