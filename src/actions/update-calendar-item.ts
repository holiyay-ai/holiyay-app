"use server"

import { createClient } from "@/lib/supabase/server"
import { toItemResponse } from "@/lib/transforms"
import type { ActionResponse, ItemResponse, UpdateItemRequest } from "@/types"

/**
 * Update an existing item in a calendar.
 * Checks that the user has edit permission on the calendar.
 */
export async function updateCalendarItemAction(
	calendarId: string,
	itemId: string,
	payload: UpdateItemRequest,
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
				message: "You don't have permission to edit items in this calendar",
				code: "FORBIDDEN",
			},
		}
	}

	// Verify the item belongs to this calendar
	const { data: existingItem } = await supabase
		.from("items")
		.select("id")
		.eq("id", itemId)
		.eq("calendar_id", calendarId)
		.maybeSingle()

	if (!existingItem) {
		return {
			data: null,
			error: { message: "Item not found", code: "NOT_FOUND" },
		}
	}

	// Build update object
	const updateData: Record<string, unknown> = {
		updated_at: new Date().toISOString(),
	}

	if (payload.startDate !== undefined) {
		updateData.start_date = payload.startDate
	}
	if (payload.endDate !== undefined) {
		updateData.end_date = payload.endDate
	}
	if (payload.title !== undefined) {
		updateData.title = payload.title
	}
	if (payload.description !== undefined) {
		updateData.description = payload.description
	}
	if (payload.startTime !== undefined) {
		updateData.start_time = payload.startTime
	}
	if (payload.endTime !== undefined) {
		updateData.end_time = payload.endTime
	}
	if (payload.location !== undefined) {
		updateData.location = payload.location
	}
	if (payload.category !== undefined) {
		updateData.category = payload.category
	}
	if (payload.checklistId !== undefined) {
		updateData.checklist_id = payload.checklistId
	}
	if (payload.orderIndex !== undefined) {
		updateData.order_index = payload.orderIndex
	}

	// Update the item
	const { data: item, error: updateError } = await supabase
		.from("items")
		.update(updateData)
		.eq("id", itemId)
		.select()
		.single()

	if (updateError) {
		return {
			data: null,
			error: { message: updateError.message, code: "DATABASE_ERROR" },
		}
	}

	if (!item) {
		return {
			data: null,
			error: { message: "Failed to update item", code: "DATABASE_ERROR" },
		}
	}

	return {
		data: toItemResponse(item),
		error: null,
	}
}
