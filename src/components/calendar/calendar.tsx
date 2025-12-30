"use client"

import { addDays, format } from "date-fns"
import { CalendarIcon, Plus } from "lucide-react"
import { useMutableSearchParams } from "@/lib/hooks"
import { Button } from "../ui/button"
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "../ui/card"
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
import { Spinner } from "../ui/spinner"
import { CalendarProvider, useCalendar } from "./calendar-context"
import { CreateCalendarModal } from "./create-calendar"

export default function Calendar() {
	return (
		<CalendarProvider>
			<Controls />
			<Grid />
			<CreateCalendarModal />
		</CalendarProvider>
	)
}

function Controls() {
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
								onClick={() => setCreateItemModalOpen(true)}
								disabled={!calendar || createItemModalOpen}
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

function EmptyState() {
	const {
		modals: { createCalendarModalOpen, setCreateCalendarModalOpen },
	} = useCalendar()
	return (
		<Empty>
			<EmptyHeader>
				<EmptyMedia variant="icon">
					<CalendarIcon />
				</EmptyMedia>
				<EmptyTitle>No plans found!</EmptyTitle>
				<EmptyDescription>You have not created any plans yet.</EmptyDescription>
			</EmptyHeader>
			<EmptyContent>
				<Button
					onClick={() => setCreateCalendarModalOpen(true)}
					disabled={createCalendarModalOpen}
				>
					Create your first plan
				</Button>
			</EmptyContent>
		</Empty>
	)
}

function Grid() {
	const { calendar, calendars, loading } = useCalendar()
	if (loading.calendars || loading.calendar) {
		return <Spinner />
	}
	if (calendars.length === 0) {
		return <EmptyState />
	}
	if (!calendar) {
		return <CalendarList />
	}
	return <CalendarView />
}

function CalendarList() {
	const { calendars, loading } = useCalendar()
	const { updateSearchParams } = useMutableSearchParams()
	if (loading.calendars) {
		return <Spinner />
	}
	return (
		<div className="flex flex-col gap-2 w-full">
			{calendars.map((calendar) => (
				<Card key={calendar.id} className="overflow-hidden w-full">
					<CardHeader>
						<CardTitle>{calendar.name}</CardTitle>
						<CardDescription>
							{format(calendar.startDate, "dd MMM yyyy")} -{" "}
							{format(calendar.endDate, "dd MMM yyyy")}
						</CardDescription>
					</CardHeader>
					<CardContent>
						<p>Created by {calendar.ownerId}</p>
					</CardContent>
					<CardFooter className="flex justify-end">
						<Button
							onClick={() => updateSearchParams("calendar_id", calendar.id)}
						>
							Open
						</Button>
					</CardFooter>
				</Card>
			))}
		</div>
	)
}

function CalendarView() {
	const { calendar } = useCalendar()
	if (!calendar) {
		return (
			<Empty>
				<EmptyHeader>
					<EmptyMedia variant="icon">
						<CalendarIcon />
					</EmptyMedia>
					<EmptyTitle>Plan not found</EmptyTitle>
					<EmptyDescription>This plan does not exist.</EmptyDescription>
				</EmptyHeader>
			</Empty>
		)
	}
	const startDate = new Date(calendar.startDate)
	const endDate = new Date(calendar.endDate)
	const days = Array.from({
		length: Math.ceil(
			(endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
		),
	}).map((_, index) => {
		return addDays(startDate, index)
	})
	return (
		<div className="grid grid-cols-7 gap-2 w-full">
			{days.map((day) => (
				<Day key={`day-${day.getTime()}`} date={day} />
			))}
		</div>
	)
}

type DayProps = {
	date: Date
}

function Day({ date }: DayProps) {
	return (
		<Card>
			<CardHeader>
				<CardTitle>{format(date, "dd MMM yyyy")}</CardTitle>
				<CardDescription>{format(date, "EEEE")}</CardDescription>
			</CardHeader>
			<CardContent></CardContent>
		</Card>
	)
}
