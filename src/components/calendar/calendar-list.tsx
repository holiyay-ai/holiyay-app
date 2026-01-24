"use client"

import { differenceInCalendarDays, format, formatRelative } from "date-fns"
import { PlaneIcon } from "lucide-react"
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
import { Spinner } from "../ui/spinner"
import { UserName } from "../user-name"
import { useCalendar } from "./calendar-context"

export function CalendarList() {
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
							<div className="flex items-center gap-2 text-xs text-muted-foreground">
								Created by <UserName id={calendar.ownerId} />
							</div>
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
