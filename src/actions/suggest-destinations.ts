"use server"

import { createClient } from "@/lib/supabase/server"
import { aiService, type DestinationPreferences } from "@/services/ai.service"
import type { ActionResponse } from "@/types"

/**
 * Get AI-powered destination suggestions based on preferences.
 * Returns a list of recommended travel destinations.
 */
export async function suggestDestinationsAction(
	preferences: DestinationPreferences,
): Promise<ActionResponse<{ destinations: string[] }>> {
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
		const destinations = await aiService.suggestDestinations(preferences)
		return {
			data: { destinations },
			error: null,
		}
	} catch (err) {
		console.error("Failed to suggest destinations:", err)
		return {
			data: null,
			error: {
				message:
					err instanceof Error ? err.message : "Failed to suggest destinations",
				code: "AI_SERVICE_ERROR",
			},
		}
	}
}
