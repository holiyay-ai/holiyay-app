"use server"

import api from "@/lib/api"

export async function logoutAction(token: string) {
	return await api.auth.logout(token)
}
