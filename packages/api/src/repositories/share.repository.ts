/**
 * Share Repository
 *
 * Database access layer for calendar shares. Handles sharing calendars with
 * other users via permission-based access (view/edit). Supports querying
 * shares by calendar, user, or share ID with related data.
 */

import { and, eq } from "drizzle-orm"
import { db } from "../db"
import type { CalendarShare, NewCalendarShare } from "../db/schema"
import { calendarShares, calendars, users } from "../db/schema"

export interface ShareWithUser {
	id: string
	permission: "view" | "edit"
	invitedAt: Date
	user: {
		id: string
		email: string
		name: string
		avatarUrl: string | null
	}
}

export interface ShareWithCalendar {
	share: CalendarShare
	calendar: {
		id: string
		ownerId: string
		name: string
	}
}

export const shareRepository = {
	async findByCalendarAndUser(
		calendarId: string,
		userId: string,
	): Promise<CalendarShare | null> {
		const [share] = await db
			.select()
			.from(calendarShares)
			.where(
				and(
					eq(calendarShares.calendarId, calendarId),
					eq(calendarShares.userId, userId),
				),
			)
			.limit(1)

		return share ?? null
	},

	async findByIdWithCalendar(
		shareId: string,
	): Promise<ShareWithCalendar | null> {
		const [result] = await db
			.select({
				share: calendarShares,
				calendar: {
					id: calendars.id,
					ownerId: calendars.ownerId,
					name: calendars.name,
				},
			})
			.from(calendarShares)
			.innerJoin(calendars, eq(calendarShares.calendarId, calendars.id))
			.where(eq(calendarShares.id, shareId))
			.limit(1)

		return result ?? null
	},

	async listByCalendar(calendarId: string): Promise<ShareWithUser[]> {
		const shares = await db
			.select({
				id: calendarShares.id,
				permission: calendarShares.permission,
				invitedAt: calendarShares.invitedAt,
				user: {
					id: users.id,
					email: users.email,
					name: users.name,
					avatarUrl: users.avatarUrl,
				},
			})
			.from(calendarShares)
			.innerJoin(users, eq(calendarShares.userId, users.id))
			.where(eq(calendarShares.calendarId, calendarId))

		return shares
	},

	async create(data: NewCalendarShare): Promise<CalendarShare> {
		const [share] = await db.insert(calendarShares).values(data).returning()

		if (!share) {
			throw new Error("Failed to create share")
		}

		return share
	},

	async updatePermission(
		shareId: string,
		permission: "view" | "edit",
	): Promise<CalendarShare> {
		const [updated] = await db
			.update(calendarShares)
			.set({ permission })
			.where(eq(calendarShares.id, shareId))
			.returning()

		if (!updated) {
			throw new Error("Failed to update share permission")
		}

		return updated
	},

	async delete(shareId: string): Promise<void> {
		await db.delete(calendarShares).where(eq(calendarShares.id, shareId))
	},
}
