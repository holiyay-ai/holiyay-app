/**
 * Service Configuration
 *
 * Centralized constants for services (weather, cache, etc.)
 */

export const config = {
	cache: {
		defaultTtlSeconds: 60 * 60, // 1 hour
		defaultMaxEntries: 1000,
		checklist: {
			ttlSeconds: 60 * 60 * 24, // 24 hours
			maxEntries: 500,
		},
		recommendations: {
			ttlSeconds: 60 * 60 * 4, // 4 hours
			maxEntries: 500,
		},
		destinations: {
			ttlSeconds: 60 * 60 * 12, // 12 hours
			maxEntries: 200,
		},
	},

	weather: {
		retry: {
			maxRetries: 3,
			initialDelayMs: 500,
			maxDelayMs: 4000,
			backoffMultiplier: 2,
		},
		climatology: {
			ttlSeconds: 60 * 60 * 24 * 30, // 30 days
		},
	},

	llm: {
		retry: {
			maxRetries: 3,
			initialDelayMs: 1000,
			maxDelayMs: 10000,
			backoffMultiplier: 2,
		},
	},
} as const

export type Config = typeof config
