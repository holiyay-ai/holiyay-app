"use client"

import type { CalendarWithItems, ItemResponse } from "@/types"
import { createContext, useState, type ReactNode } from "react"

interface CalendarContextValue {
  calendar: CalendarWithItems | undefined
	createItemModalOpen: CreateItemModalProps | null
	setCreateItemModalOpen: (open: CreateItemModalProps | null) => void
	updateItemModalOpen: UpdateItemModalProps | null
	setUpdateItemModalOpen: (open: UpdateItemModalProps | null) => void
	deleteItemModalOpen: DeleteItemModalProps | null
	setDeleteItemModalOpen: (open: DeleteItemModalProps | null) => void
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

interface CalendarProviderProps {
	children: ReactNode
	calendar: CalendarWithItems | undefined
}

const CalendarsContext = createContext<CalendarContextValue | undefined>(
	undefined,
)

export function CalendarProvider({ children, calendar }: CalendarProviderProps) {
 	const [createItemModalOpen, setCreateItemModalOpen] =
		useState<CreateItemModalProps | null>(null)
	const [updateItemModalOpen, setUpdateItemModalOpen] =
		useState<UpdateItemModalProps | null>(null)
	const [deleteItemModalOpen, setDeleteItemModalOpen] =
		useState<DeleteItemModalProps | null>(null)
 	return (
		<CalendarsContext.Provider value={{
      calendar,
      createItemModalOpen,
     	setCreateItemModalOpen,
     	updateItemModalOpen,
     	setUpdateItemModalOpen,
     	deleteItemModalOpen,
     	setDeleteItemModalOpen
		}}>
			{children}
		</CalendarsContext.Provider>
	)
}
