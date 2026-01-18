import { format, isToday } from "date-fns"
import type { ItemResponse } from "@/api/types"
import { CardContent, CardDescription } from "../ui/card"
import { CalendarItem } from "./calendar-item"
import { MorePopover } from "./more-popover"

export type DayProps = {
	date: Date
	inMonth?: boolean
	inRange?: boolean
	isPast?: boolean
	items?: ItemResponse[]
}

export function Day({
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
								<CalendarItem
									key={`${item.id}-${format(date, "yyyy-MM-dd")}`}
									item={item}
									date={date}
								/>
							))}
							{items.length > 3 && <MorePopover items={items.slice(3)} />}
						</>
					) : null}
				</div>
			</CardContent>
		</div>
	)
}
