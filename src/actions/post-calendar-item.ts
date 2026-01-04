"use server"

import { cookies } from "next/headers"
import api, { type CreateItemRequest } from "@/lib/api"

export async function postCalendarItemAction(
	payload: CreateItemRequest,
	calendarId: string,
) {
	const cookieStore = await cookies()
	const token = cookieStore.get("holiyay_session")?.value || ""
	return await api.items.create(token, calendarId, payload)
}
