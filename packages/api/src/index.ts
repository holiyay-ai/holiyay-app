/**
	* Holiyay API - Server Entry Point
	*
	* Starts a Node HTTP server with graceful shutdown support.
	* The Hono app is defined in app.ts for testability.
	*/

import { serve } from "@hono/node-server"
import app, { corsOrigins } from "~/app"
import { constants } from "~/config"
import { closeDb } from "~/db"
import { logger } from "~/lib/logger"

let server: import("node:http").Server | null = null

async function gracefulShutdown(signal: string) {
	logger.info({ signal }, "Shutting down gracefully")

	try {
		await closeDb()
		logger.info("Database connection closed")
	} catch (error) {
		logger.error({ error }, "Error closing database")
	}

	try {
		const s = server
		if (s) {
			await new Promise<void>((resolve, reject) =>
				s.close((err?: Error | null) => (err ? reject(err) : resolve())),
			)
			logger.info("HTTP server closed")
		}
	} catch (err) {
		logger.error({ err }, "Error closing server")
	}

	process.exit(0)
}

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"))
process.on("SIGINT", () => gracefulShutdown("SIGINT"))

const port = process.env.PORT
	? parseInt(process.env.PORT, 10)
	: constants.server.defaultPort

logger.info({ port, cors: corsOrigins }, "Starting Holiyay API")

// Use Hono's official Node server adapter which wraps the app.fetch handler
server = (serve({ fetch: app.fetch, port }) as unknown) as import("node:http").Server

logger.info({ port }, "Server running")

export { server }
