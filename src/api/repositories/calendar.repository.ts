/**
 * Calendar Repository (Supabase)
 */

import { getSupabaseAdmin } from "@/api/db"
import type { DbCalendarInsert, DbCalendarRow } from "@/api/db/schema"
import {
	type Calendar,
	calendarShares,
	calendars,
	type NewCalendar,
} from "../db/schema"
import { AppError } from "../types"

export interface CalendarAccess {
	calendar: Calendar
	permission: "view" | "edit"
	isOwner: boolean
}

function mapRow(row: DbCalendarRow): Calendar {
	return {
		id: row.id,
		ownerId: row.owner_id,
		name: row.name,
		destination: row.destination ?? null,
		startDate: row.start_date,
		endDate: row.end_date,
		shareToken: row.share_token ?? "",
		createdAt: new Date(row.created_at),
		updatedAt: new Date(row.updated_at),
	}
}

export const calendarRepository = {
	async findById(id: string): Promise<Calendar | null> {
		const supabase = getSupabaseAdmin()
		const { data, error } = await supabase
			.from(calendars)
			.select("*")
			.eq("id", id)
			.maybeSingle()
		if (error) throw new AppError(error.message, "INTERNAL_ERROR")
		return data ? mapRow(data) : null
	},

	async findByShareToken(token: string): Promise<Calendar | null> {
		const supabase = getSupabaseAdmin()
		const { data, error } = await supabase
			.from(calendars)
			.select("*")
			.eq("share_token", token)
			.maybeSingle()
		if (error) throw new AppError(error.message, "INTERNAL_ERROR")
		return data ? mapRow(data) : null
	},

	async findByOwnerId(ownerId: string): Promise<Calendar[]> {
		const supabase = getSupabaseAdmin()
		const { data, error } = await supabase
			.from(calendars)
			.select("*")
			.eq("owner_id", ownerId)
		if (error) throw new AppError(error.message, "INTERNAL_ERROR")
		return (data ?? []).map(mapRow)
	},

	async findSharedWithUser(
		userId: string,
	): Promise<{ calendar: Calendar; permission: "view" | "edit" }[]> {
		const supabase = getSupabaseAdmin()
		const { data, error } = await supabase
			.from(calendarShares)
			.select("*, calendars(*)")
			.eq("user_id", userId)
		if (error) throw new AppError(error.message, "INTERNAL_ERROR")
		const rows = data ?? []
		return rows.map((r: unknown) => ({
			calendar: mapRow(
				(r as Record<string, unknown>).calendars as DbCalendarRow,
			),
			permission: (r as Record<string, unknown>).permission as "view" | "edit",
		}))
	},

	async findWithAccess(
		calendarId: string,
		userId: string,
	): Promise<CalendarAccess | null> {
		const supabase = getSupabaseAdmin()

		// Check owner
		const { data: ownedData, error: ownerErr } = await supabase
			.from(calendars)
			.select("*")
			.eq("id", calendarId)
			.eq("owner_id", userId)
			.maybeSingle()
		if (ownerErr) throw new AppError(ownerErr.message, "INTERNAL_ERROR")
		if (ownedData) {
			return { calendar: mapRow(ownedData), permission: "edit", isOwner: true }
		}

		// Check shared — try both `calendar_id` and DB's generated `calender_id` (typo)
		let sharedData: Record<string, unknown> | null = null
		let res = await supabase
			.from(calendarShares)
			.select("*, calendars(*)")
			.eq("calendar_id", calendarId)
			.eq("user_id", userId)
			.maybeSingle()
		if (res.error) throw new AppError(res.error.message, "INTERNAL_ERROR")
		if (res.data) sharedData = res.data as Record<string, unknown>
		if (!sharedData) {
			res = await supabase
				.from(calendarShares)
				.select("*, calendars(*)")
				.eq("calender_id", calendarId)
				.eq("user_id", userId)
				.maybeSingle()
			if (res.error) throw new AppError(res.error.message, "INTERNAL_ERROR")
			sharedData = res.data as Record<string, unknown> | null
		}
		if (sharedData) {
			return {
				calendar: mapRow(sharedData.calendars as DbCalendarRow),
				permission: sharedData.permission as "view" | "edit",
				isOwner: false,
			}
		}

		return null
	},

	async create(data: NewCalendar): Promise<Calendar> {
		const supabase = getSupabaseAdmin()
		const insertPayload: DbCalendarInsert = {
			owner_id: data.ownerId,
			name: data.name,
			destination: data.destination ?? null,
			start_date: data.startDate,
			end_date: data.endDate,
		}

		const { data: row, error } = await supabase
			.from(calendars)
			.insert(insertPayload)
			.select()
			.maybeSingle()
		if (error) throw new AppError(error.message, "INTERNAL_ERROR")
		if (!row) throw new AppError("Failed to create calendar", "INTERNAL_ERROR")
		return mapRow(row as DbCalendarRow)
	},

	async update(
		id: string,
		data: Partial<Omit<Calendar, "id" | "createdAt">>,
	): Promise<Calendar | null> {
		const supabase = getSupabaseAdmin()
		const updateData: Record<string, unknown> = {}
		if (data.name !== undefined) updateData.name = data.name
		if (data.destination !== undefined)
			updateData.destination = data.destination
		if (data.startDate !== undefined) updateData.start_date = data.startDate
		if (data.endDate !== undefined) updateData.end_date = data.endDate
		updateData.updated_at = new Date().toISOString()
		const { data: row, error } = await supabase
			.from(calendars)
			.update(updateData)
			.eq("id", id)
			.select()
			.maybeSingle()
		if (error) throw new AppError(error.message, "INTERNAL_ERROR")
		return row ? mapRow(row) : null
	},

	async delete(id: string): Promise<boolean> {
		const supabase = getSupabaseAdmin()
		const { error } = await supabase.from(calendars).delete().eq("id", id)
		if (error) throw new AppError(error.message, "INTERNAL_ERROR")
		return true
	},

	async isOwner(calendarId: string, userId: string): Promise<boolean> {
		const supabase = getSupabaseAdmin()
		const { data, error } = await supabase
			.from(calendars)
			.select("id")
			.eq("id", calendarId)
			.eq("owner_id", userId)
			.maybeSingle()
		if (error) throw new AppError(error.message, "INTERNAL_ERROR")
		return !!data
	},
}
