/**
 * Data Transformation Utilities
 *
 * Transforms data between database format (snake_case) and
 * application format (camelCase) for type safety and consistency.
 */

import type { Database } from "@/lib/supabase/database.types"
import type { CalendarWithItems, CalendarWithRole, ItemResponse } from "@/types"

// Database row types
type DbCalendar = Database["public"]["Tables"]["calendars"]["Row"]
type DbItem = Database["public"]["Tables"]["items"]["Row"]
type DbCalendarShare = Database["public"]["Tables"]["calendar_shares"]["Row"]

/**
 * Transform a database calendar row to CalendarWithRole
 */
export function toCalendarWithRole(
	cal: DbCalendar,
	role: "owner" | "shared",
	permission: "view" | "edit",
): CalendarWithRole {
	return {
		id: cal.id,
		ownerId: cal.owner_id,
		name: cal.name,
		destination: cal.destination,
		startDate: cal.start_date,
		endDate: cal.end_date,
		shareToken: cal.share_token,
		createdAt: cal.created_at,
		updatedAt: cal.updated_at,
		role,
		permission,
	}
}

/**
 * Transform a database calendar row with items to CalendarWithItems
 */
export function toCalendarWithItems(
	cal: DbCalendar,
	items: DbItem[],
	permission: "view" | "edit",
): CalendarWithItems {
	return {
		id: cal.id,
		ownerId: cal.owner_id,
		name: cal.name,
		destination: cal.destination,
		startDate: cal.start_date,
		endDate: cal.end_date,
		shareToken: cal.share_token,
		createdAt: cal.created_at,
		updatedAt: cal.updated_at,
		permission,
		items: items.map(toItemResponse),
	}
}

/**
 * Transform a database item row to ItemResponse
 */
export function toItemResponse(item: DbItem): ItemResponse {
	return {
		id: item.id,
		calendarId: item.calendar_id,
		startDate: item.start_date,
		endDate: item.end_date,
		title: item.title,
		description: item.description,
		startTime: item.start_time,
		endTime: item.end_time,
		location: item.location,
		category: item.category as ItemResponse["category"],
		checklistId: item.checklist_id,
		orderIndex: item.order_index,
		createdAt: item.created_at,
		updatedAt: item.updated_at,
	}
}

/**
 * Transform shared calendar data with joined calendar
 */
export function toSharedCalendarWithRole(
	share: DbCalendarShare & { calendars: DbCalendar },
): CalendarWithRole {
	const cal = share.calendars
	return {
		id: cal.id,
		ownerId: cal.owner_id,
		name: cal.name,
		destination: cal.destination,
		startDate: cal.start_date,
		endDate: cal.end_date,
		shareToken: cal.share_token,
		createdAt: cal.created_at,
		updatedAt: cal.updated_at,
		role: "shared",
		permission: share.permission as "view" | "edit",
	}
}
