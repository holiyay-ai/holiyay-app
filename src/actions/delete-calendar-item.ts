"use server"

import api from "@/lib/api"

export async function deleteCalendarItemAction(
	calendarId: string,
	itemId: string,
	token: string,
) {
	return await api.items.delete(token, calendarId, itemId)
}
