import { getCalendarAction } from "@/actions/get-calendar"

export default async function CalendarPage({
	params,
}: PageProps<"/calendars/[calendar_id]">) {
	const { calendar_id } = await params
	const result = await getCalendarAction(calendar_id)
	if (result.error) throw result.error
	return null
}
