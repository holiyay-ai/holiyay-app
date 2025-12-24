"use client"

import { useQuery } from "@tanstack/react-query"
import { useParams } from "next/navigation"
import { createContext, type ReactNode, useContext } from "react"
import api, { type CalendarWithItems, type CalendarWithRole } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"

interface CalendarContextValue {
	calendars: CalendarWithRole[]
	days: unknown[]
	calendar: CalendarWithItems | undefined
}

const CalendarContext = createContext<CalendarContextValue | undefined>(
	undefined,
)

export function CalendarProvider({ children }: { children: ReactNode }) {
	const { sessionToken } = useAuth()
	const { calendar_id } = useParams()
	const calendarsQuery = useQuery({
		queryKey: ["calendars"],
		queryFn: async () => {
			if (!sessionToken) {
				return []
			}
			return (await api.calendars.list(sessionToken)).data
		},
	})
	const calendarQuery = useQuery({
		queryKey: ["calendar", calendar_id],
		queryFn: async () => {
			if (!sessionToken || !calendar_id || typeof calendar_id !== "string") {
				return null
			}
			return (await api.calendars.get(sessionToken, calendar_id)).data
		},
		enabled: !!calendar_id,
	})
	const value: CalendarContextValue = {
		days: [],
		calendars: calendarsQuery.data ?? [],
		calendar: calendarQuery.data ?? undefined,
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
