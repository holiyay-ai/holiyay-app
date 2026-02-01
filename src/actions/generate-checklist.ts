"use server"

import { createClient } from "@/lib/supabase/server"
import { aiService, type GenerateChecklistInput } from "@/services/ai.service"
import type { ActionResponse, GeneratedChecklist } from "@/types"

/**
 * Generate an AI-powered packing checklist for a trip.
 * Optionally saves the checklist to a calendar if calendarId is provided.
 */
export async function generateChecklistAction(
	input: GenerateChecklistInput,
): Promise<ActionResponse<GeneratedChecklist>> {
	const supabase = await createClient()

	// Get current user
	const {
		data: { user },
		error: authError,
	} = await supabase.auth.getUser()

	if (authError || !user) {
		return {
			data: null,
			error: { message: "Not authenticated", code: "UNAUTHORIZED" },
		}
	}

	// If calendarId provided, verify user has edit access
	if (input.calendarId) {
		// Check if user owns the calendar
		const { data: ownedCalendar } = await supabase
			.from("calendars")
			.select("id")
			.eq("id", input.calendarId)
			.eq("owner_id", user.id)
			.maybeSingle()

		let hasEditPermission = !!ownedCalendar

		// If not owned, check if shared with edit permission
		if (!hasEditPermission) {
			const { data: shareData } = await supabase
				.from("calendar_shares")
				.select("permission")
				.eq("calendar_id", input.calendarId)
				.eq("user_id", user.id)
				.maybeSingle()

			if (shareData?.permission === "edit") {
				hasEditPermission = true
			}
		}

		if (!hasEditPermission) {
			return {
				data: null,
				error: {
					message:
						"You don't have permission to add checklists to this calendar",
					code: "FORBIDDEN",
				},
			}
		}
	}

	// Check if AI is available
	if (!aiService.isAvailable()) {
		return {
			data: null,
			error: {
				message:
					"AI features are not configured. Set OPENAI_API_KEY to enable.",
				code: "AI_NOT_CONFIGURED",
			},
		}
	}

	try {
		const checklist = await aiService.generateChecklist(input)
		return {
			data: checklist,
			error: null,
		}
	} catch (err) {
		console.error("Failed to generate checklist:", err)
		return {
			data: null,
			error: {
				message:
					err instanceof Error ? err.message : "Failed to generate checklist",
				code: "AI_SERVICE_ERROR",
			},
		}
	}
}
