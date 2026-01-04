"use server"

import { cookies } from "next/headers"
import api, { type UpdateCalendarRequest } from "@/lib/api"

export async function updateCalendarAction(
	payload: UpdateCalendarRequest,
	calendarId: string,
) {
	const cookieStore = await cookies()
	const token = cookieStore.get("holiyay_session")?.value || ""
	return await api.calendars.update(token, calendarId, payload)
}
