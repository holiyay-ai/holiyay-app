"use client"

import { useDisclosure } from "@mantine/hooks"
import {
	addDays,
	addMonths,
	differenceInCalendarDays,
	endOfDay,
	endOfMonth,
	endOfWeek,
	format,
	formatRelative,
	isBefore,
	isSameMonth,
	isToday,
	isWithinInterval,
	startOfDay,
	startOfMonth,
	startOfWeek,
} from "date-fns"
import { CalendarIcon, PlaneIcon, Plus } from "lucide-react"
import { useCallback, useEffect, useRef, useState } from "react"
import type { ItemResponse } from "@/api/types"
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
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover"
import { Portal } from "../ui/portal"
import { Spinner } from "../ui/spinner"
import { UserName } from "../user-name"
import { CalendarProvider, useCalendar } from "./calendar-context"
import { CreateCalendarModal } from "./create-calendar"
import { CreateItemModal } from "./create-calendar-item"

function timeToMinutes(time?: string | null) {
	if (!time) return -1
	const parts = time.split(":")
	const hours = parseInt(parts[0] ?? "0", 10)
	const minutes = parseInt(parts[1] ?? "0", 10)
	return hours * 60 + minutes
}

function sortItemsByTime(items: ItemResponse[] = []) {
	return items.slice().sort((a, b) => {
		const aStart = timeToMinutes(a.startTime)
		const bStart = timeToMinutes(b.startTime)
		if (aStart !== bStart) return aStart - bStart
		const aEnd = timeToMinutes(a.endTime)
		const bEnd = timeToMinutes(b.endTime)
		return aEnd - bEnd
	})
}

/** Hover popover controller: keeps a short delay before closing so that
    moving the mouse from trigger -> popover doesn't cause flicker. */
function useHoverPopover(closeDelay = 500) {
	const [open, setOpen] = useState(false)
	const closeRef = useRef<number | null>(null)
	const isInsideRef = useRef(false)
	// Track last open/close times to avoid immediate reopen loops
	const lastCloseAtRef = useRef<number | null>(null)
	const lastOpenAtRef = useRef<number | null>(null)

	const openPopover = useCallback(() => {
		const now = Date.now()
		// If we just closed very recently, ignore very-immediate re-opens to
		// avoid rapid close/open loops when quickly entering/leaving.
		if (lastCloseAtRef.current && now - lastCloseAtRef.current < 150) {
			return
		}
		if (closeRef.current) {
			clearTimeout(closeRef.current)
			closeRef.current = null
		}
		// mark pointer as inside (so close timer won't hide the popover)
		isInsideRef.current = true
		lastOpenAtRef.current = now
		setOpen(true)
	}, [])

	const closePopoverDelayed = useCallback(() => {
		// mark pointer as not inside and schedule close; if pointer re-enters
		// before the timeout fires, openPopover() will cancel the scheduled close.
		isInsideRef.current = false
		if (closeRef.current) clearTimeout(closeRef.current)

		// If the popover was opened very recently, extend the close delay slightly
		// so quick enter/leave (twitchy cursor) doesn't cause a visible flicker.
		const now = Date.now()
		const sinceOpen = lastOpenAtRef.current
			? now - lastOpenAtRef.current
			: Infinity
		const reopenGuard = 150 // ms
		const extra = sinceOpen < reopenGuard ? reopenGuard - sinceOpen : 0
		const effectiveDelay = closeDelay + extra

		closeRef.current = window.setTimeout(() => {
			// If pointer has re-entered, cancel closing
			if (isInsideRef.current) {
				closeRef.current = null
				return
			}
			setOpen(false)
			// record time of close so we can ignore very-immediate re-opens
			lastCloseAtRef.current = Date.now()
			closeRef.current = null
		}, effectiveDelay)
	}, [closeDelay])

	useEffect(() => {
		return () => {
			if (closeRef.current) clearTimeout(closeRef.current)
		}
	}, [])

	return { open, setOpen, openPopover, closePopoverDelayed }
}

/** Small component to render the "+N more" trigger and its popover.
    Keeps popover open while hovering either the trigger or the content.
    Supports pinning the popover when clicked (click to pin open). */
function MorePopover({
	items,
	delay = 500,
}: {
	items: ItemResponse[]
	delay?: number
}) {
	const { open, setOpen, openPopover, closePopoverDelayed } =
		useHoverPopover(delay)
	const [pinned, setPinned] = useState(false)

	const handleTriggerMouseLeave = () => {
		if (!pinned) closePopoverDelayed()
	}
	const handleContentMouseLeave = () => {
		if (!pinned) closePopoverDelayed()
	}
	const onTriggerClick = () => {
		if (!pinned) {
			setPinned(true)
			setOpen(true)
		} else {
			setPinned(false)
			setOpen(false)
		}
	}
	const onOpenChange = (next: boolean) => {
		setOpen(next)
		if (!next) setPinned(false)
	}

	return (
		<Popover open={open} onOpenChange={onOpenChange}>
			<PopoverTrigger asChild>
				<button
					type="button"
					onMouseEnter={openPopover}
					onMouseLeave={handleTriggerMouseLeave}
					onClick={onTriggerClick}
					className="text-xs text-neutral-500"
				>
					+{items.length} more
				</button>
			</PopoverTrigger>
			<PopoverContent
				onMouseEnter={openPopover}
				onMouseLeave={handleContentMouseLeave}
				className="w-72 transition-opacity duration-300 ease-in-out data-[state=open]:opacity-100 data-[state=closed]:opacity-0"
			>
				<div className="flex flex-col gap-2">
					{items.map((it) => (
						<div key={it.id} className="flex flex-col">
							<div className="flex flex-row justify-between">
								<div className="font-medium text-sm">{it.title}</div>
								<div className="text-xs text-neutral-500 self-start">
									{it.startTime
										? `${it.startTime}${it.endTime ? ` — ${it.endTime}` : ""}`
										: "All day"}
								</div>
							</div>
							<div className="text-xs text-neutral-500">
								{it.description ?? "No description"}
							</div>
						</div>
					))}
				</div>
			</PopoverContent>
		</Popover>
	)
}

export default function Calendar() {
	return (
		<CalendarProvider>
			<Controls />
			<Grid />
			<CreateCalendarModal />
			<CreateItemModal />
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
		<div className="flex flex-col gap-2 w-full max-w-[400px] mx-auto">
			{calendars.map((calendar) => (
				<Card key={calendar.id} className="overflow-hidden w-full">
					<CardHeader>
						<CardTitle className="justify-between flex items-start">
							{calendar.name}
							<p className="text-xs text-muted-foreground">
								{differenceInCalendarDays(calendar.endDate, calendar.startDate)}{" "}
								days
							</p>
						</CardTitle>
						<CardDescription>
							{format(calendar.startDate, "dd MMM yyyy")} -{" "}
							{format(calendar.endDate, "dd MMM yyyy")}
						</CardDescription>
					</CardHeader>
					<CardContent className="flex flex-col gap-2">
						{calendar.destination && (
							<div className="flex flex-row gap-2">
								<PlaneIcon />
								<p className="flex items-center gap-2 font-medium">
									{calendar.destination}
								</p>
							</div>
						)}
					</CardContent>
					<CardFooter className="flex justify-between">
						<div className="flex flex-col self-end">
							<p className="flex items-center gap-2 text-xs text-muted-foreground">
								Created by <UserName id={calendar.ownerId} />
							</p>
							<p className="flex items-center gap-2 text-xs text-muted-foreground">
								{formatRelative(calendar.createdAt, new Date())}
							</p>
						</div>
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

/**
 * CalendarView
 *
 * - Groups days by month.
 * - Each month renders as a 7-column grid with weekday headers.
 * - Days outside the current month are dimmed.
 * - Days outside the calendar (before start or after end) are de-emphasized.
 */
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
	const todayStart = startOfDay(new Date())

	// Helper: get month starts between the calendar start and end, inclusive.
	function getMonthStarts(start: Date, end: Date) {
		const months: Date[] = []
		let cursor = startOfMonth(start)
		const last = startOfMonth(end)
		while (cursor.getTime() <= last.getTime()) {
			months.push(cursor)
			cursor = addMonths(cursor, 1)
		}
		return months
	}

	// Helper: produce the week-grid (array of weeks, each week is array of 7 Date objects)
	function getMonthWeeks(monthStart: Date) {
		const monthBegin = startOfMonth(monthStart)
		const monthEnd = endOfMonth(monthStart)
		// Start weeks on Monday
		const gridStart = startOfWeek(monthBegin, { weekStartsOn: 1 })
		const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })

		const weeks: Date[][] = []
		let cursor = gridStart
		while (cursor.getTime() <= gridEnd.getTime()) {
			const week: Date[] = []
			for (let i = 0; i < 7; i++) {
				week.push(addDays(cursor, i))
			}
			weeks.push(week)
			cursor = addDays(cursor, 7)
		}
		return weeks
	}

	const monthStarts = getMonthStarts(startDate, endDate)
	// Week days starting from Monday (responsive layout uses the same ordering)
	const WEEK_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

	return (
		<div className="flex flex-col gap-6 w-full">
			{monthStarts.map((monthStart) => {
				const weeks = getMonthWeeks(monthStart)
				return (
					<section key={format(monthStart, "yyyy-MM")}>
						<div className="flex items-center justify-between mb-2">
							<h3 className="text-lg font-semibold">
								{format(monthStart, "MMMM yyyy")}
							</h3>
							<div className="text-sm text-neutral-500">
								{format(monthStart, "MMM yyyy")}
							</div>
						</div>

						{/* Mobile single-column day list view (visible below sm) */}
						<div className="block sm:hidden">
							{weeks
								.flat()
								.filter(
									(day) =>
										isSameMonth(day, monthStart) &&
										isWithinInterval(day, {
											start: startOfDay(startDate),
											end: endOfDay(endDate),
										}),
								)
								.map((day) => {
									const passed = isBefore(day, todayStart)
									const today = isToday(day)
									return (
										<div
											key={`mobile-day-${day.getTime()}`}
											className={`flex flex-col justify-between p-2 border-b ${passed ? "opacity-90 text-neutral-500" : ""}`}
										>
											<div className="flex items-center gap-3">
												<div
													className={`w-8 h-8 flex items-center justify-center rounded ${
														today ? "bg-red-700 text-white" : ""
													}`}
												>
													{format(day, "d")}
												</div>
												<div className="text-sm">
													<div className="font-medium">
														{format(day, "EEEE")}
													</div>
													<div className="text-xs text-neutral-500">
														{format(day, "dd MMM yyyy")}
													</div>
												</div>
											</div>

											<div className="mt-2 flex flex-col gap-2">
												{(() => {
													const itemsForDay = sortItemsByTime(
														(calendar?.items ?? []).filter(
															(i) => i.date === format(day, "yyyy-MM-dd"),
														),
													)
													return (
														<>
															{itemsForDay.slice(0, 5).map((item) => (
																<CalendarItem key={item.id} item={item} />
															))}
															{itemsForDay.length > 5 && (
																<MorePopover items={itemsForDay.slice(5)} />
															)}
														</>
													)
												})()}
											</div>
										</div>
									)
								})}
						</div>

						{/* Desktop grid visible on sm+ */}
						<div className="hidden sm:block overflow-x-auto -mx-2 px-2">
							<div className="min-w-[560px] sm:min-w-0">
								{/* Weekday headers */}
								<div className="grid grid-cols-7 gap-2 mb-1">
									{WEEK_DAYS.map((d) => (
										<div
											key={d}
											className="text-xs font-medium text-neutral-500 text-center"
										>
											{d}
										</div>
									))}
								</div>

								{/* Days grid */}
								<div className="grid grid-cols-7 gap-2">
									{weeks.flat().map((day) => {
										const inMonth = isSameMonth(day, monthStart)
										const inRange = isWithinInterval(day, {
											start: startOfDay(startDate),
											end: endOfDay(endDate),
										})
										const passed = isBefore(day, todayStart)
										return (
											<Day
												key={`day-${day.getTime()}`}
												date={day}
												inMonth={inMonth}
												inRange={inRange}
												isPast={passed}
												items={sortItemsByTime(
													(calendar?.items ?? []).filter(
														(i) => i.date === format(day, "yyyy-MM-dd"),
													),
												)}
											/>
										)
									})}
								</div>
							</div>
						</div>
					</section>
				)
			})}
		</div>
	)
}

type DayProps = {
	date: Date
	inMonth?: boolean
	inRange?: boolean
	isPast?: boolean
	items?: ItemResponse[]
}

function Day({
	date,
	inMonth = true,
	inRange = true,
	isPast = false,
	items = [],
}: DayProps) {
	const today = isToday(date)
	return (
		<div
			className={`overflow-hidden w-full border rounded p-1 sm:p-2 min-h-12 sm:min-h-16 flex flex-col justify-between ${
				!inMonth
					? "opacity-20 text-neutral-400 border-transparent pointer-events-none"
					: ""
			} ${!inRange ? "text-neutral-400" : ""} ${isPast ? "text-neutral-600 opacity-90" : ""}`}
		>
			<div className="flex items-start justify-between gap-2">
				<div
					className={`text-sm font-medium flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 ${
						today ? "bg-red-700 text-white rounded-full" : ""
					}`}
				>
					{format(date, "d")}
				</div>
				{/* hide the weekday label on very narrow screens to save space */}
				<CardDescription className="hidden sm:block text-xs text-neutral-500">
					{format(date, "EEE")}
				</CardDescription>
			</div>
			<CardContent className="p-0">
				<div className="mt-1 flex flex-col gap-1">
					{items && items.length > 0 ? (
						<>
							{items.slice(0, 3).map((item) => (
								<CalendarItem key={item.id} item={item} />
							))}
							{items.length > 3 && <MorePopover items={items.slice(3)} />}
						</>
					) : null}
				</div>
			</CardContent>
		</div>
	)
}

function CalendarItem({ item }: { item: ItemResponse }) {
	const [opened, { open, close }] = useDisclosure(false)
	const timeLabel = item.startTime ? item.startTime.slice(0, 5) : null

	return (
		<Popover open={opened}>
			<PopoverTrigger asChild>
				<button
					type="button"
					onFocus={open}
					onBlur={close}
					onClick={open}
					className="overflow-hidden bg-accent rounded text-xs px-1 py-0.5 truncate max-w-full text-left flex items-center gap-2"
					aria-label={item.title}
				>
					{timeLabel && (
						<span className="text-[11px] text-neutral-500">{timeLabel}</span>
					)}
					<span className="truncate">{item.title}</span>
				</button>
			</PopoverTrigger>
			<PopoverContent className="w-72 transition-opacity duration-200 ease-in-out data-[state=open]:opacity-100 data-[state=closed]:opacity-0">
				<div className="text-sm font-medium">{item.title}</div>
				<div className="text-xs text-neutral-500">
					{item.startTime
						? `${item.startTime}${item.endTime ? ` — ${item.endTime}` : ""}`
						: "All day"}
				</div>
				<div className="mt-2 text-sm whitespace-pre-line">
					{item.description ?? "No description"}
				</div>
			</PopoverContent>
		</Popover>
	)
}
