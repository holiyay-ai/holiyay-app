"use client"

import { useState } from "react"
import type { ItemResponse } from "@/types"
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover"
import { isAllDay } from "./helpers"
import { useHoverPopover } from "./use-hover-popover"

/**
 * Small component to render "+N more" and its popover.
 * Keeps popover open while hovering either the trigger or the content.
 * Supports pinning the popover when clicked (click to pin open).
 */
export function MorePopover({
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
									{isAllDay(it)
										? "All day"
										: it.startTime
											? `${it.startTime}${it.endTime ? ` — ${it.endTime}` : ""}`
											: "All day"}
								</div>
							</div>
							{it.description && (
								<div className="text-xs text-neutral-500">{it.description}</div>
							)}
						</div>
					))}
				</div>
			</PopoverContent>
		</Popover>
	)
}
