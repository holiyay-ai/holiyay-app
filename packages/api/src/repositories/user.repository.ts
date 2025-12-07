/**
 * User Repository
 *
 * Database access layer for users. Handles user CRUD operations and
 * email lookups. Email addresses are normalized to lowercase for
 * case-insensitive matching.
 */

import { eq } from "drizzle-orm"
import { db } from "../db"
import { type NewUser, type User, users } from "../db/schema"

export interface CreateUserData {
	email: string
	name: string
	passwordHash: string
}

export interface UpdateUserData {
	name?: string
	avatarUrl?: string | null
}

export const userRepository = {
	async findById(id: string): Promise<User | null> {
		const [user] = await db
			.select()
			.from(users)
			.where(eq(users.id, id))
			.limit(1)

		return user ?? null
	},

	async findByEmail(email: string): Promise<User | null> {
		const [user] = await db
			.select()
			.from(users)
			.where(eq(users.email, email.toLowerCase()))
			.limit(1)

		return user ?? null
	},

	async existsByEmail(email: string): Promise<boolean> {
		const user = await this.findByEmail(email)
		return user !== null
	},

	async create(data: CreateUserData): Promise<User> {
		const newUser: NewUser = {
			email: data.email.toLowerCase(),
			name: data.name,
			passwordHash: data.passwordHash,
		}

		const [user] = await db.insert(users).values(newUser).returning()

		if (!user) {
			throw new Error("Failed to create user")
		}

		return user
	},

	async update(id: string, data: UpdateUserData): Promise<User | null> {
		const [user] = await db
			.update(users)
			.set({
				...data,
				updatedAt: new Date(),
			})
			.where(eq(users.id, id))
			.returning()

		return user ?? null
	},

	async delete(id: string): Promise<boolean> {
		const result = await db.delete(users).where(eq(users.id, id))
		return result.length > 0
	},
}

export type UserRepository = typeof userRepository
