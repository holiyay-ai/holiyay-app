/**
 * Lightweight helpers for converting db `Item` -> `CalendarItemVM`, grouping by day,
 * and computing day-view layout (basic column-based overlap algorithm).
 *
 * Time handling:
 * - Items store `date` (YYYY-MM-DD) and `startTime`/`endTime` (HH:MM).
 * - We treat times as local (naive) and combine date+time into a Date using `date-fns`.
 * - All-day items: both startTime and endTime null.
 *
 * Keep this file small and testable; rely on these pure functions from the UI.
 */

import {
	addDays,
	addHours,
	compareAsc,
	differenceInMinutes,
	format,
	isValid,
	parse,
	parseISO,
	startOfDay,
	startOfMonth,
	startOfWeek,
} from "date-fns"
import type { Item } from "@/api/types"
import type { CalendarItemVM, CalendarWithItemsPayload, DayCell } from "./types"

// ---- helpers ----
export function dateToYMD(d: Date): string {
	return format(d, "yyyy-MM-dd")
}

function combineDateTimeLocal(
	dateStr: string,
	timeStr?: string | null | undefined,
): Date {
	const day = parseISO(dateStr) // YYYY-MM-DD -> local midnight of that day
	if (!timeStr) return startOfDay(day)

	// support "HH:mm" and "HH:mm:ss"
	const parts = timeStr.split(":")
	const fmt = parts.length === 3 ? "yyyy-MM-dd HH:mm:ss" : "yyyy-MM-dd HH:mm"
	const combined = `${dateStr} ${timeStr}`
	const parsed = parse(combined, fmt, new Date())

	if (!isValid(parsed)) {
		// fallback to midnight of the date
		return startOfDay(day)
	}
	return parsed
}

// ---- conversions ----
export function itemToInstance(item: Item): CalendarItemVM {
	const isAllDay = item.startTime == null && item.endTime == null

	const start = isAllDay
		? startOfDay(parseISO(item.date))
		: combineDateTimeLocal(item.date, item.startTime ?? item.endTime ?? "00:00")

	let end: Date
	if (item.endTime) {
		end = combineDateTimeLocal(item.date, item.endTime)
	} else if (item.startTime) {
		// no explicit end -> default 1 hour
		end = addHours(start, 1)
	} else {
		// all-day -> end at next midnight
		end = addDays(startOfDay(parseISO(item.date)), 1)
	}

	// sanitize end > start
	if (end.getTime() <= start.getTime()) {
		end = addHours(start, 1)
	}

	const durationMinutes = Math.round(differenceInMinutes(end, start))

	return {
		id: item.id,
		calendarId: item.calendarId,
		title: item.title,
		description: item.description,
		date: item.date,
		startTime: item.startTime,
		endTime: item.endTime,
		start,
		end,
		isAllDay,
		durationMinutes,
		location: item.location,
		category: item.category,
		affiliateLink: item.affiliateLink,
		orderIndex: item.orderIndex,
		createdAt: item.createdAt,
		updatedAt: item.updatedAt,
		original: item,
		layout: undefined,
	}
}

export function groupItemsByDate(items: Item[]): Record<string, Item[]> {
	const map: Record<string, Item[]> = {}
	for (const it of items) {
		map[it.date] = map[it.date] || []
		map[it.date]?.push(it)
	}

	// sort within day by orderIndex ascending, then createdAt
	for (const d of Object.keys(map)) {
		map[d]?.sort((a, b) => {
			if (a.orderIndex !== b.orderIndex) return a.orderIndex - b.orderIndex
			return a.createdAt.getTime() - b.createdAt.getTime()
		})
	}

	return map
}

export function normalizeItems(items: Item[]) {
	const itemsById: Record<string, Item> = {}
	for (const it of items) itemsById[it.id] = it
	const itemsByDate = groupItemsByDate(items)
	return { itemsById, itemsByDate }
}

// ---- layout: day view computation ----
// Produces top/height/left/width as percentages for timed events.
// All-day items are left untouched (handled by a different row).
export function computeDayLayouts(
	instances: CalendarItemVM[],
): CalendarItemVM[] {
	const DAY_MINUTES = 24 * 60

	// separate all-day from timed
	const timed = instances.filter((i) => !i.isAllDay)

	// compute minute-based intervals
	type Intv = { inst: CalendarItemVM; startMin: number; endMin: number }
	const intervals: Intv[] = timed.map((i) => {
		const dayStart = startOfDay(parseISO(i.date))
		const startMin = Math.max(0, differenceInMinutes(i.start, dayStart))
		const endMin = Math.min(DAY_MINUTES, differenceInMinutes(i.end, dayStart))
		return { inst: i, startMin, endMin }
	})

	// sort by startMin (and by longest end as secondary)
	intervals.sort((a, b) => a.startMin - b.startMin || b.endMin - a.endMin)

	// cluster by overlap, then assign columns greedily
	let i = 0
	while (i < intervals.length) {
		const cluster: Intv[] = [intervals[i] as Intv]
		let clusterEnd = (intervals[i] as Intv).endMin
		let j = i + 1
		while (
			j < intervals.length &&
			(intervals[j] as Intv).startMin < clusterEnd
		) {
			cluster.push(intervals[j] as Intv)
			clusterEnd = Math.max(clusterEnd, (intervals[j] as Intv).endMin)
			j++
		}

		// assign columns for this cluster
		// columns: array of endMin per column
		const columnsEnd: number[] = []
		for (const iv of cluster) {
			let assigned = -1
			for (let c = 0; c < columnsEnd.length; c++) {
				if ((columnsEnd[c] ?? Infinity) <= iv.startMin) {
					assigned = c
					break
				}
			}
			if (assigned === -1) {
				assigned = columnsEnd.length
				columnsEnd.push(iv.endMin)
			} else {
				columnsEnd[assigned] = iv.endMin
			}
			const columnsCount = columnsEnd.length
			const leftPercent = (assigned / columnsCount) * 100
			const widthPercent = (1 / columnsCount) * 100
			const topPercent = (iv.startMin / DAY_MINUTES) * 100
			const heightPercent = Math.max(
				0.5,
				((iv.endMin - iv.startMin) / DAY_MINUTES) * 100,
			)

			iv.inst.layout = {
				column: assigned,
				columns: columnsCount,
				leftPercent,
				widthPercent,
				topPercent,
				heightPercent,
			}
		}

		i = j
	}

	return instances
}

// ---- simple month grid builder ----
export function buildMonthGrid(
	calendar: CalendarWithItemsPayload,
	monthDate: Date,
	options?: { weekStartsOn?: 0 | 1 }, // 0 = Sunday, 1 = Monday
): DayCell[] {
	const weekStartsOn = options?.weekStartsOn ?? 0
	const start = startOfMonth(monthDate)
	// get start of week including previous month days
	const first = startOfWeek(start, { weekStartsOn })

	const DAYS = 6 * 7 // show 6 weeks to cover most month layouts
	const itemsByDate = groupItemsByDate(calendar.items.map((i) => i))
	const todayYMD = dateToYMD(new Date())

	const cells: DayCell[] = []
	for (let k = 0; k < DAYS; k++) {
		const cur = addDays(first, k)
		const ymd = dateToYMD(cur)
		const rawItems = itemsByDate[ymd] ?? []
		const instances = rawItems.map(itemToInstance)
		// sort day items: all-day first, then timed by start, then orderIndex
		instances.sort((a, b) => {
			if (a.isAllDay && !b.isAllDay) return -1
			if (!a.isAllDay && b.isAllDay) return 1
			const cmp = compareAsc(a.start, b.start)
			if (cmp !== 0) return cmp
			return a.orderIndex - b.orderIndex
		})

		cells.push({
			date: ymd,
			dateObj: cur,
			instances,
			isToday: ymd === todayYMD,
			isInCalendarRange: ymd >= calendar.startDate && ymd <= calendar.endDate,
			isSelected: false,
		})
	}

	return cells
}
