"use server"

import { createClient } from "@/lib/supabase/server"
import { toCalendarWithItems } from "@/lib/transforms"
import type { ActionResponse, CalendarWithItems } from "@/types"

/**
 * Get a calendar by ID with its items.
 * Checks that the user has access (owner or shared).
 */
export async function getCalendarAction(
	calendarId: string,
): Promise<ActionResponse<CalendarWithItems>> {
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

	let calendar = ownedCalendar
	let permission: "view" | "edit" = "edit"

	// If not owned, check if shared with user
	if (!calendar) {
		const { data: shareData } = await supabase
			.from("calendar_shares")
			.select("permission, calendars(*)")
			.eq("calendar_id", calendarId)
			.eq("user_id", user.id)
			.maybeSingle()

		if (shareData?.calendars) {
			calendar = shareData.calendars as NonNullable<typeof shareData.calendars>
			permission = shareData.permission as "view" | "edit"
		}
	}

	if (!calendar) {
		return {
			data: null,
			error: { message: "Calendar not found", code: "NOT_FOUND" },
		}
	}

	// Get calendar items
	const { data: items, error: itemsError } = await supabase
		.from("items")
		.select("*")
		.eq("calendar_id", calendarId)
		.order("start_date", { ascending: true })
		.order("order_index", { ascending: true })

	if (itemsError) {
		return {
			data: null,
			error: { message: itemsError.message, code: "DATABASE_ERROR" },
		}
	}

	return {
		data: toCalendarWithItems(calendar, items ?? [], permission),
		error: null,
	}
}
