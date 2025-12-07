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
	DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
	JWT_SECRET: z.string().min(1, "JWT_SECRET is required"),
	OPENAI_API_KEY: z.string().optional(),
	WEATHER_API_KEY: z.string().optional(),
	PORT: z.coerce.number().default(3000),
	NODE_ENV: z
		.enum(["development", "production", "test"])
		.default("development"),
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
	return env.NODE_ENV === "production"
}

export function isDevelopment(env: Env): boolean {
	return env.NODE_ENV === "development"
}

export function isTest(env: Env): boolean {
	return env.NODE_ENV === "test"
}

function validateEnv(): Env {
	const result = envSchema.safeParse(process.env)

	if (!result.success) {
		log.error(
			{ errors: result.error.format() },
			"Invalid environment variables",
		)
		process.exit(1)
	}

	return result.data
}

export const env = validateEnv()
