"use server"
import { cookies } from "next/headers"

export async function getSessionCookie(): Promise<string> {
	const cookieStore = await cookies()
	return cookieStore.get("holiyay_session")?.value || ""
}
