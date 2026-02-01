"use server"

import { createClient } from "@/lib/supabase/server"
import { toCalendarWithRole } from "@/lib/transforms"
import type {
	ActionResponse,
	CalendarWithRole,
	CreateCalendarRequest,
} from "@/types"

/**
 * Create a new calendar for the current user.
 * Uses Supabase directly instead of going through the API layer.
 */
export async function postCalendarAction(
	payload: CreateCalendarRequest,
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

	// Insert the new calendar
	const { data: calendar, error: insertError } = await supabase
		.from("calendars")
		.insert({
			owner_id: user.id,
			name: payload.name,
			destination: payload.destination ?? null,
			start_date: payload.startDate,
			end_date: payload.endDate,
		})
		.select()
		.single()

	if (insertError) {
		return {
			data: null,
			error: { message: insertError.message, code: "DATABASE_ERROR" },
		}
	}

	if (!calendar) {
		return {
			data: null,
			error: { message: "Failed to create calendar", code: "DATABASE_ERROR" },
		}
	}

	return {
		data: toCalendarWithRole(calendar, "owner", "edit"),
		error: null,
	}
}
