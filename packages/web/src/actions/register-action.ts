"use server"

import api from "@/lib/api"

export async function registerAction(
	name: string,
	email: string,
	password: string,
) {
	return await api.auth.register({ name, email, password })
}
