/**
 * AI Prompts
 *
 * Centralized system prompts and user prompt templates for AI features.
 * Edit prompts here to adjust AI behavior across the application.
 */

export const systemPrompts = {
	checklist:
		"You are a travel assistant that generates packing checklists. Respond with valid JSON only.",

	activities:
		"You are a travel assistant that recommends activities. Respond with valid JSON only.",

	destinations: "You are a travel expert. Respond with valid JSON only.",
}

export const userPrompts = {
	checklist: (params: {
		destination: string
		startDate: string
		endDate: string
		duration: number
		activitiesContext: string
	}) =>
		`Generate a packing checklist for a trip to ${params.destination} from ${params.startDate} to ${params.endDate} (${params.duration} days). ${params.activitiesContext}

Consider weather/climate, essential travel items, activity-specific items, and trip duration.

Return as JSON array: [{"text": "Item name", "checked": false}]`,

	activities: (params: {
		destination: string
		limit: number
		dateContext: string
		interestsContext: string
	}) =>
		`Recommend ${params.limit} activities in ${params.destination} ${params.dateContext}. ${params.interestsContext}

For each, provide: title, description (2-3 sentences), category (activity/food/transport/lodging/other), estimatedDuration, location.

Return as JSON array.`,

	destinations: (preferencesContext: string) =>
		`Suggest 5 travel destinations based on: ${preferencesContext || "general preferences"}.

Return as JSON array of strings: ["City, Country", ...]`,
}
