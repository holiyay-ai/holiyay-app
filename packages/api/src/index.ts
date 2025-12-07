/**
 * Holiyay API - Server Entry Point
 *
 * Starts the Bun HTTP server with graceful shutdown support.
 * The Hono app is defined in app.ts for testability.
 */

import app, { corsOrigins } from "~/app"
import { constants } from "~/config"
import { closeDb } from "~/db"
import { logger } from "~/lib/logger"

async function gracefulShutdown(signal: string) {
	logger.info({ signal }, "Shutting down gracefully")

	try {
		await closeDb()
		logger.info("Database connection closed")
	} catch (error) {
		logger.error({ error }, "Error closing database")
	}

	process.exit(0)
}

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"))
process.on("SIGINT", () => gracefulShutdown("SIGINT"))

const port = process.env.PORT
	? parseInt(process.env.PORT, 10)
	: constants.server.defaultPort

logger.info({ port, cors: corsOrigins }, "Starting Holiyay API")

const server = Bun.serve({
	port,
	fetch: app.fetch,
})

logger.info({ port: server.port }, "Server running")

export { server }
