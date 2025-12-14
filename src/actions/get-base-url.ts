"use server"
import { headers } from "next/headers"

export async function getBaseUrl(): Promise<string> {
	const headersData = await headers()
	const host = headersData.get("host")
	const protocol =
		headersData.get("x-forwarded-proto") ??
		(host?.startsWith("localhost") ? "http" : "https")
	const apiBase = `${protocol}://${host}/api`
	return apiBase
}
