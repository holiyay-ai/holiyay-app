"use server"

import { createClient } from "@/lib/supabase/server"
import { toCalendarWithRole, toSharedCalendarWithRole } from "@/lib/transforms"
import type { ActionResponse, CalendarWithRole } from "@/types"

/**
 * Get all calendars for the current user (owned and shared).
 * Uses Supabase directly instead of going through the API layer.
 */
export async function getCalendarsAction(): Promise<
	ActionResponse<CalendarWithRole[]>
> {
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

	// Get owned calendars
	const { data: ownedCalendars, error: ownedError } = await supabase
		.from("calendars")
		.select("*")
		.eq("owner_id", user.id)

	if (ownedError) {
		return {
			data: null,
			error: { message: ownedError.message, code: "DATABASE_ERROR" },
		}
	}

	// Get shared calendars with their calendar data
	const { data: sharedData, error: sharedError } = await supabase
		.from("calendar_shares")
		.select("*, calendars(*)")
		.eq("user_id", user.id)

	if (sharedError) {
		return {
			data: null,
			error: { message: sharedError.message, code: "DATABASE_ERROR" },
		}
	}

	// Transform owned calendars
	const ownedWithRole: CalendarWithRole[] = (ownedCalendars ?? []).map((cal) =>
		toCalendarWithRole(cal, "owner", "edit"),
	)

	// Transform shared calendars
	const sharedWithRole: CalendarWithRole[] = (sharedData ?? [])
		.filter((s) => s.calendars !== null)
		.map((share) => toSharedCalendarWithRole(share as any))

	return {
		data: [...ownedWithRole, ...sharedWithRole],
		error: null,
	}
}
