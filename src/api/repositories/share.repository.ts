/**
 * Share Repository (Supabase)
 */

import { getSupabaseAdmin } from "@/api/db"
import type { DbCalendarShareInsert, DbCalendarShareRow } from "@/api/db/schema"
import type { CalendarShare, NewCalendarShare } from "../db/schema"
import { calendarShares } from "../db/schema"
import { AppError } from "../types"

type AuthUserLike = {
	id: string
	email?: string | null
	user_metadata?: { name?: string; avatar_url?: string }
	created_at?: string
}

async function fetchUsersByIds(
	supabase: ReturnType<typeof getSupabaseAdmin>,
	ids: string[],
) {
	const results = await Promise.all(
		ids.map(async (id) => {
			const { data } = await supabase.auth.admin.getUserById(id)
			if (!data?.user) return null
			return data.user as AuthUserLike
		}),
	)
	const usersById: Record<string, AuthUserLike> = {}
	for (const u of results) {
		if (u) usersById[u.id] = u
	}
	return usersById
}

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

function mapShareRow(row: DbCalendarShareRow): CalendarShare {
	return {
		id: row.id,
		calendarId:
			row.calendar_id ??
			((row as unknown as Record<string, unknown>).calender_id as
				| string
				| undefined) ??
			"",
		userId: row.user_id,
		permission: row.permission as CalendarShare["permission"],
		invitedAt: new Date(row.invited_at),
	}
}

export const shareRepository = {
	async findByCalendarAndUser(
		calendarId: string,
		userId: string,
	): Promise<CalendarShare | null> {
		const supabase = getSupabaseAdmin()

		// Try standard name first, then fallback to 'calender_id' (typoed column in DB/types)
		let res = await supabase
			.from(calendarShares)
			.select("*")
			.eq("calendar_id", calendarId)
			.eq("user_id", userId)
			.maybeSingle()
		if (res.error) throw new AppError(res.error.message, "INTERNAL_ERROR")
		if (res.data) return mapShareRow(res.data as DbCalendarShareRow)

		res = await supabase
			.from(calendarShares)
			.select("*")
			.eq("calender_id", calendarId)
			.eq("user_id", userId)
			.maybeSingle()
		if (res.error) throw new AppError(res.error.message, "INTERNAL_ERROR")
		return res.data ? mapShareRow(res.data as DbCalendarShareRow) : null
	},

	async findByIdWithCalendar(
		shareId: string,
	): Promise<ShareWithCalendar | null> {
		const supabase = getSupabaseAdmin()
		const { data, error } = await supabase
			.from(calendarShares)
			.select("*, calendars(*)")
			.eq("id", shareId)
			.maybeSingle()
		if (error) throw new AppError(error.message, "INTERNAL_ERROR")
		if (!data) return null
		return {
			share: mapShareRow(data),
			calendar: {
				id: data.calendars.id,
				ownerId: data.calendars.owner_id,
				name: data.calendars.name,
			},
		}
	},

	async listByCalendar(calendarId: string): Promise<ShareWithUser[]> {
		const supabase = getSupabaseAdmin()
		// Try normal column name, otherwise fallback to typoed `calender_id`
		const resPrimary = await supabase
			.from(calendarShares)
			.select("*")
			.eq("calendar_id", calendarId)
		if (resPrimary.error)
			throw new AppError(resPrimary.error.message, "INTERNAL_ERROR")
		let rows: unknown[] = resPrimary.data ?? []
		if (rows.length === 0) {
			const resFallback = await supabase
				.from(calendarShares)
				.select("*")
				.eq("calender_id", calendarId)
			if (resFallback.error)
				throw new AppError(resFallback.error.message, "INTERNAL_ERROR")
			rows = resFallback.data ?? []
		}
		const userIds = rows.map(
			(r: unknown) => (r as Record<string, unknown>).user_id,
		)
		const usersById = await fetchUsersByIds(supabase, userIds as string[])
		return rows.map((r: unknown) => {
			const rec = r as Record<string, unknown>
			const u = usersById[rec.user_id as string] as Record<string, unknown>
			return {
				id: rec.id as string,
				permission: rec.permission as "view" | "edit",
				invitedAt: new Date(rec.invited_at as string),
				user: {
					id: u.id as string,
					email: u.email as string,
					name: u.name as string,
					avatarUrl: (u.avatar_url as string) ?? null,
				},
			}
		})
	},

	async create(data: NewCalendarShare): Promise<CalendarShare> {
		const supabase = getSupabaseAdmin()
		// Build typed insert payload using DB column names
		const insertPayload: DbCalendarShareInsert = {
			...((data as unknown as { calendarId?: string }).calendarId
				? {
						calendar_id: (data as unknown as { calendarId?: string })
							.calendarId,
					}
				: {}),
			...((data as unknown as { userId?: string }).userId
				? { user_id: (data as unknown as { userId?: string }).userId }
				: {}),
			permission:
				(data as unknown as { permission?: string }).permission ?? "view",
		}

		const { data: row, error } = await supabase
			.from(calendarShares)
			.insert(insertPayload)
			.select()
			.maybeSingle()
		if (error) throw new AppError(error.message, "INTERNAL_ERROR")
		if (!row) throw new AppError("Failed to create share", "INTERNAL_ERROR")
		return mapShareRow(row as DbCalendarShareRow)
	},

	async updatePermission(
		shareId: string,
		permission: "view" | "edit",
	): Promise<CalendarShare> {
		const supabase = getSupabaseAdmin()
		const { data: row, error } = await supabase
			.from(calendarShares)
			.update({ permission })
			.eq("id", shareId)
			.select()
			.maybeSingle()
		if (error) throw new AppError(error.message, "INTERNAL_ERROR")
		if (!row)
			throw new AppError("Failed to update share permission", "INTERNAL_ERROR")
		return mapShareRow(row)
	},

	async delete(shareId: string): Promise<void> {
		const supabase = getSupabaseAdmin()
		const { error } = await supabase
			.from(calendarShares)
			.delete()
			.eq("id", shareId)
		if (error) throw new AppError(error.message, "INTERNAL_ERROR")
	},
}
