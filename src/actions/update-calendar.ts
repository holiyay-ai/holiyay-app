"use server"

import api, { type UpdateCalendarRequest } from "@/lib/api"

export async function updateCalendarAction(
	payload: UpdateCalendarRequest,
	calendarId: string,
	token: string,
) {
	return await api.calendars.update(token, calendarId, payload)
}
