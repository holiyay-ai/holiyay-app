/**
 * Item Repository
 *
 * Database access layer for calendar items. Items belong to a calendar and
 * are organized by date with an orderIndex for drag-and-drop reordering.
 * Supports batch reordering for efficient drag-and-drop operations.
 */

import { and, asc, eq } from "drizzle-orm"
import { db } from "../../db"
import { type Item, items, type NewItem } from "../../db/schema"

export interface ItemFilters {
	calendarId?: string
	date?: string
}

export interface ReorderItem {
	id: string
	orderIndex: number
}

export const itemRepository = {
	async findById(id: string): Promise<Item | null> {
		const [item] = await db
			.select()
			.from(items)
			.where(eq(items.id, id))
			.limit(1)

		return item ?? null
	},

	async findByCalendarId(calendarId: string): Promise<Item[]> {
		return await db
			.select()
			.from(items)
			.where(eq(items.calendarId, calendarId))
			.orderBy(asc(items.date), asc(items.orderIndex))
	},

	async findByCalendarAndDate(
		calendarId: string,
		date: string,
	): Promise<Item[]> {
		return await db
			.select()
			.from(items)
			.where(and(eq(items.calendarId, calendarId), eq(items.date, date)))
			.orderBy(asc(items.orderIndex))
	},

	async create(data: NewItem): Promise<Item> {
		const [item] = await db.insert(items).values(data).returning()

		if (!item) {
			throw new Error("Failed to create item")
		}

		return item
	},

	async update(
		id: string,
		data: Partial<Omit<Item, "id" | "createdAt">>,
	): Promise<Item | null> {
		const [updated] = await db
			.update(items)
			.set({
				...data,
				updatedAt: new Date(),
			})
			.where(eq(items.id, id))
			.returning()

		return updated ?? null
	},

	async delete(id: string): Promise<boolean> {
		const result = await db
			.delete(items)
			.where(eq(items.id, id))
			.returning({ id: items.id })

		return result.length > 0
	},

	async getNextOrderIndex(calendarId: string, date: string): Promise<number> {
		const existingItems = await db
			.select({ orderIndex: items.orderIndex })
			.from(items)
			.where(and(eq(items.calendarId, calendarId), eq(items.date, date)))
			.orderBy(asc(items.orderIndex))

		if (existingItems.length === 0) {
			return 0
		}

		return Math.max(...existingItems.map((i) => i.orderIndex)) + 1
	},

	async reorder(calendarId: string, itemUpdates: ReorderItem[]): Promise<void> {
		await Promise.all(
			itemUpdates.map(({ id, orderIndex }) =>
				db
					.update(items)
					.set({ orderIndex, updatedAt: new Date() })
					.where(and(eq(items.id, id), eq(items.calendarId, calendarId))),
			),
		)
	},

	async deleteByCalendarId(calendarId: string): Promise<void> {
		await db.delete(items).where(eq(items.calendarId, calendarId))
	},

	async countByCalendarId(calendarId: string): Promise<number> {
		const result = await db
			.select({ id: items.id })
			.from(items)
			.where(eq(items.calendarId, calendarId))

		return result.length
	},
}

export type ItemRepository = typeof itemRepository
