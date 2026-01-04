"use server"

import { cookies } from "next/headers"
import api, { type CreateCalendarRequest } from "@/lib/api"

export async function postCalendarAction(payload: CreateCalendarRequest) {
	const cookieStore = await cookies()
	const token = cookieStore.get("holiyay_session")?.value || ""
	return await api.calendars.create(token, payload)
}
