"use client"

import type { CalendarWithRole } from "@/types"
import { createContext, useState, type ReactNode } from "react"

interface CalendarsContextValue {
  calendars: CalendarWithRole[]
	createCalendarModalOpen: boolean
	setCreateCalendarModalOpen: (open: boolean) => void
	updateCalendarModalOpen: boolean
	setUpdateCalendarModalOpen: (open: boolean) => void
	deleteCalendarModalOpen: boolean
	setDeleteCalendarModalOpen: (open: boolean) => void
}

interface CalendarsProviderProps {
	children: ReactNode
	calendars: CalendarWithRole[]
}

const CalendarsContext = createContext<CalendarsContextValue | undefined>(
	undefined,
)

export function CalendarProvider({ children, calendars }: CalendarsProviderProps) {
  const [createCalendarModalOpen, setCreateCalendarModalOpen] = useState(false)
 	const [updateCalendarModalOpen, setUpdateCalendarModalOpen] = useState(false)
	const [deleteCalendarModalOpen, setDeleteCalendarModalOpen] = useState(false)
 	return (
		<CalendarsContext.Provider value={{
      createCalendarModalOpen,
      setCreateCalendarModalOpen,
      updateCalendarModalOpen,
      setUpdateCalendarModalOpen,
      deleteCalendarModalOpen,
      setDeleteCalendarModalOpen,
      calendars,
		}}>
			{children}
		</CalendarsContext.Provider>
	)
}
