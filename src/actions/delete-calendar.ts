"use server"

import { createClient } from "@/lib/supabase/server"
import type { ActionResponse } from "@/types"

/**
 * Delete a calendar.
 * Only the owner can delete a calendar.
 */
export async function deleteCalendarAction(
	calendarId: string,
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

	if (!ownedCalendar) {
		return {
			data: null,
			error: {
				message: "Calendar not found or you don't have permission to delete it",
				code: "NOT_FOUND",
			},
		}
	}

	// Delete the calendar (items will cascade delete via foreign key)
	const { error: deleteError } = await supabase
		.from("calendars")
		.delete()
		.eq("id", calendarId)

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
