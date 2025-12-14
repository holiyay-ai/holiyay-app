/**
 * Database Connection
 *
 * Provides lazy-initialized database connection compatible with both
 * long-running servers and serverless environments (Vercel, AWS Lambda).
 *
 * Features:
 * - Lazy initialization (safe to import without DATABASE_URL)
 * - Environment-aware connection pooling
 * - Health check with timeout
 * - Graceful shutdown support
 */

import { sql } from "drizzle-orm"
import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js"
import postgres, { type Sql } from "postgres"
import { constants } from "@/api/config"
import * as schema from "./schema"

export type Database = PostgresJsDatabase<typeof schema>

let client: Sql | null = null
let database: Database | null = null

function getConnectionConfig() {
	const isProduction = process.env.NODE_ENV === "production"
	const isServerless =
		process.env.VERCEL === "1" ||
		process.env.AWS_LAMBDA_FUNCTION_NAME ||
		process.env.SERVERLESS === "1"

	const { poolSize, idleTimeout, connectTimeout } = constants.database

	return {
		max: isServerless
			? poolSize.serverless
			: isProduction
				? poolSize.production
				: poolSize.development,
		idle_timeout: isServerless ? idleTimeout.serverless : idleTimeout.default,
		connect_timeout: connectTimeout,
		prepare: !isServerless,
	}
}

function getConnectionString(): string {
	const connectionString = process.env.DATABASE_URL

	if (!connectionString) {
		throw new Error(
			"DATABASE_URL environment variable is not set. " +
				"Please configure your database connection.",
		)
	}

	return connectionString
}

export function getDb(): Database {
	if (database) {
		return database
	}

	const connectionString = getConnectionString()
	const config = getConnectionConfig()

	client = postgres(connectionString, config)
	database = drizzle(client, { schema })

	return database
}

export async function closeDb(): Promise<void> {
	if (client) {
		await client.end()
		client = null
		database = null
	}
}

export async function checkDbHealth(): Promise<{
	connected: boolean
	latencyMs?: number
	error?: string
}> {
	if (!process.env.DATABASE_URL) {
		return {
			connected: false,
			error: "DATABASE_URL not configured",
		}
	}

	try {
		const start = Date.now()
		const db = getDb()

		const timeoutPromise = new Promise<never>((_, reject) => {
			setTimeout(
				() => reject(new Error("Connection timeout")),
				constants.database.healthCheckTimeout,
			)
		})

		await Promise.race([db.execute(sql`SELECT 1`), timeoutPromise])

		return {
			connected: true,
			latencyMs: Date.now() - start,
		}
	} catch (error) {
		return {
			connected: false,
			error: error instanceof Error ? error.message : "Unknown error",
		}
	}
}

export const db = new Proxy({} as Database, {
	get(_target, prop) {
		const instance = getDb()
		const value = instance[prop as keyof Database]
		if (typeof value === "function") {
			return value.bind(instance)
		}
		return value
	},
})
