"use client"

import { useSearchParams } from "next/navigation"
import { createContext, type ReactNode, useContext, useState } from "react"
import { toast } from "sonner"
import { getCalendarAction } from "@/actions/get-calendar"
import { getCalendarsAction } from "@/actions/get-calendars"
import { useApi } from "@/lib/hooks"
import type { CalendarWithItems, CalendarWithRole, ItemResponse } from "@/types"

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
		createItemModalOpen: CreateItemModalProps | null
		setCreateItemModalOpen: (open: CreateItemModalProps | null) => void
		updateItemModalOpen: UpdateItemModalProps | null
		setUpdateItemModalOpen: (open: UpdateItemModalProps | null) => void
		deleteItemModalOpen: DeleteItemModalProps | null
		setDeleteItemModalOpen: (open: DeleteItemModalProps | null) => void
	}
	loading: {
		calendars: boolean
		calendar: boolean
	}
	refreshCalendar: () => Promise<void>
}

interface CalendarProviderProps {
	children: ReactNode
}

type CreateItemModalProps = {
	startDate?: string
}

type UpdateItemModalProps = {
	item?: ItemResponse
}

type DeleteItemModalProps = {
	item?: ItemResponse
}

const CalendarContext = createContext<CalendarContextValue | undefined>(
	undefined,
)

export function CalendarProvider({ children }: CalendarProviderProps) {
	const searchParams = useSearchParams()
	const calendarId = searchParams.get("calendar_id") || undefined
	const calendarsQuery = useApi(
		"calendars",
		async () => {
			const result = await getCalendarsAction()
			if (result.error) {
				throw result.error
			}
			return result.data
		},
		{
			onError: (err) => {
				toast.error(err.message)
			},
		},
	)
	const calendarQuery = useApi(
		["calendar", calendarId],
		async () => {
			if (!calendarId || typeof calendarId !== "string") {
				return null
			}
			const result = await getCalendarAction(calendarId)
			return result.data
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
	const [createItemModalOpen, setCreateItemModalOpen] =
		useState<CreateItemModalProps | null>(null)
	const [updateItemModalOpen, setUpdateItemModalOpen] =
		useState<UpdateItemModalProps | null>(null)
	const [deleteItemModalOpen, setDeleteItemModalOpen] =
		useState<DeleteItemModalProps | null>(null)

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
