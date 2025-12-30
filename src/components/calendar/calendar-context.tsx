"use client"

import { useQuery } from "@tanstack/react-query"
import { useSearchParams } from "next/navigation"
import { createContext, type ReactNode, useContext, useState } from "react"
import api, { type CalendarWithItems, type CalendarWithRole } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"

interface CalendarContextValue {
	calendars: CalendarWithRole[]
	days: unknown[]
	calendar: CalendarWithItems | undefined
	modals: {
		createCalendarModalOpen: boolean
		setCreateCalendarModalOpen: (open: boolean) => void
		updateCalendarModalOpen: boolean
		setUpdateCalendarModalOpen: (open: boolean) => void
		deleteCalendarModalOpen: boolean
		setDeleteCalendarModalOpen: (open: boolean) => void
		createItemModalOpen: boolean
		setCreateItemModalOpen: (open: boolean) => void
		updateItemModalOpen: boolean
		setUpdateItemModalOpen: (open: boolean) => void
		deleteItemModalOpen: boolean
		setDeleteItemModalOpen: (open: boolean) => void
	}
	loading: {
		calendars: boolean
		calendar: boolean
	}
}

const CalendarContext = createContext<CalendarContextValue | undefined>(
	undefined,
)

export function CalendarProvider({ children }: { children: ReactNode }) {
	const { sessionToken } = useAuth()
	const searchParams = useSearchParams()
	const calendarId = searchParams.get("calendar_id") || undefined
	const calendarsQuery = useQuery({
		queryKey: ["calendars"],
		queryFn: async () => {
			if (!sessionToken) {
				return []
			}
			return (await api.calendars.list(sessionToken)).data
		},
		enabled: !!sessionToken,
		staleTime: 1000 * 60 * 5,
	})
	const calendarQuery = useQuery({
		queryKey: ["calendar", calendarId],
		queryFn: async () => {
			if (!sessionToken || !calendarId || typeof calendarId !== "string") {
				return null
			}
			return (await api.calendars.get(sessionToken, calendarId)).data
		},
		enabled: !!calendarId && !!sessionToken,
		staleTime: 1000 * 60 * 5,
	})

	// Modal state
	const [createCalendarModalOpen, setCreateCalendarModalOpen] = useState(false)
	const [updateCalendarModalOpen, setUpdateCalendarModalOpen] = useState(false)
	const [deleteCalendarModalOpen, setDeleteCalendarModalOpen] = useState(false)
	const [createItemModalOpen, setCreateItemModalOpen] = useState(false)
	const [updateItemModalOpen, setUpdateItemModalOpen] = useState(false)
	const [deleteItemModalOpen, setDeleteItemModalOpen] = useState(false)

	const value: CalendarContextValue = {
		days: [],
		calendars: calendarsQuery.data ?? [],
		calendar: calendarQuery.data ?? undefined,
		modals: {
			createCalendarModalOpen,
			setCreateCalendarModalOpen,
			updateCalendarModalOpen,
			setUpdateCalendarModalOpen,
			deleteCalendarModalOpen,
			setDeleteCalendarModalOpen,
			createItemModalOpen,
			setCreateItemModalOpen,
			updateItemModalOpen,
			setUpdateItemModalOpen,
			deleteItemModalOpen,
			setDeleteItemModalOpen,
		},
		loading: {
			calendars: calendarsQuery.isLoading,
			calendar: calendarQuery.isLoading,
		},
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
