"use client"

import { createContext, type ReactNode, useContext } from "react"

interface CalendarContextValue {
	days: unknown[]
}

const CalendarContext = createContext<CalendarContextValue | undefined>(
	undefined,
)

export function CalendarProvider({ children }: { children: ReactNode }) {
	const value: CalendarContextValue = {
		days: [],
	}
	return (
		<CalendarContext.Provider value={value}>
			{children}
		</CalendarContext.Provider>
	)
}

export function useCalendar() {
	const context = useContext(CalendarContext)
	if (context === undefined) {
		throw new Error("useCalendar must be used within an CalendarContext")
	}
	return context
}
