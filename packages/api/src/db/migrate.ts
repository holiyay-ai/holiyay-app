/**
 * Database Migrations
 *
 * Runs Drizzle migrations against the database.
 */

import { drizzle } from "drizzle-orm/postgres-js"
import { migrate } from "drizzle-orm/postgres-js/migrator"
import postgres from "postgres"
import { createLogger } from "../lib/logger"

const log = createLogger("migrate")

const runMigrations = async () => {
	if (!process.env.DATABASE_URL) {
		throw new Error("DATABASE_URL environment variable is required")
	}

	const connection = postgres(process.env.DATABASE_URL, { max: 1 })
	const db = drizzle(connection)

	log.info("Running migrations")

	await migrate(db, { migrationsFolder: "./src/db/migrations" })

	log.info("Migrations completed successfully")

	await connection.end()
	process.exit(0)
}

runMigrations().catch((err) => {
	log.error({ err }, "Migration failed")
	process.exit(1)
})
