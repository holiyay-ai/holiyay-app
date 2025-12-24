/**
 * Environment Configuration
 *
 * Validates and exports environment variables using Zod.
 * Provides helper functions for environment detection (production, serverless, etc.)
 */

import { z } from "zod"
import { createLogger } from "./logger"

const log = createLogger("env")

const envSchema = z.object({
	OPENAI_API_KEY: z.string().optional(),
	WEATHER_API_KEY: z.string().optional(),
	PORT: z.coerce.number().default(3000),
	APP_ENV: z.enum(["staging", "production"]).default("staging"),
	CORS_ORIGINS: z.string().optional(),
	SERVERLESS: z.string().optional(),
	VERCEL: z.string().optional(),
	AWS_LAMBDA_FUNCTION_NAME: z.string().optional(),
	LOG_LEVEL: z.string().optional(),
})

export type Env = z.infer<typeof envSchema>

export function isServerless(env: Env): boolean {
	return (
		env.SERVERLESS === "1" ||
		env.VERCEL === "1" ||
		!!env.AWS_LAMBDA_FUNCTION_NAME
	)
}

export function isProduction(env: Env): boolean {
	return env.APP_ENV === "production"
}

export function isStaging(env: Env): boolean {
	return env.APP_ENV === "staging"
}

function validateEnv(): Env {
	const result = envSchema.safeParse(process.env)

	if (!result.success) {
		log.error(
			{ errors: z.treeifyError(result.error) },
			"Invalid environment variables",
		)
		process.exit(1)
	}

	return result.data
}

export const env = validateEnv()
