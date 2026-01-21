"use client"

import { Plus } from "lucide-react"
import { Button } from "../ui/button"
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "../ui/dropdown-menu"
import { Input } from "../ui/input"
import { Portal } from "../ui/portal"
import { Spinner } from "../ui/spinner"
import { useCalendar } from "./calendar-context"

export function Controls() {
	const {
		calendar,
		modals: {
			createItemModalOpen,
			setCreateItemModalOpen,
			createCalendarModalOpen,
			setCreateCalendarModalOpen,
		},
		loading,
	} = useCalendar()

	return (
		<>
			{calendar && (
				<Portal target="#header-left">
					<div className="flex flex-col">
						<h2 className="text-sm font-semibold text-neutral-400">
							{calendar.name}
						</h2>
						{calendar.destination && (
							<p className="text-xs font-medium text-neutral-400">
								{calendar.destination}
							</p>
						)}
					</div>
				</Portal>
			)}

			<Portal target="#header-center">
				<div className="flex items-center gap-2 w-full">
					<Input
						disabled={loading.calendars}
						className="w-full flex-1"
						placeholder="Search in your agenda"
					/>
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button disabled={loading.calendars}>
								{loading.calendars ? <Spinner /> : <Plus />}
								Create
							</Button>
						</DropdownMenuTrigger>

						<DropdownMenuContent align="center">
							<DropdownMenuItem
								onClick={() => setCreateCalendarModalOpen(true)}
								disabled={createCalendarModalOpen}
							>
								Plan
							</DropdownMenuItem>
							<DropdownMenuItem
								onClick={() => setCreateItemModalOpen({})}
								disabled={!calendar || !!createItemModalOpen}
							>
								Item
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			</Portal>
		</>
	)
}
