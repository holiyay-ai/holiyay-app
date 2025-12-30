"use server"

import api, { type CreateItemRequest } from "@/lib/api"

export async function postCalendarItemAction(
	payload: CreateItemRequest,
	calendarId: string,
	token: string,
) {
	return await api.items.create(token, calendarId, payload)
}
