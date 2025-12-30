"use server"

import api, { type UpdateItemRequest } from "@/lib/api"

export async function updateCalendarItemAction(
	payload: UpdateItemRequest,
	calendarId: string,
	itemId: string,
	token: string,
) {
	return await api.items.update(token, calendarId, itemId, payload)
}
