"use server"

import { cookies } from "next/headers"
import api, { type UpdateItemRequest } from "@/lib/api"

export async function updateCalendarItemAction(
	payload: UpdateItemRequest,
	calendarId: string,
	itemId: string,
) {
	const cookieStore = await cookies()
	const token = cookieStore.get("holiyay_session")?.value || ""
	return await api.items.update(token, calendarId, itemId, payload)
}
