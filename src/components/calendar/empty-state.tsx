"use client"

import { CalendarIcon } from "lucide-react"
import { Button } from "../ui/button"
import {
	Empty,
	EmptyContent,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "../ui/empty"
import { useCalendar } from "./calendar-context"

export function EmptyState() {
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
