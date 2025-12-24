/**
 * User Repository (Supabase Auth)
 *
 * Uses Supabase Auth admin APIs for user operations and maps auth user
 * objects to the application `User` shape.
 */

import { getSupabaseAdmin } from "@/api/db"
import type { User } from "@/api/db/schema"
import { AppError } from "../types"

type AuthUserLike = {
	id: string
	email?: string | null
	user_metadata?: { name?: string; avatar_url?: string }
	created_at?: string
}

function mapAuthUser(u: AuthUserLike): User {
	const base = {
		id: u.id,
		email: u.email ?? "",
		name: u.user_metadata?.name ?? "",
		avatarUrl: u.user_metadata?.avatar_url ?? null,
	}
	if (u.created_at) return { ...base, createdAt: new Date(u.created_at) }
	return base as User
}

export interface CreateUserData {
	email: string
	name?: string
	password?: string // optional: prefer using auth adapter for user sign-up
}

type CreateUserParams = {
	email: string
	password?: string
	user_metadata?: { name?: string; avatar_url?: string }
}

type UpdateUserParams = {
	email?: string
	user_metadata?: { name?: string; avatar_url?: string }
}

export interface UpdateUserData {
	name?: string
	avatarUrl?: string | null
	email?: string
}

export const userRepository = {
	async findById(id: string): Promise<User | null> {
		const supabase = getSupabaseAdmin()
		const { data, error } = await supabase.auth.admin.getUserById(id)
		if (error || !data?.user) return null
		return mapAuthUser(data.user)
	},

	async findByEmail(email: string): Promise<User | null> {
		const supabase = getSupabaseAdmin()
		const { data, error } = await supabase.auth.admin.listUsers()
		if (error || !data?.users) return null
		const found = data.users.find(
			(u: AuthUserLike) => u.email === email.toLowerCase(),
		)
		return found ? mapAuthUser(found) : null
	},

	async existsByEmail(email: string): Promise<boolean> {
		return (await this.findByEmail(email)) !== null
	},

	async create(input: CreateUserData): Promise<User> {
		const supabase = getSupabaseAdmin()
		const params: CreateUserParams = {
			email: input.email.toLowerCase(),
		}
		if (input.password !== undefined) params.password = input.password
		if (input.name !== undefined)
			params.user_metadata = {
				...(params.user_metadata ?? {}),
				name: input.name,
			}

		const { data, error } = await supabase.auth.admin.createUser(params)
		if (error || !data?.user) {
			const msg = error?.message ?? "Failed to create user"
			const code = /already|duplicate/i.test(msg)
				? "USER_ALREADY_EXISTS"
				: "INTERNAL_ERROR"
			throw new AppError(msg, code)
		}
		return mapAuthUser(data.user)
	},

	async update(id: string, input: UpdateUserData): Promise<User | null> {
		const supabase = getSupabaseAdmin()
		const params: UpdateUserParams = {}
		if (input.email !== undefined) params.email = input.email.toLowerCase()
		if (input.name !== undefined)
			params.user_metadata = {
				...(params.user_metadata ?? {}),
				name: input.name,
			}
		if (input.avatarUrl !== undefined) {
			if (input.avatarUrl === null) {
				// Clear avatar by setting empty string (Supabase metadata doesn't accept explicit `undefined`)
				params.user_metadata = {
					...(params.user_metadata ?? {}),
					avatar_url: "",
				}
			} else {
				params.user_metadata = {
					...(params.user_metadata ?? {}),
					avatar_url: input.avatarUrl,
				}
			}
		}

		const { data, error } = await supabase.auth.admin.updateUserById(id, params)
		if (error || !data?.user) return null
		return mapAuthUser(data.user)
	},

	async delete(id: string): Promise<boolean> {
		const supabase = getSupabaseAdmin()
		const { error } = await supabase.auth.admin.deleteUser(id)
		if (error) throw new AppError(error.message, "INTERNAL_ERROR")
		return true
	},
}

export type UserRepository = typeof userRepository
