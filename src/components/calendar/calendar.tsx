"use client"

import { CalendarIcon, Plus } from "lucide-react"
import { Button } from "../ui/button"
import { Card } from "../ui/card"
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "../ui/dropdown-menu"
import {
	Empty,
	EmptyContent,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "../ui/empty"
import { Input } from "../ui/input"
import { Portal } from "../ui/portal"
import { CalendarProvider, useCalendar } from "./calendar-context"

export default function Calendar() {
	return (
		<CalendarProvider>
			<Controls />
			<Grid />
		</CalendarProvider>
	)
}

function Controls() {
	const { calendar } = useCalendar()
	return (
		<Portal target="#header-center">
			<div className="flex items-center gap-2 w-full">
				<Input className="w-full flex-1" placeholder="Search in your agenda" />
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button>
							<Plus />
							Create
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="center">
						<DropdownMenuItem>Plan</DropdownMenuItem>
						<DropdownMenuItem disabled={!calendar}>Item</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</div>
		</Portal>
	)
}

function EmptyState() {
	return (
		<div className="flex-1">
			<Empty>
				<EmptyHeader>
					<EmptyMedia variant="icon">
						<CalendarIcon />
					</EmptyMedia>
					<EmptyTitle>No plans found!</EmptyTitle>
					<EmptyDescription>
						You have not created any plans yet.
					</EmptyDescription>
				</EmptyHeader>
				<EmptyContent>
					<Button>Create your first plan</Button>
				</EmptyContent>
			</Empty>
		</div>
	)
}

function Grid() {
	const { calendars } = useCalendar()
	if (calendars.length === 0) {
		return <EmptyState />
	}
	return <div className="grid grid-cols-7 gap-2 w-full"></div>
}

function _Day() {
	return (
		<Card>
			<div className="flex flex-col items-start justify-start w-full">
				<p className="text-sm font-medium">Day</p>
				<p className="text-lg font-semibold">Date</p>
			</div>
		</Card>
	)
}
