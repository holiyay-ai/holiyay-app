import { format, isToday } from "date-fns"
import { PlusIcon } from "lucide-react"
import type { ItemResponse } from "@/api/types"
import { Button } from "../ui/button"
import { CardContent } from "../ui/card"
import { useCalendar } from "./calendar-context"
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
	const {
		modals: { setCreateItemModalOpen },
	} = useCalendar()
	const today = isToday(date)
	const handleOnAdd = () => {
		setCreateItemModalOpen({
			startDate: format(date, "yyyy-MM-dd"),
		})
	}
	return (
		<div
			className={`overflow-hidden w-full border rounded p-1 sm:p-2 min-h-12 sm:min-h-16 flex flex-col justify-between ${
				!inMonth
					? "opacity-20 text-neutral-400 border-transparent pointer-events-none"
					: ""
			} ${!inRange ? "text-neutral-400" : ""} ${isPast ? "text-neutral-600 opacity-90" : ""}`}
		>
			<div className="flex items-start justify-between gap-2">
				<div className="flex flex-row gap-2 item-center justify-center">
					<div
						className={`text-sm font-medium flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 ${
							today ? "bg-red-700 text-white rounded-full" : ""
						}`}
					>
						{format(date, "d")}
					</div>
				</div>
				<Button
					size="icon-sm"
					variant="ghost"
					disabled={!inRange}
					onClick={handleOnAdd}
				>
					<PlusIcon />
				</Button>
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
