"use server"

import { cookies } from "next/headers"
import api from "@/lib/api"

export async function getCalendarAction(calendarId: string) {
	const cookieStore = await cookies()
	const token = cookieStore.get("holiyay_session")?.value || ""
	const result = await api.calendars.get(token, calendarId)
	if (result.error) {
		throw result.error
	}
	return result.data
}
