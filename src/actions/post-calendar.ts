"use server"

import api, { type CreateCalendarRequest } from "@/lib/api"

export async function postCalendarAction(
	payload: CreateCalendarRequest,
	token: string,
) {
	return await api.calendars.create(token, payload)
}
