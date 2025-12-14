/**
 * AI Configuration
 *
 * Provider-agnostic settings for AI/LLM features.
 * Edit these values to adjust AI behavior across the application.
 */

export const aiConfig = {
	provider: "openai" as const,
	model: "gpt-4o-mini",

	defaults: {
		temperature: 0.7,
		maxTokens: 1000,
	},

	checklist: {
		temperature: 0.7,
		maxTokens: 1000,
	},

	activities: {
		temperature: 0.8,
		maxTokens: 2000,
	},

	destinations: {
		temperature: 0.9,
		maxTokens: 500,
	},
}

export type AIProvider = "openai" | "anthropic" | "google" | "local"

export type AIConfig = typeof aiConfig
