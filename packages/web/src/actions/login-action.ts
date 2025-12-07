"use server"

import api from "@/lib/api"

export async function loginAction(email: string, password: string) {
	return await api.auth.login({ email, password })
}
