/**
 * Shared Type Definitions
 *
 * Central location for all shared TypeScript types used across the application.
 * Re-exports database schema types and error handling utilities.
 */

export type {
	Calendar,
	CalendarShare,
	Checklist,
	Item,
	NewCalendar,
	NewCalendarShare,
	NewChecklist,
	NewItem,
	NewUser,
	User,
} from "../db/schema"

export interface AuthUser {
	id: string
	email: string
	name: string
	avatarUrl?: string | null
}

export interface AuthTokens {
	accessToken: string
	refreshToken?: string
	expiresIn: number
}

export interface AuthResult {
	user: AuthUser
	tokens: AuthTokens
}

export interface CalendarWithRole {
	id: string
	ownerId: string
	name: string
	destination: string | null
	startDate: string
	endDate: string
	shareToken: string | null
	createdAt: Date
	updatedAt: Date
	role: "owner" | "shared"
	permission: "view" | "edit"
}

export interface CalendarWithItems {
	id: string
	ownerId: string
	name: string
	destination: string | null
	startDate: string
	endDate: string
	shareToken: string | null
	createdAt: Date
	updatedAt: Date
	permission: "view" | "edit"
	items: ItemResponse[]
}

export interface ItemResponse {
	id: string
	calendarId: string
	date: string
	title: string
	description: string | null
	startTime: string | null
	endTime: string | null
	location: string | null
	category: "activity" | "transport" | "food" | "lodging" | "other"
	affiliateLink: string | null
	orderIndex: number
	createdAt: Date
	updatedAt: Date
}

export interface ShareInfo {
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

export interface ShareLink {
	shareToken: string
	shareUrl: string
}

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

export interface ChecklistItem {
	text: string
	checked: boolean
}

export interface GeneratedChecklist {
	id?: string | undefined
	calendarId?: string | undefined
	title: string
	items: ChecklistItem[]
	aiGenerated: boolean
	cached?: boolean | undefined
}

export interface ActivityRecommendation {
	title: string
	description: string
	category: "activity" | "transport" | "food" | "lodging" | "other"
	estimatedDuration: string
	location: string
	affiliateLink?: string
}

export interface RecommendationsResponse {
	destination: string
	recommendations: ActivityRecommendation[]
	cached?: boolean
}

export type { ErrorCode } from "../lib/errors"
export {
	AppError,
	ConflictError,
	ForbiddenError,
	handleError,
	isAppError,
	NotFoundError,
	ServiceUnavailableError,
	UnauthorizedError,
	ValidationError,
} from "../lib/errors"
