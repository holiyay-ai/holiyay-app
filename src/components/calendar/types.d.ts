import type { Calendar, CalendarWithItems, Item } from "@/api/types"

export type ID = string
/** Represents ISO date string: YYYY-MM-DD */
export type DateString = string
/** Represents ISO time string: HH:MM */
export type TimeString = string

export interface EventLayout {
	// percentages for positioning in day/time grid (0..100)
	topPercent: number
	heightPercent: number
	leftPercent: number
	widthPercent: number
	// optional discrete column info (useful for interaction)
	column?: number
	columns?: number
}

export interface CalendarItemVM {
	id: Item["id"]
	calendarId: Item["calendarId"]
	title: Item["title"]
	description: Item["description"]
	date: DateString
	startTime: Item["startTime"] | null
	endTime: Item["endTime"] | null

	// Computed for rendering (local JS Date made by combining date + time)
	start: Date
	end: Date

	isAllDay: boolean
	durationMinutes: number

	location: Item["location"] | null
	category: Item["category"]
	checklistId: Item["checklistId"] | null
	orderIndex: Item["orderIndex"]
	createdAt: Item["createdAt"]
	updatedAt: Item["updatedAt"]

	// original DB item (handy for editing)
	original: Item

	// ephemeral UI-only layout data
	layout?: EventLayout | undefined
}

export interface DayCell {
	date: DateString
	dateObj: Date
	instances: CalendarItemVM[]
	isToday: boolean
	isInCalendarRange: boolean
	isSelected?: boolean
}

export type CalendarView = "month" | "week" | "day" | "agenda"

export interface CalendarViewport {
	startDate: DateString
	endDate: DateString
	viewType: CalendarView
}

export interface CalendarViewState {
	viewport: CalendarViewport
	selectedDate?: DateString
	selectedItemId?: string
	loading?: boolean
	error?: unknown
}

export interface CalendarModelState {
	calendars: Record<ID, Calendar>
	items: Record<ID, Item> // raw DB item
	itemsByDate: Record<DateString, ID[]> // date => ordered item ids
	view: CalendarViewState
}

export type CalendarWithItemsPayload = CalendarWithItems
