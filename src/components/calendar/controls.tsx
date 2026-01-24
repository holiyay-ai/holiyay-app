"use client"

import { CalendarIcon, PlaneIcon, Plus } from "lucide-react"
import { Button } from "../ui/button"
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
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
				<div className="items-center gap-2 sm:w-[300px] md:w-[400px] lg:w-[500px] xl:w-[600px]">
					<Input
						disabled={loading.calendars}
						className="w-full flex-1"
						placeholder="Search in your agenda"
					/>
				</div>
			</Portal>

			<div
				id="fab"
				className="flex items-center gap-2 fixed bottom-4 right-4 z-10"
			>
				<DropdownMenu modal={false}>
					<DropdownMenuTrigger asChild>
						<Button
							size="icon-lg"
							className="rounded-full"
							disabled={loading.calendars}
						>
							{loading.calendars ? <Spinner /> : <Plus />}
						</Button>
					</DropdownMenuTrigger>

					<DropdownMenuContent align="center">
						<DropdownMenuLabel className="font-semibold text-xs opacity-50">
							Create new...
						</DropdownMenuLabel>
						<DropdownMenuItem
							onClick={() => setCreateCalendarModalOpen(true)}
							disabled={createCalendarModalOpen}
						>
							<PlaneIcon />
							Plan
						</DropdownMenuItem>
						<DropdownMenuItem
							onClick={() => setCreateItemModalOpen({})}
							disabled={!calendar || !!createItemModalOpen}
						>
							<CalendarIcon />
							Event
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</div>
		</>
	)
}
