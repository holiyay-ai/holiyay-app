"use server"

import { createClient } from "@/lib/supabase/server"
import { aiService, type RecommendActivitiesInput } from "@/services/ai.service"
import type { ActionResponse, RecommendationsResponse } from "@/types"

/**
 * Get AI-powered activity recommendations for a destination.
 * Returns personalized recommendations based on interests and date.
 */
export async function recommendActivitiesAction(
	input: RecommendActivitiesInput,
): Promise<ActionResponse<RecommendationsResponse>> {
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

	// Validate input
	if (!input.destination || input.destination.trim() === "") {
		return {
			data: null,
			error: { message: "Destination is required", code: "VALIDATION_ERROR" },
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
		const recommendations = await aiService.recommendActivities(input)
		return {
			data: recommendations,
			error: null,
		}
	} catch (err) {
		console.error("Failed to get activity recommendations:", err)
		return {
			data: null,
			error: {
				message:
					err instanceof Error
						? err.message
						: "Failed to get activity recommendations",
				code: "AI_SERVICE_ERROR",
			},
		}
	}
}
