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
	WeatherRange,
} from "@/api/types"

// Generic API response type
type ApiResponse<T> =
	| { data: T; error: null; headers: Record<string, string> }
	| {
			data: null
			error: { message: string; code?: string; cause?: unknown }
			headers?: Record<string, string>
	  }

// Helper to create authorization header
function authHeader(token: string): HeadersInit {
	return { Authorization: `Bearer ${token}` }
}

function getHeaders(response: Response): Record<string, string> {
	return Object.fromEntries(response.headers.entries())
}

async function responseJsonSafe<T>(
	response: Response,
): Promise<ApiResponse<T>> {
	try {
		const data = await response.json()
		return data
	} catch (err) {
		return {
			data: null,
			error: {
				message: "Invalid JSON response",
				code: "INVALID_JSON",
				cause: err,
			},
			headers: getHeaders(response),
		}
	}
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
				"x-vercel-protection-bypass":
					process.env.VERCEL_PROTECTION_BYPASS_KEY ||
					process.env.NEXT_VERCEL_PROTECTION_BYPASS_KEY ||
					process.env.NEXT_STAGING_BYPASS_KEY ||
					"",
				...options.headers,
			},
			credentials: options.credentials || "include",
		})

		const data = await responseJsonSafe<T>(response)

		if (!response.ok || data.error) {
			return {
				data: null,
				error: data.error || {
					message: `API request failed with status ${response.status}`,
					code: "API_ERROR",
				},
				headers: getHeaders(response),
			}
		}

		return { data: data as T, error: null, headers: getHeaders(response) }
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
	code?: string
	message?: string
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

	async logout(): Promise<ApiResponse<{ message: string }>> {
		return fetchApi<{ message: string }>(`${await getBaseUrl()}/auth/logout`, {
			method: "POST",
		})
	},

	async me(): Promise<ApiResponse<{ user: AuthUser }>> {
		return fetchApi<{ user: AuthUser }>(`${await getBaseUrl()}/auth/me`)
	},

	async userById(
		id: string,
		token?: string,
	): Promise<ApiResponse<{ user: Partial<AuthUser> }>> {
		return fetchApi<{ user: AuthUser }>(
			`${await getBaseUrl()}/auth/users/${id}`,
			{
				headers: token ? authHeader(token) : {},
			},
		)
	},

	async oauthCallback(
		accessToken: string,
		refreshToken?: string,
		expiresIn?: number,
	): Promise<ApiResponse<AuthResponse>> {
		return fetchApi<AuthResponse>(`${await getBaseUrl()}/auth/oauth/callback`, {
			method: "POST",
			body: JSON.stringify({ accessToken, refreshToken, expiresIn }),
		})
	},
}

// ============================================
// Calendars API
// ============================================

export interface CreateCalendarRequest {
	name: string
	destination?: string | undefined
	startDate: string
	endDate: string
}

export interface UpdateCalendarRequest {
	name?: string | undefined
	destination?: string | undefined
	startDate?: string | undefined
	endDate?: string | undefined
}

export const calendars = {
	async list(token?: string): Promise<ApiResponse<CalendarWithRole[]>> {
		return fetchApi<CalendarWithRole[]>(`${await getBaseUrl()}/calendars`, {
			headers: token ? authHeader(token) : {},
		})
	},

	async get(
		token: string | undefined,
		id: string,
	): Promise<ApiResponse<CalendarWithItems>> {
		return fetchApi<CalendarWithItems>(
			`${await getBaseUrl()}/calendars/${id}`,
			{
				headers: token ? authHeader(token) : {},
			},
		)
	},

	async create(
		token: string | undefined,
		data: CreateCalendarRequest,
	): Promise<ApiResponse<CalendarWithRole>> {
		return fetchApi<CalendarWithRole>(`${await getBaseUrl()}/calendars`, {
			method: "POST",
			headers: token ? authHeader(token) : {},
			body: JSON.stringify(data),
		})
	},

	async update(
		token: string | undefined,
		id: string,
		data: UpdateCalendarRequest,
	): Promise<ApiResponse<CalendarWithRole>> {
		return fetchApi<CalendarWithRole>(`${await getBaseUrl()}/calendars/${id}`, {
			method: "PATCH",
			headers: token ? authHeader(token) : {},
			body: JSON.stringify(data),
		})
	},

	async delete(
		token: string | undefined,
		id: string,
	): Promise<ApiResponse<{ success: boolean }>> {
		return fetchApi<{ success: boolean }>(
			`${await getBaseUrl()}/calendars/${id}`,
			{
				method: "DELETE",
				headers: token ? authHeader(token) : {},
			},
		)
	},
}

// ============================================
// Items API
// ============================================

export interface CreateItemRequest {
	startDate: string
	endDate?: string | undefined
	title: string
	description?: string | undefined
	startTime?: string | undefined
	endTime?: string | undefined
	location?: string | undefined
	category?: "activity" | "transport" | "food" | "lodging" | "other" | undefined
	checklistId?: string | null | undefined
	orderIndex?: number | undefined
}

export interface UpdateItemRequest {
	startDate?: string
	endDate?: string | undefined
	title?: string
	description?: string | null
	startTime?: string | null
	endTime?: string | null
	location?: string | null
	category?: "activity" | "transport" | "food" | "lodging" | "other"
	checklistId?: string | null
	orderIndex?: number
}

export interface ReorderItemsRequest {
	items: Array<{ id: string; orderIndex: number }>
}

export const items = {
	async create(
		token: string | undefined,
		calendarId: string,
		data: CreateItemRequest,
	): Promise<ApiResponse<ItemResponse>> {
		return fetchApi<ItemResponse>(
			`${await getBaseUrl()}/calendars/${calendarId}/items`,
			{
				method: "POST",
				headers: token ? authHeader(token) : {},
				body: JSON.stringify(data),
			},
		)
	},

	async update(
		token: string | undefined,
		calendarId: string,
		itemId: string,
		data: UpdateItemRequest,
	): Promise<ApiResponse<ItemResponse>> {
		return fetchApi<ItemResponse>(
			`${await getBaseUrl()}/calendars/${calendarId}/items/${itemId}`,
			{
				method: "PATCH",
				headers: token ? authHeader(token) : {},
				body: JSON.stringify(data),
			},
		)
	},

	async delete(
		token: string | undefined,
		calendarId: string,
		itemId: string,
	): Promise<ApiResponse<{ success: boolean }>> {
		return fetchApi<{ success: boolean }>(
			`${await getBaseUrl()}/calendars/${calendarId}/items/${itemId}`,
			{
				method: "DELETE",
				headers: token ? authHeader(token) : {},
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

export interface ShareCalendarRequest {
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

export interface GenerateChecklistRequest {
	destination: string
	startDate: string
	endDate: string
}

export interface GetRecommendationsRequest {
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
// Weather API
// ============================================

export const weather = {
	/**
	 * Get weather for a location / date range.
	 * - `token` is optional (passed when caller has an auth token).
	 * - `params` contains ISO dates (YYYY-MM-DD) for start/end and optional units.
	 */
	async get(
		token: string | undefined,
		params: {
			location: string
			startDate?: string
			endDate?: string
			units?: "metric" | "imperial"
		},
	): Promise<ApiResponse<WeatherRange>> {
		const qs = new URLSearchParams()
		qs.set("location", params.location)
		if (params.startDate) qs.set("startDate", params.startDate)
		if (params.endDate) qs.set("endDate", params.endDate)
		if (params.units) qs.set("units", params.units)

		return fetchApi<WeatherRange>(
			`${await getBaseUrl()}/weather?${qs.toString()}`,
			{
				headers: token ? authHeader(token) : {},
			},
		)
	},

	/** Simple status check (useful for feature gating in the UI) */
	async status(): Promise<
		ApiResponse<{ available: boolean; message: string }>
	> {
		return fetchApi<{ available: boolean; message: string }>(
			`${await getBaseUrl()}/weather/status`,
		)
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
	weather,
}

export default api

// re-export shared types (including weather types)
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
	WeatherData,
	WeatherRange,
} from "@/api/types"
