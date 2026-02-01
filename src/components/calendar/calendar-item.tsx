"use client"

import { format } from "date-fns"
import { useState } from "react"
import type { ItemResponse } from "@/types"
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover"
import { isAllDay } from "./helpers"
import { useHoverPopover } from "./use-hover-popover"

export function CalendarItem({
	item,
	date,
}: {
	item: ItemResponse
	date?: Date
}) {
	const { open, setOpen, openPopover, closePopoverDelayed } =
		useHoverPopover(1000)
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

	const dayStr = date ? format(date, "yyyy-MM-dd") : null
	const start = item.startDate
	const end = item.endDate ?? item.startDate

	const startsToday = dayStr ? start === dayStr : true
	const endsToday = dayStr ? end === dayStr : true
	const continuesFromPrev = dayStr ? start < dayStr : false
	const continuesToNext = dayStr ? end > dayStr : false

	// time label: treat true full-day ranges (00:00–23:59) as all-day and hide times.
	// Start day shows start time (or start — end for single-day timed events).
	// Final day of a multi-day range shows the end time prefixed with `Ends`.
	let timeLabel: string | null = null
	if (!isAllDay(item)) {
		if (startsToday) {
			if (item.startTime && item.endTime && item.startDate === item.endDate) {
				timeLabel = `${item.startTime.slice(0, 5)} — ${item.endTime.slice(0, 5)}`
			} else if (item.startTime) {
				timeLabel = item.startTime.slice(0, 5)
			}
		} else if (endsToday && item.endTime) {
			timeLabel = `Ends ${item.endTime.slice(0, 5)}`
		}
	}

	// radius: single-day -> rounded, start -> rounded left, end -> rounded right,
	// middle -> no rounding (seamless connection)
	let radiusClass = "rounded"
	if (continuesFromPrev && continuesToNext) radiusClass = "rounded-none"
	else if (continuesFromPrev && !continuesToNext) radiusClass = "rounded-r-md"
	else if (!continuesFromPrev && continuesToNext) radiusClass = "rounded-l-md"

	const baseClass = `overflow-hidden bg-accent ${radiusClass} text-xs px-1 py-0.5 truncate w-full text-left flex items-center gap-2`

	return (
		<Popover open={open} onOpenChange={onOpenChange}>
			<PopoverTrigger asChild>
				<button
					type="button"
					onMouseEnter={openPopover}
					onMouseLeave={handleTriggerMouseLeave}
					onClick={onTriggerClick}
					className={baseClass}
					aria-label={item.title}
				>
					<span className="truncate flex-1">{item.title}</span>
					{timeLabel && (
						<span className="text-[11px] text-neutral-500 ml-auto shrink-0">
							{timeLabel}
						</span>
					)}
				</button>
			</PopoverTrigger>
			<PopoverContent
				className="w-72 transition-opacity duration-200 ease-in-out data-[state=open]:opacity-100 data-[state=closed]:opacity-0"
				onMouseEnter={openPopover}
				onMouseLeave={handleContentMouseLeave}
			>
				<div className="text-sm font-medium">{item.title}</div>
				<div className="text-xs text-neutral-500">
					{isAllDay(item)
						? "All day"
						: item.startTime
							? `${item.startTime}${item.endTime ? ` — ${item.endTime}` : ""}`
							: "All day"}
				</div>
				{item.description && (
					<div className="mt-2 text-sm whitespace-pre-line">
						{item.description}
					</div>
				)}
			</PopoverContent>
		</Popover>
	)
}
