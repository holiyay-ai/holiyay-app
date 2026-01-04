/**
 * Item Repository (Supabase)
 */

import { getSupabaseAdmin } from "@/api/db"
import type { DbItemInsert, DbItemRow } from "@/api/db/schema"
import { type Item, items, type NewItem } from "../db/schema"
import { AppError } from "../types"

function mapRow(row: DbItemRow): Item {
	return {
		id: row.id,
		calendarId: row.calendar_id,
		date: row.date,
		title: row.title,
		description: row.description ?? null,
		startTime: row.start_time ?? null,
		endTime: row.end_time ?? null,
		location: row.location ?? null,
		category: row.category as Item["category"],
		checklistId: row.checklist_id ?? null,
		orderIndex: Number(row.order_index ?? 0),
		createdAt: new Date(row.created_at),
		updatedAt: new Date(row.updated_at),
	}
}

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
		const supabase = getSupabaseAdmin()
		const { data, error } = await supabase
			.from(items)
			.select("*")
			.eq("id", id)
			.maybeSingle()
		if (error) throw new AppError(error.message, "INTERNAL_ERROR")
		return data ? mapRow(data) : null
	},

	async findByCalendarId(calendarId: string): Promise<Item[]> {
		const supabase = getSupabaseAdmin()
		const { data, error } = await supabase
			.from(items)
			.select("*")
			.eq("calendar_id", calendarId)
			.order("date", { ascending: true })
			.order("order_index", { ascending: true })
		if (error) throw new AppError(error.message, "INTERNAL_ERROR")
		return (data ?? []).map(mapRow)
	},

	async findByCalendarAndDate(
		calendarId: string,
		date: string,
	): Promise<Item[]> {
		const supabase = getSupabaseAdmin()
		const { data, error } = await supabase
			.from(items)
			.select("*")
			.eq("calendar_id", calendarId)
			.eq("date", date)
			.order("order_index", { ascending: true })
		if (error) throw new AppError(error.message, "INTERNAL_ERROR")
		return (data ?? []).map(mapRow)
	},

	async create(data: NewItem): Promise<Item> {
		const supabase = getSupabaseAdmin()
		const insertPayload: DbItemInsert = {
			calendar_id: data.calendarId,
			date: data.date,
			title: data.title,
			description: data.description ?? null,
			start_time: data.startTime ?? null,
			end_time: data.endTime ?? null,
			location: data.location ?? null,
			category: data.category,
			checklist_id: data.checklistId ?? null,
			order_index: data.orderIndex ?? 0,
		}

		const { data: row, error } = await supabase
			.from(items)
			.insert(insertPayload)
			.select()
			.maybeSingle()
		if (error) throw new AppError(error.message, "INTERNAL_ERROR")
		if (!row) throw new AppError("Failed to create item", "INTERNAL_ERROR")
		return mapRow(row as DbItemRow)
	},

	async update(
		id: string,
		data: Partial<Omit<Item, "id" | "createdAt">>,
	): Promise<Item | null> {
		const supabase = getSupabaseAdmin()
		const updateData: Record<string, unknown> = {}
		if (data.date !== undefined) updateData.date = data.date
		if (data.title !== undefined) updateData.title = data.title
		if (data.description !== undefined)
			updateData.description = data.description
		if (data.startTime !== undefined) updateData.start_time = data.startTime
		if (data.endTime !== undefined) updateData.end_time = data.endTime
		if (data.location !== undefined) updateData.location = data.location
		if (data.category !== undefined) updateData.category = data.category
		if (data.checklistId !== undefined)
			updateData.checklist_id = data.checklistId
		updateData.updated_at = new Date().toISOString()
		const { data: row, error } = await supabase
			.from(items)
			.update(updateData)
			.eq("id", id)
			.select()
			.maybeSingle()
		if (error) throw new AppError(error.message, "INTERNAL_ERROR")
		return row ? mapRow(row) : null
	},

	async delete(id: string): Promise<boolean> {
		const supabase = getSupabaseAdmin()
		const { error } = await supabase.from(items).delete().eq("id", id)
		if (error) throw new AppError(error.message, "INTERNAL_ERROR")
		return true
	},

	async getNextOrderIndex(calendarId: string, date: string): Promise<number> {
		const supabase = getSupabaseAdmin()
		const { data, error } = await supabase
			.from(items)
			.select("order_index")
			.eq("calendar_id", calendarId)
			.eq("date", date)
			.order("order_index", { ascending: true })
		if (error) throw new AppError(error.message, "INTERNAL_ERROR")
		const existing = data ?? []
		if (existing.length === 0) return 0
		return (
			Math.max(
				...existing.map((i: unknown) =>
					Number((i as Record<string, unknown>).order_index ?? 0),
				),
			) + 1
		)
	},

	async reorder(calendarId: string, itemUpdates: ReorderItem[]): Promise<void> {
		const supabase = getSupabaseAdmin()
		await Promise.all(
			itemUpdates.map(({ id, orderIndex }) =>
				supabase
					.from(items)
					.update({
						order_index: orderIndex,
						updated_at: new Date().toISOString(),
					})
					.eq("id", id)
					.eq("calendar_id", calendarId),
			),
		)
	},

	async deleteByCalendarId(calendarId: string): Promise<void> {
		const supabase = getSupabaseAdmin()
		const { error } = await supabase
			.from(items)
			.delete()
			.eq("calendar_id", calendarId)
		if (error) throw new AppError(error.message, "INTERNAL_ERROR")
	},

	async countByCalendarId(calendarId: string): Promise<number> {
		const supabase = getSupabaseAdmin()
		const { data, error } = await supabase
			.from(items)
			.select("id")
			.eq("calendar_id", calendarId)
		if (error) throw new AppError(error.message, "INTERNAL_ERROR")
		return (data ?? []).length
	},
}

export type ItemRepository = typeof itemRepository
