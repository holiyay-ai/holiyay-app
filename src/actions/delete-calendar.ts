"use server"

import api from "@/lib/api"

export async function deleteCalendarAction(calendarId: string, token: string) {
	return await api.calendars.delete(token, calendarId)
}
