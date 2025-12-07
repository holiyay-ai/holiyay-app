/**
 * Checklist Repository
 *
 * Database access layer for checklists. Checklists are associated with calendars
 * and contain an array of items (text + checked status). Supports AI-generated
 * checklists with the aiGenerated flag for tracking.
 */

import { eq } from "drizzle-orm"
import { db } from "../db"
import { type Checklist, checklists, type NewChecklist } from "../db/schema"

export interface ChecklistItem {
	text: string
	checked: boolean
}

export interface UpdateChecklistData {
	title?: string
	items?: ChecklistItem[]
}

export const checklistRepository = {
	async findById(id: string): Promise<Checklist | null> {
		const [checklist] = await db
			.select()
			.from(checklists)
			.where(eq(checklists.id, id))
			.limit(1)

		return checklist ?? null
	},

	async findByCalendarId(calendarId: string): Promise<Checklist[]> {
		return await db
			.select()
			.from(checklists)
			.where(eq(checklists.calendarId, calendarId))
	},

	async create(data: NewChecklist): Promise<Checklist> {
		const [checklist] = await db.insert(checklists).values(data).returning()

		if (!checklist) {
			throw new Error("Failed to create checklist")
		}

		return checklist
	},

	async update(
		id: string,
		data: UpdateChecklistData,
	): Promise<Checklist | null> {
		const updateData: Record<string, unknown> = {
			updatedAt: new Date(),
		}

		if (data.title !== undefined) {
			updateData.title = data.title
		}

		if (data.items !== undefined) {
			updateData.items = data.items
		}

		const [updated] = await db
			.update(checklists)
			.set(updateData)
			.where(eq(checklists.id, id))
			.returning()

		return updated ?? null
	},

	async delete(id: string): Promise<boolean> {
		const result = await db
			.delete(checklists)
			.where(eq(checklists.id, id))
			.returning({ id: checklists.id })

		return result.length > 0
	},

	async deleteByCalendarId(calendarId: string): Promise<number> {
		const result = await db
			.delete(checklists)
			.where(eq(checklists.calendarId, calendarId))
			.returning({ id: checklists.id })

		return result.length
	},

	async toggleItem(
		checklistId: string,
		itemIndex: number,
	): Promise<Checklist | null> {
		const checklist = await this.findById(checklistId)

		if (!checklist) {
			return null
		}

		const items = checklist.items as ChecklistItem[]

		if (itemIndex < 0 || itemIndex >= items.length || !items?.[itemIndex]) {
			return null
		}

		items[itemIndex].checked = !items[itemIndex].checked

		return await this.update(checklistId, { items })
	},
}
