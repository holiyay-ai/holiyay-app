"use client"

import {
	addDays,
	addMonths,
	endOfDay,
	endOfMonth,
	endOfWeek,
	format,
	isBefore,
	isSameMonth,
	isToday,
	isWithinInterval,
	startOfDay,
	startOfMonth,
	startOfWeek,
} from "date-fns"
import { CalendarIcon } from "lucide-react"
import { useTranslation } from "react-i18next"
import {
	Empty,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "../ui/empty"
import { useCalendar } from "./calendar-context"
import { CalendarItem } from "./calendar-item"
import { Day } from "./day"
import { sortItemsForDay } from "./helpers"
import { MorePopover } from "./more-popover"

export function CalendarView() {
	const { calendar } = useCalendar()
	const { t } = useTranslation()
	if (!calendar) {
		return (
			<Empty>
				<EmptyHeader>
					<EmptyMedia variant="icon">
						<CalendarIcon />
					</EmptyMedia>
					<EmptyTitle>{t("calendar:labels.plan_not_found")}</EmptyTitle>
					<EmptyDescription>
						{t("calendar:bodies.plan_not_found")}
					</EmptyDescription>
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
									const dayStr = format(day, "yyyy-MM-dd")
									const itemsForDay = sortItemsForDay(
										(calendar?.items ?? []).filter((i) => {
											const start = i.startDate
											const end = i.endDate ?? i.startDate
											return start <= dayStr && end >= dayStr
										}),
										dayStr,
									)
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
												{itemsForDay.slice(0, 5).map((item) => (
													<CalendarItem key={item.id} item={item} date={day} />
												))}
												{itemsForDay.length > 5 && (
													<MorePopover items={itemsForDay.slice(5)} />
												)}
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
										const dayStr = format(day, "yyyy-MM-dd")
										const itemsForDay = sortItemsForDay(
											(calendar?.items ?? []).filter((i) => {
												const start = i.startDate
												const end = i.endDate ?? i.startDate
												return start <= dayStr && end >= dayStr
											}),
											dayStr,
										)
										return (
											<Day
												key={`day-${day.getTime()}`}
												date={day}
												inMonth={inMonth}
												inRange={inRange}
												isPast={passed}
												items={itemsForDay}
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
