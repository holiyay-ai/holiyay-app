/**
 * Application Constants
 *
 * Centralized constants for the entire application.
 * Edit values here to adjust behavior across the codebase.
 */

export const constants = {
	app: {
		name: "Holiyay API",
		version: "1.0.0",
	},

	server: {
		defaultPort: 3000,
		corsMaxAge: 86400,
	},

	database: {
		poolSize: {
			serverless: 1,
			production: 20,
			development: 10,
		},
		idleTimeout: {
			serverless: 20,
			default: 60,
		},
		connectTimeout: 10,
		healthCheckTimeout: 1000,
	},

	cache: {
		defaultTtlSeconds: 60 * 60,
		defaultMaxEntries: 1000,
		checklist: {
			ttlSeconds: 60 * 60 * 24,
			maxEntries: 500,
		},
		recommendations: {
			ttlSeconds: 60 * 60 * 4,
			maxEntries: 500,
		},
		destinations: {
			ttlSeconds: 60 * 60 * 12,
			maxEntries: 200,
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

	weather: {
		retry: {
			maxRetries: 3,
			initialDelayMs: 500,
			maxDelayMs: 4000,
			backoffMultiplier: 2,
		},
		climatology: {
			ttlSeconds: 60 * 60 * 24 * 30,
		},
	},

	auth: {
		tokenPrefix: "Bearer",
		passwordMinLength: 8,
	},
} as const

export type Constants = typeof constants
