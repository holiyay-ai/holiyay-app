"use client"

import { CalendarIcon } from "lucide-react"
import { useTranslation } from "react-i18next"
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
	const { t } = useTranslation()

	return (
		<Empty>
			<EmptyHeader>
				<EmptyMedia variant="icon">
					<CalendarIcon />
				</EmptyMedia>
				<EmptyTitle>{t("calendar:labels.no_plans_found")}</EmptyTitle>
				<EmptyDescription>
					{t("calendar:bodies.no_plans_found")}
				</EmptyDescription>
			</EmptyHeader>
			<EmptyContent>
				<Button
					onClick={() => setCreateCalendarModalOpen(true)}
					disabled={createCalendarModalOpen}
				>
					{t("calendar:actions.create_first_plan")}
				</Button>
			</EmptyContent>
		</Empty>
	)
}
