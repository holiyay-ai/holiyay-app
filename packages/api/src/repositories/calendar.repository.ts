/**
 * Calendar Repository
 *
 * Database access layer for calendars. Handles CRUD operations, ownership checks,
 * and access control queries. Calendars can be owned by a user or shared with
 * other users via the calendar_shares table.
 */

import { and, eq } from "drizzle-orm"
import { db } from "../db"
import {
	type Calendar,
	calendarShares,
	calendars,
	type NewCalendar,
} from "../db/schema"

export interface CalendarAccess {
	calendar: Calendar
	permission: "view" | "edit"
	isOwner: boolean
}

export const calendarRepository = {
	async findById(id: string): Promise<Calendar | null> {
		const [calendar] = await db
			.select()
			.from(calendars)
			.where(eq(calendars.id, id))
			.limit(1)

		return calendar ?? null
	},

	async findByShareToken(token: string): Promise<Calendar | null> {
		const [calendar] = await db
			.select()
			.from(calendars)
			.where(eq(calendars.shareToken, token))
			.limit(1)

		return calendar ?? null
	},

	async findByOwnerId(ownerId: string): Promise<Calendar[]> {
		return db.select().from(calendars).where(eq(calendars.ownerId, ownerId))
	},

	async findSharedWithUser(
		userId: string,
	): Promise<{ calendar: Calendar; permission: "view" | "edit" }[]> {
		const results = await db
			.select({
				calendar: calendars,
				permission: calendarShares.permission,
			})
			.from(calendarShares)
			.innerJoin(calendars, eq(calendarShares.calendarId, calendars.id))
			.where(eq(calendarShares.userId, userId))

		return results
	},

	async findWithAccess(
		calendarId: string,
		userId: string,
	): Promise<CalendarAccess | null> {
		const [owned] = await db
			.select()
			.from(calendars)
			.where(and(eq(calendars.id, calendarId), eq(calendars.ownerId, userId)))
			.limit(1)

		if (owned) {
			return {
				calendar: owned,
				permission: "edit",
				isOwner: true,
			}
		}

		const [shared] = await db
			.select({
				calendar: calendars,
				permission: calendarShares.permission,
			})
			.from(calendarShares)
			.innerJoin(calendars, eq(calendarShares.calendarId, calendars.id))
			.where(
				and(
					eq(calendarShares.calendarId, calendarId),
					eq(calendarShares.userId, userId),
				),
			)
			.limit(1)

		if (shared) {
			return {
				calendar: shared.calendar,
				permission: shared.permission,
				isOwner: false,
			}
		}

		return null
	},

	async create(data: NewCalendar): Promise<Calendar> {
		const [calendar] = await db.insert(calendars).values(data).returning()
		if (!calendar) {
			throw new Error("Failed to create calendar")
		}
		return calendar
	},

	async update(
		id: string,
		data: Partial<Omit<Calendar, "id" | "createdAt">>,
	): Promise<Calendar | null> {
		const [updated] = await db
			.update(calendars)
			.set({
				...data,
				updatedAt: new Date(),
			})
			.where(eq(calendars.id, id))
			.returning()

		return updated ?? null
	},

	async delete(id: string): Promise<boolean> {
		const result = await db
			.delete(calendars)
			.where(eq(calendars.id, id))
			.returning({ id: calendars.id })

		return result.length > 0
	},

	async isOwner(calendarId: string, userId: string): Promise<boolean> {
		const [calendar] = await db
			.select({ id: calendars.id })
			.from(calendars)
			.where(and(eq(calendars.id, calendarId), eq(calendars.ownerId, userId)))
			.limit(1)

		return !!calendar
	},
}
