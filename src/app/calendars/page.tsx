import { getCalendarsAction } from "@/actions/get-calendars"

export default async function CalendarsPage() {
	const result = await getCalendarsAction()
	if (result.error) throw result.error
	return null
}
