"use client"

import { CalendarProvider } from "./calendar-context"
import { Controls } from "./controls"
import { CreateCalendarModal } from "./create-calendar"
import { CreateItemModal } from "./create-calendar-item"
import { Grid } from "./grid"

export default function Calendar() {
	return (
		<CalendarProvider>
			<Controls />
			<Grid />
			<CreateCalendarModal />
			<CreateItemModal />
		</CalendarProvider>
	)
}
