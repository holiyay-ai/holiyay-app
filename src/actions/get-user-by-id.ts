"use server"

import { cookies } from "next/headers"
import api from "@/lib/api"

export async function getUserByIdAction(userId: string) {
	const cookieStore = await cookies()
	const token = cookieStore.get("holiyay_session")?.value || ""
	return await api.auth.userById(userId, token)
}
