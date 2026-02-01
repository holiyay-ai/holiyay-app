"use server"

import { createClient } from "@/lib/supabase/server"
import { toItemResponse } from "@/lib/transforms"
import type { ActionResponse, CreateItemRequest, ItemResponse } from "@/types"

/**
 * Create a new item in a calendar.
 * Checks that the user has edit permission on the calendar.
 */
export async function postCalendarItemAction(
	calendarId: string,
	payload: CreateItemRequest,
): Promise<ActionResponse<ItemResponse>> {
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
				message: "You don't have permission to add items to this calendar",
				code: "FORBIDDEN",
			},
		}
	}

	// Get the next order index for items on this date
	const { data: existingItems } = await supabase
		.from("items")
		.select("order_index")
		.eq("calendar_id", calendarId)
		.eq("start_date", payload.startDate)
		.order("order_index", { ascending: false })
		.limit(1)

	const nextOrderIndex =
		payload.orderIndex ?? (existingItems?.[0]?.order_index ?? -1) + 1

	// Insert the new item
	const { data: item, error: insertError } = await supabase
		.from("items")
		.insert({
			calendar_id: calendarId,
			start_date: payload.startDate,
			end_date: payload.endDate ?? null,
			title: payload.title,
			description: payload.description ?? null,
			start_time: payload.startTime ?? null,
			end_time: payload.endTime ?? null,
			location: payload.location ?? null,
			category: payload.category ?? "other",
			checklist_id: payload.checklistId ?? null,
			order_index: nextOrderIndex,
		})
		.select()
		.single()

	if (insertError) {
		return {
			data: null,
			error: { message: insertError.message, code: "DATABASE_ERROR" },
		}
	}

	if (!item) {
		return {
			data: null,
			error: { message: "Failed to create item", code: "DATABASE_ERROR" },
		}
	}

	return {
		data: toItemResponse(item),
		error: null,
	}
}
