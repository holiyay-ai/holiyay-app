/**
 * Database schema (Supabase/Postgres)
 *
 * Plain TypeScript types and table name constants used by repository layer.
 * This file no longer depends on Drizzle. Keep shapes in camelCase and map
 * snake_case DB rows to these types in repositories.
 */

// Table name constants (used with Supabase `.from(...)`)
export const calendars = "calendars"
export const calendarShares = "calendar_shares"
export const items = "items"
export const checklists = "checklists"

// Database row types (imported from Supabase-generated types)
// These reflect the snake_case column names and raw DB types (strings for timestamps, etc.)
import type {
	Tables,
	TablesInsert,
	TablesUpdate,
} from "@/api/external/generated.supabase.types"

export type DbCalendarRow = Tables<"calendars">
export type DbCalendarInsert = TablesInsert<"calendars">
export type DbCalendarUpdate = TablesUpdate<"calendars">

export type DbCalendarShareRow = Tables<"calendar_shares">
export type DbCalendarShareInsert = TablesInsert<"calendar_shares">
export type DbCalendarShareUpdate = TablesUpdate<"calendar_shares">

export type DbItemRow = Tables<"items">
export type DbItemInsert = TablesInsert<"items">
export type DbItemUpdate = TablesUpdate<"items">

export type DbChecklistRow = Tables<"checklists">
export type DbChecklistInsert = TablesInsert<"checklists">
export type DbChecklistUpdate = TablesUpdate<"checklists">

// Enum types
export type Permission = "view" | "edit"
export type Category = "activity" | "transport" | "food" | "lodging" | "other"

// User (backed by Supabase Auth)
export type User = {
	id: string
	email: string
	name: string
	avatarUrl?: string | null
	createdAt?: Date
}

export type NewUser = Omit<User, "id" | "createdAt"> &
	Partial<Pick<User, "avatarUrl">>

// Calendar
export type Calendar = {
	id: string
	ownerId: string
	name: string
	destination: string | null
	startDate: string // YYYY-MM-DD
	endDate: string // YYYY-MM-DD
	shareToken: string
	createdAt: Date
	updatedAt: Date
}

export type NewCalendar = Omit<
	Calendar,
	"id" | "createdAt" | "updatedAt" | "shareToken"
>

// CalendarShare
export type CalendarShare = {
	id: string
	calendarId: string
	userId: string
	permission: Permission
	invitedAt: Date
}

export type NewCalendarShare = Omit<CalendarShare, "id" | "invitedAt"> & {
	permission?: Permission
}

// Item
export type Item = {
	id: string
	calendarId: string
	startDate: string // YYYY-MM-DD
	endDate: string | null // YYYY-MM-DD
	title: string
	description: string | null
	startTime: string | null // HH:MM:SS
	endTime: string | null // HH:MM:SS
	location: string | null
	category: Category
	checklistId: string | null
	orderIndex: number
	createdAt: Date
	updatedAt: Date
}

export type NewItem = Omit<Item, "id" | "createdAt" | "updatedAt"> &
	Partial<
		Pick<
			Item,
			| "description"
			| "startTime"
			| "endTime"
			| "location"
			| "checklistId"
			| "endDate"
		>
	>

// Checklist
export type ChecklistItem = {
	text: string
	checked: boolean
	affiliateLink?: string | null
}

export type Checklist = {
	id: string
	calendarId: string
	title: string
	items: ChecklistItem[]
	aiGenerated: boolean
	createdAt: Date
	updatedAt: Date
}

export type NewChecklist = Omit<Checklist, "id" | "createdAt" | "updatedAt"> &
	Partial<Pick<Checklist, "aiGenerated">>
