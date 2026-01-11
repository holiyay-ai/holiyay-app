"use client"

import { useSearchParams } from "next/navigation"
import { createContext, type ReactNode, useContext, useState } from "react"
import { toast } from "sonner"
import { getCalendarAction } from "@/actions/get-calendar"
import { getCalendarsAction } from "@/actions/get-calendars"
import type { CalendarWithItems, CalendarWithRole } from "@/lib/api"
import { useApi } from "@/lib/hooks"

interface CalendarContextValue {
	calendars: CalendarWithRole[]
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
	refreshCalendar: () => Promise<void>
}

const CalendarContext = createContext<CalendarContextValue | undefined>(
	undefined,
)

export function CalendarProvider({ children }: { children: ReactNode }) {
	const searchParams = useSearchParams()
	const calendarId = searchParams.get("calendar_id") || undefined
	const calendarsQuery = useApi("calendars", async () => {
		return (await getCalendarsAction()).data
	})
	const calendarQuery = useApi(
		["calendar", calendarId],
		async () => {
			if (!calendarId || typeof calendarId !== "string") {
				return null
			}
			return await getCalendarAction(calendarId)
		},
		{
			onError: (err) => {
				toast.error(err.message)
			},
		},
	)

	// Modal state
	const [createCalendarModalOpen, setCreateCalendarModalOpen] = useState(false)
	const [updateCalendarModalOpen, setUpdateCalendarModalOpen] = useState(false)
	const [deleteCalendarModalOpen, setDeleteCalendarModalOpen] = useState(false)
	const [createItemModalOpen, setCreateItemModalOpen] = useState(false)
	const [updateItemModalOpen, setUpdateItemModalOpen] = useState(false)
	const [deleteItemModalOpen, setDeleteItemModalOpen] = useState(false)

	const value: CalendarContextValue = {
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
		refreshCalendar: async () => {
			await calendarQuery.mutate()
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
