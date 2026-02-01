/**
 * Shared Type Definitions
 *
 * Central location for all shared TypeScript types used across the application.
 * These types are used by Server Actions, components, and utilities.
 * All types use camelCase for consistency with the frontend.
 */

/**
 * Auth user type (simplified from Supabase User)
 */
export interface AuthUser {
	id: string
	email: string
	name: string
	avatarUrl?: string | null
}

/**
 * Calendar with role information (for list views)
 */
export interface CalendarWithRole {
	id: string
	ownerId: string
	name: string
	destination: string | null
	startDate: string
	endDate: string
	shareToken: string | null
	createdAt: string
	updatedAt: string
	role: "owner" | "shared"
	permission: "view" | "edit"
}

/**
 * Calendar with items (for detail views)
 */
export interface CalendarWithItems {
	id: string
	ownerId: string
	name: string
	destination: string | null
	startDate: string
	endDate: string
	shareToken: string | null
	createdAt: string
	updatedAt: string
	permission: "view" | "edit"
	items: ItemResponse[]
}

/**
 * Item response type
 */
export interface ItemResponse {
	id: string
	calendarId: string
	startDate: string
	endDate: string | null
	title: string
	description: string | null
	startTime: string | null
	endTime: string | null
	location: string | null
	category: "activity" | "transport" | "food" | "lodging" | "other"
	checklistId: string | null
	orderIndex: number
	createdAt: string
	updatedAt: string
}

/**
 * Share information with user details
 */
export interface ShareInfo {
	id: string
	permission: "view" | "edit"
	invitedAt: string
	user: {
		id: string
		email: string
		name: string
		avatarUrl: string | null
	}
}

/**
 * Share link response
 */
export interface ShareLink {
	shareToken: string
	shareUrl: string
}

/**
 * Shared calendar view (for public share links)
 */
export interface SharedCalendarView {
	calendar: {
		id: string
		name: string
		destination: string | null
		startDate: string
		endDate: string
	}
	items: ItemResponse[]
	canEdit: boolean
}

/**
 * Checklist item structure
 */
export interface ChecklistItem {
	text: string
	checked: boolean
	affiliateLink?: string | null
}

/**
 * Generated checklist (from AI)
 */
export interface GeneratedChecklist {
	id?: string
	calendarId?: string
	title: string
	items: ChecklistItem[]
	aiGenerated: boolean
	cached?: boolean
}

/**
 * Activity recommendation (from AI)
 */
export interface ActivityRecommendation {
	title: string
	description: string
	category: "activity" | "transport" | "food" | "lodging" | "other"
	estimatedDuration: string
	location: string
	affiliateLink?: string
}

/**
 * Recommendations response (from AI)
 */
export interface RecommendationsResponse {
	destination: string
	recommendations: ActivityRecommendation[]
	cached?: boolean
}

/**
 * Weather data for a single day
 */
export interface WeatherData {
	temperature: number
	description: string
	humidity: number
	windSpeed: number
	approximate?: boolean
}

/**
 * Weather range for multiple days
 */
export interface WeatherRange {
	locationName?: string
	lat: number
	lon: number
	timezoneOffsetSeconds?: number
	units: "metric" | "imperial"
	byDate: Record<string, WeatherData | null>
	source?: string
}

/**
 * Generic API response wrapper
 */
export type ActionResponse<T> =
	| { data: T; error: null }
	| { data: null; error: { message: string; code?: string } }

/**
 * Create calendar request
 */
export interface CreateCalendarRequest {
	name: string
	destination?: string
	startDate: string
	endDate: string
}

/**
 * Update calendar request
 */
export interface UpdateCalendarRequest {
	name?: string
	destination?: string | null
	startDate?: string
	endDate?: string
}

/**
 * Create item request
 */
export interface CreateItemRequest {
	startDate: string
	endDate?: string
	title: string
	description?: string
	startTime?: string
	endTime?: string
	location?: string
	category?: "activity" | "transport" | "food" | "lodging" | "other"
	checklistId?: string | null
	orderIndex?: number
}

/**
 * Update item request
 */
export interface UpdateItemRequest {
	startDate?: string
	endDate?: string | null
	title?: string
	description?: string | null
	startTime?: string | null
	endTime?: string | null
	location?: string | null
	category?: "activity" | "transport" | "food" | "lodging" | "other"
	checklistId?: string | null
	orderIndex?: number
}

/**
 * Share calendar request
 */
export interface ShareCalendarRequest {
	email: string
	permission: "view" | "edit"
}

/**
 * Permission type
 */
export type Permission = "view" | "edit"

/**
 * Category type
 */
export type Category = "activity" | "transport" | "food" | "lodging" | "other"
