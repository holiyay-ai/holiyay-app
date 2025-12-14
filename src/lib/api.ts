/**
 * Holiyay API Client
 *
 * Typed API client for communicating with the Hono backend.
 * Uses hono/client for making requests with full type safety.
 *
 * Usage:
 *   // In Server Components
 *   const calendars = await api.calendars.list(token)
 *
 *   // In Client Components
 *   const { data, error } = await api.auth.login({ email, password })
 */

import { getBaseUrl } from "@/actions/get-base-url"
import type {
	AuthUser,
	CalendarWithItems,
	CalendarWithRole,
	GeneratedChecklist,
	ItemResponse,
	RecommendationsResponse,
	SharedCalendarView,
	ShareInfo,
	ShareLink,
} from "@/api/types"

// Generic API response type
type ApiResponse<T> =
	| { data: T; error: null }
	| { data: null; error: { message: string; code?: string } }

// Helper to create authorization header
function authHeader(token: string): HeadersInit {
	return { Authorization: `Bearer ${token}` }
}

// Generic fetch wrapper with error handling
async function fetchApi<T>(
	url: string,
	options: RequestInit = {},
): Promise<ApiResponse<T>> {
	try {
		const response = await fetch(url, {
			...options,
			headers: {
				"Content-Type": "application/json",
				...options.headers,
			},
			credentials: options.credentials || "include",
		})

		const data = await response.json()

		if (!response.ok) {
			return {
				data: null,
				error: {
					message: data.error || "An error occurred",
					code: data.code,
				},
			}
		}

		return { data: data as T, error: null }
	} catch (err) {
		return {
			data: null,
			error: {
				message: err instanceof Error ? err.message : "Network error",
				code: "NETWORK_ERROR",
			},
		}
	}
}

// ============================================
// Auth API
// ============================================

interface LoginRequest {
	email: string
	password: string
}

interface RegisterRequest {
	email: string
	password: string
	name: string
}

interface AuthResponse {
	user: AuthUser
	accessToken: string
	expiresIn: number
}

export const auth = {
	async login(credentials: LoginRequest): Promise<ApiResponse<AuthResponse>> {
		return fetchApi<AuthResponse>(`${await getBaseUrl()}/auth/login`, {
			method: "POST",
			body: JSON.stringify(credentials),
		})
	},

	async register(data: RegisterRequest): Promise<ApiResponse<AuthResponse>> {
		return fetchApi<AuthResponse>(`${await getBaseUrl()}/auth/register`, {
			method: "POST",
			body: JSON.stringify(data),
		})
	},

	async logout(token: string): Promise<ApiResponse<{ message: string }>> {
		return fetchApi<{ message: string }>(`${await getBaseUrl()}/auth/logout`, {
			method: "POST",
			headers: authHeader(token),
		})
	},

	async me(token: string): Promise<ApiResponse<{ user: AuthUser }>> {
		return fetchApi<{ user: AuthUser }>(`${await getBaseUrl()}/auth/me`, {
			headers: authHeader(token),
		})
	},
}

// ============================================
// Calendars API
// ============================================

interface CreateCalendarRequest {
	name: string
	destination?: string
	startDate: string
	endDate: string
}

interface UpdateCalendarRequest {
	name?: string
	destination?: string
	startDate?: string
	endDate?: string
}

export const calendars = {
	async list(token: string): Promise<ApiResponse<CalendarWithRole[]>> {
		return fetchApi<CalendarWithRole[]>(`${await getBaseUrl()}/calendars`, {
			headers: authHeader(token),
		})
	},

	async get(
		token: string,
		id: string,
	): Promise<ApiResponse<CalendarWithItems>> {
		return fetchApi<CalendarWithItems>(
			`${await getBaseUrl()}/calendars/${id}`,
			{
				headers: authHeader(token),
			},
		)
	},

	async create(
		token: string,
		data: CreateCalendarRequest,
	): Promise<ApiResponse<CalendarWithRole>> {
		return fetchApi<CalendarWithRole>(`${await getBaseUrl()}/calendars`, {
			method: "POST",
			headers: authHeader(token),
			body: JSON.stringify(data),
		})
	},

	async update(
		token: string,
		id: string,
		data: UpdateCalendarRequest,
	): Promise<ApiResponse<CalendarWithRole>> {
		return fetchApi<CalendarWithRole>(`${await getBaseUrl()}/calendars/${id}`, {
			method: "PATCH",
			headers: authHeader(token),
			body: JSON.stringify(data),
		})
	},

	async delete(
		token: string,
		id: string,
	): Promise<ApiResponse<{ success: boolean }>> {
		return fetchApi<{ success: boolean }>(
			`${await getBaseUrl()}/calendars/${id}`,
			{
				method: "DELETE",
				headers: authHeader(token),
			},
		)
	},
}

// ============================================
// Items API
// ============================================

interface CreateItemRequest {
	date: string
	title: string
	description?: string
	startTime?: string
	endTime?: string
	location?: string
	category?: "activity" | "transport" | "food" | "lodging" | "other"
	affiliateLink?: string
	orderIndex?: number
}

interface UpdateItemRequest {
	date?: string
	title?: string
	description?: string | null
	startTime?: string | null
	endTime?: string | null
	location?: string | null
	category?: "activity" | "transport" | "food" | "lodging" | "other"
	affiliateLink?: string | null
	orderIndex?: number
}

interface ReorderItemsRequest {
	items: Array<{ id: string; orderIndex: number }>
}

export const items = {
	async create(
		token: string,
		calendarId: string,
		data: CreateItemRequest,
	): Promise<ApiResponse<ItemResponse>> {
		return fetchApi<ItemResponse>(
			`${await getBaseUrl()}/calendars/${calendarId}/items`,
			{
				method: "POST",
				headers: authHeader(token),
				body: JSON.stringify(data),
			},
		)
	},

	async update(
		token: string,
		calendarId: string,
		itemId: string,
		data: UpdateItemRequest,
	): Promise<ApiResponse<ItemResponse>> {
		return fetchApi<ItemResponse>(
			`${await getBaseUrl()}/calendars/${calendarId}/items/${itemId}`,
			{
				method: "PATCH",
				headers: authHeader(token),
				body: JSON.stringify(data),
			},
		)
	},

	async delete(
		token: string,
		calendarId: string,
		itemId: string,
	): Promise<ApiResponse<{ success: boolean }>> {
		return fetchApi<{ success: boolean }>(
			`${await getBaseUrl()}/calendars/${calendarId}/items/${itemId}`,
			{
				method: "DELETE",
				headers: authHeader(token),
			},
		)
	},

	async reorder(
		token: string,
		calendarId: string,
		data: ReorderItemsRequest,
	): Promise<ApiResponse<{ success: boolean }>> {
		return fetchApi<{ success: boolean }>(
			`${await getBaseUrl()}/calendars/${calendarId}/items/reorder`,
			{
				method: "PATCH",
				headers: authHeader(token),
				body: JSON.stringify(data),
			},
		)
	},
}

// ============================================
// Shares API
// ============================================

interface ShareCalendarRequest {
	email: string
	permission: "view" | "edit"
}

export const shares = {
	async list(
		token: string,
		calendarId: string,
	): Promise<ApiResponse<ShareInfo[]>> {
		return fetchApi<ShareInfo[]>(
			`${await getBaseUrl()}/calendars/${calendarId}/shares`,
			{
				headers: authHeader(token),
			},
		)
	},

	async create(
		token: string,
		calendarId: string,
		data: ShareCalendarRequest,
	): Promise<ApiResponse<ShareInfo>> {
		return fetchApi<ShareInfo>(
			`${await getBaseUrl()}/calendars/${calendarId}/shares`,
			{
				method: "POST",
				headers: authHeader(token),
				body: JSON.stringify(data),
			},
		)
	},

	async remove(
		token: string,
		calendarId: string,
		shareId: string,
	): Promise<ApiResponse<{ success: boolean }>> {
		return fetchApi<{ success: boolean }>(
			`${await getBaseUrl()}/calendars/${calendarId}/shares/${shareId}`,
			{
				method: "DELETE",
				headers: authHeader(token),
			},
		)
	},

	async generateLink(
		token: string,
		calendarId: string,
	): Promise<ApiResponse<ShareLink>> {
		return fetchApi<ShareLink>(
			`${await getBaseUrl()}/calendars/${calendarId}/share-link`,
			{
				method: "POST",
				headers: authHeader(token),
			},
		)
	},

	async getByToken(
		shareToken: string,
	): Promise<ApiResponse<SharedCalendarView>> {
		return fetchApi<SharedCalendarView>(
			`${await getBaseUrl()}/shared/${shareToken}`,
		)
	},

	async joinByToken(
		token: string,
		shareToken: string,
	): Promise<ApiResponse<{ calendarId: string }>> {
		return fetchApi<{ calendarId: string }>(
			`${await getBaseUrl()}/shared/${shareToken}/join`,
			{
				method: "POST",
				headers: authHeader(token),
			},
		)
	},
}

// ============================================
// AI API
// ============================================

interface GenerateChecklistRequest {
	destination: string
	startDate: string
	endDate: string
}

interface GetRecommendationsRequest {
	destination: string
	date?: string
	preferences?: string[]
}

export const ai = {
	async generateChecklist(
		token: string,
		calendarId: string,
		data?: GenerateChecklistRequest,
	): Promise<ApiResponse<GeneratedChecklist>> {
		const url = new URL(
			`${await getBaseUrl()}/ai/calendars/${calendarId}/checklist`,
		)
		if (data) {
			if (data.destination)
				url.searchParams.set("destination", data.destination)
			if (data.startDate) url.searchParams.set("startDate", data.startDate)
			if (data.endDate) url.searchParams.set("endDate", data.endDate)
		}

		return fetchApi<GeneratedChecklist>(url.toString(), {
			headers: authHeader(token),
		})
	},

	async getRecommendations(
		token: string,
		calendarId: string,
		data: GetRecommendationsRequest,
	): Promise<ApiResponse<RecommendationsResponse>> {
		const url = new URL(
			`${await getBaseUrl()}/ai/calendars/${calendarId}/recommendations`,
		)
		url.searchParams.set("destination", data.destination)
		if (data.date) url.searchParams.set("date", data.date)
		if (data.preferences) {
			for (const pref of data.preferences) {
				url.searchParams.append("preferences", pref)
			}
		}

		return fetchApi<RecommendationsResponse>(url.toString(), {
			headers: authHeader(token),
		})
	},
}

// ============================================
// Unified API client
// ============================================

export const api = {
	auth,
	calendars,
	items,
	shares,
	ai,
}

export default api

// Re-export types for convenience
export type {
	AuthResult,
	AuthUser,
	CalendarWithItems,
	CalendarWithRole,
	GeneratedChecklist,
	ItemResponse,
	RecommendationsResponse,
	SharedCalendarView,
	ShareInfo,
	ShareLink,
} from "@/api/types"
