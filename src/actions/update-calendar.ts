"use server"

import { createClient } from "@/lib/supabase/server"
import { toCalendarWithRole } from "@/lib/transforms"
import type {
	ActionResponse,
	CalendarWithRole,
	UpdateCalendarRequest,
} from "@/types"

/**
 * Update an existing calendar.
 * Only owners and users with edit permission can update.
 */
export async function updateCalendarAction(
	calendarId: string,
	payload: UpdateCalendarRequest,
): Promise<ActionResponse<CalendarWithRole>> {
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
		.select("*")
		.eq("id", calendarId)
		.eq("owner_id", user.id)
		.maybeSingle()

	const isOwner = !!ownedCalendar
	let hasEditPermission = isOwner

	// If not owned, check if shared with edit permission
	if (!isOwner) {
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
				message: "You don't have permission to edit this calendar",
				code: "FORBIDDEN",
			},
		}
	}

	// Build update object
	const updateData: Record<string, unknown> = {
		updated_at: new Date().toISOString(),
	}

	if (payload.name !== undefined) {
		updateData.name = payload.name
	}
	if (payload.destination !== undefined) {
		updateData.destination = payload.destination
	}
	if (payload.startDate !== undefined) {
		updateData.start_date = payload.startDate
	}
	if (payload.endDate !== undefined) {
		updateData.end_date = payload.endDate
	}

	// Update the calendar
	const { data: calendar, error: updateError } = await supabase
		.from("calendars")
		.update(updateData)
		.eq("id", calendarId)
		.select()
		.single()

	if (updateError) {
		return {
			data: null,
			error: { message: updateError.message, code: "DATABASE_ERROR" },
		}
	}

	if (!calendar) {
		return {
			data: null,
			error: { message: "Calendar not found", code: "NOT_FOUND" },
		}
	}

	return {
		data: toCalendarWithRole(calendar, isOwner ? "owner" : "shared", "edit"),
		error: null,
	}
}
