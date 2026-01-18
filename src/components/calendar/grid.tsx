"use client"

import { Spinner } from "../ui/spinner"
import { useCalendar } from "./calendar-context"
import { CalendarList } from "./calendar-list"
import { CalendarView } from "./calendar-view"
import { EmptyState } from "./empty-state"

/**
 * Grid (orchestrator)
 *
 * Responsible for selecting what to render in the main area:
 *  - Loading state (spinner)
 *  - Empty state when no calendars exist
 *  - Calendar list when calendars exist but no calendar is selected
 *  - CalendarView when a calendar is selected
 */
export function Grid() {
	const { calendar, calendars, loading } = useCalendar()

	if (loading.calendars || loading.calendar) {
		return <Spinner />
	}

	if (calendars.length === 0) {
		return <EmptyState />
	}

	if (!calendar) {
		return <CalendarList />
	}

	return <CalendarView />
}
