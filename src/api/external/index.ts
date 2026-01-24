/**
 * External Providers
 *
 * Barrel exports for third-party API clients and integrations.
 * Keeps external dependencies isolated from internal business logic.
 */

export type { CacheEntry, CacheOptions } from "./cache"
export {
	checklistCache,
	createCacheKey,
	destinationCache,
	genericCache,
	MemoryCache,
	recommendationCache,
} from "./cache"
export type {
	ChatMessage,
	CompletionOptions,
	CompletionResult,
	LLMClient,
} from "./llm.client"
export { llmClient, parseJsonResponse } from "./llm.client"
export type {
	WeatherClient,
	WeatherData,
	WeatherOptions,
} from "./weather.client"
export { weatherClient } from "./weather.client"
