// src/components/calendar/helpers.ts
import type { ItemResponse } from "@/api/types"

/**
 * Convert time string (HH:MM or HH:MM:SS) into minutes since midnight.
 * Returns -1 when no time is provided so that absent times sort before/after
 * appropriately depending on the sort logic.
 */
export function timeToMinutes(time?: string | null): number {
	if (!time) return -1
	const parts = time.split(":")
	const hours = parseInt(parts[0] ?? "0", 10)
	const minutes = parseInt(parts[1] ?? "0", 10)
	return hours * 60 + minutes
}

/**
 * Determine if an item should be treated as an "all-day" event in the UI.
 * This covers:
 * - items with no start/end times (typical all-day)
 * - items explicitly spanning the full day (start at 00:00 and end at 23:59)
 */
export function isAllDay(item: ItemResponse): boolean {
	const startShort = item.startTime ? item.startTime.slice(0, 5) : null
	const endShort = item.endTime ? item.endTime.slice(0, 5) : null
	return (
		(!item.startTime && !item.endTime) ||
		(startShort === "00:00" && endShort === "23:59")
	)
}

/**
 * Sort items for a specific day.
 *
 * Ordering:
 * 1) Continuation segments (items that started before `dayStr`) come first.
 * 2) Then by start time (earlier times first).
 * 3) Then by end time (earlier end first).
 *
 * If `dayStr` is omitted, it falls back to time-based ordering.
 */
export function sortItemsForDay(items: ItemResponse[] = [], dayStr?: string) {
	return items.slice().sort((a, b) => {
		// Continuation items (started earlier) should be prioritized when day is known
		if (dayStr) {
			const aCont = a.startDate < dayStr
			const bCont = b.startDate < dayStr
			if (aCont !== bCont) return aCont ? -1 : 1
		}

		const aStart = timeToMinutes(a.startTime)
		const bStart = timeToMinutes(b.startTime)
		if (aStart !== bStart) return aStart - bStart

		const aEnd = timeToMinutes(a.endTime)
		const bEnd = timeToMinutes(b.endTime)
		return aEnd - bEnd
	})
}
