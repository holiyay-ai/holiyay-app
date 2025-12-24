/**
 * Checklist Repository (Supabase)
 */

import { getSupabaseAdmin } from "@/api/db"
import type { DbChecklistInsert, DbChecklistRow } from "@/api/db/schema"
import {
	type Checklist,
	type ChecklistItem,
	checklists,
	type NewChecklist,
} from "../db/schema"
import { AppError } from "../types"

function mapRow(row: DbChecklistRow): Checklist {
	return {
		id: row.id,
		calendarId: row.calendar_id,
		title: row.title,
		items: (row.items as ChecklistItem[]) ?? [],
		aiGenerated: !!row.ai_generated,
		createdAt: new Date(row.created_at),
		updatedAt: new Date(row.updated_at),
	}
}

export type { ChecklistItem }

export interface UpdateChecklistData {
	title?: string
	items?: ChecklistItem[]
}

export const checklistRepository = {
	async findById(id: string): Promise<Checklist | null> {
		const supabase = getSupabaseAdmin()
		const { data, error } = await supabase
			.from(checklists)
			.select("*")
			.eq("id", id)
			.maybeSingle()
		if (error) throw new AppError(error.message, "INTERNAL_ERROR")
		return data ? mapRow(data) : null
	},

	async findByCalendarId(calendarId: string): Promise<Checklist[]> {
		const supabase = getSupabaseAdmin()
		const { data, error } = await supabase
			.from(checklists)
			.select("*")
			.eq("calendar_id", calendarId)
		if (error) throw new AppError(error.message, "INTERNAL_ERROR")
		return (data ?? []).map(mapRow)
	},

	async create(data: NewChecklist): Promise<Checklist> {
		const supabase = getSupabaseAdmin()
		const insertPayload: DbChecklistInsert = {
			calendar_id: data.calendarId,
			title: data.title,
			items: data.items,
			ai_generated: data.aiGenerated ?? false,
		}

		const { data: row, error } = await supabase
			.from(checklists)
			.insert(insertPayload)
			.select()
			.maybeSingle()
		if (error) throw new AppError(error.message, "INTERNAL_ERROR")
		if (!row) throw new AppError("Failed to create checklist", "INTERNAL_ERROR")
		return mapRow(row as DbChecklistRow)
	},

	async update(
		id: string,
		data: UpdateChecklistData,
	): Promise<Checklist | null> {
		const updateData: Record<string, unknown> = {}
		if (data.title !== undefined) updateData.title = data.title
		if (data.items !== undefined) updateData.items = data.items
		updateData.updated_at = new Date().toISOString()

		const supabase = getSupabaseAdmin()
		const { data: row, error } = await supabase
			.from(checklists)
			.update(updateData)
			.eq("id", id)
			.select()
			.maybeSingle()
		if (error) throw new AppError(error.message, "INTERNAL_ERROR")
		return row ? mapRow(row) : null
	},

	async delete(id: string): Promise<boolean> {
		const supabase = getSupabaseAdmin()
		const { error } = await supabase.from(checklists).delete().eq("id", id)
		if (error) throw new AppError(error.message, "INTERNAL_ERROR")
		return true
	},

	async deleteByCalendarId(calendarId: string): Promise<number> {
		const supabase = getSupabaseAdmin()
		const { data, error } = await supabase
			.from(checklists)
			.delete()
			.eq("calendar_id", calendarId)
			.select("id")
		if (error) throw new AppError(error.message, "INTERNAL_ERROR")
		return (data ?? []).length
	},

	async toggleItem(
		checklistId: string,
		itemIndex: number,
	): Promise<Checklist | null> {
		const checklist = await this.findById(checklistId)
		if (!checklist) return null
		const items = checklist.items as ChecklistItem[]
		if (itemIndex < 0 || itemIndex >= items.length || !items?.[itemIndex])
			return null
		items[itemIndex].checked = !items[itemIndex].checked
		return await this.update(checklistId, { items })
	},
}
