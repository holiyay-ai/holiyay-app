"use server"

import api from "@/lib/api"

export async function logoutAction() {
	return await api.auth.logout()
}
