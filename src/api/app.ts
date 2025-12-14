/**
 * Holiyay App
 *
 * Hono application definition. Configures middleware, mounts routes,
 * and handles errors. Exported for testing and server entry points.
 */

import { Hono } from "hono"
import { cors } from "hono/cors"
import { HTTPException } from "hono/http-exception"
import { constants } from "@/api/config"
import { isAppError } from "@/api/lib/errors"
import { logger } from "@/api/lib/logger"
import { requestLogger } from "@/api/middleware/request-logger"
import { aiRoutes } from "@/api/routes/ai"
import { authRoutes } from "@/api/routes/auth"
import { calendarRoutes } from "@/api/routes/calendars"
import { itemRoutes } from "@/api/routes/items"
import { shareRoutes } from "@/api/routes/shares"
import { checkDbHealth } from "@/db"

const app = new Hono().basePath("/api")

function getCorsOrigins(): string | string[] {
	const originsEnv = process.env.CORS_ORIGINS

	if (!originsEnv) {
		if (process.env.NODE_ENV === "production") {
			logger.warn(
				"CORS_ORIGINS not set in production, defaulting to no allowed origins",
			)
			return []
		}
		return "*"
	}

	if (originsEnv.trim() === "*") {
		if (process.env.NODE_ENV === "production") {
			logger.warn("CORS_ORIGINS=* in production is not recommended")
		}
		return "*"
	}

	const origins = originsEnv
		.split(",")
		.map((origin) => origin.trim())
		.filter((origin): origin is string => Boolean(origin))

	const [singleOrigin] = origins
	return singleOrigin !== undefined && origins.length === 1
		? singleOrigin
		: origins
}

export const corsOrigins = getCorsOrigins()

app.use("*", requestLogger)
app.use(
	"*",
	cors({
		origin: corsOrigins,
		allowMethods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
		allowHeaders: ["Content-Type", "Authorization"],
		exposeHeaders: ["Content-Length"],
		maxAge: constants.server.corsMaxAge,
		credentials: true,
	}),
)

app.get("/", (c) => {
	return c.json({
		name: constants.app.name,
		version: constants.app.version,
		status: "ok",
	})
})

app.get("/health", async (c) => {
	const dbHealth = await checkDbHealth()
	const status = dbHealth.connected ? "ok" : "degraded"

	return c.json({
		status,
		timestamp: new Date().toISOString(),
		services: {
			database: dbHealth,
		},
	})
})

app.route("/auth", authRoutes)
app.route("/calendars", calendarRoutes)
app.route("/", itemRoutes)
app.route("/", shareRoutes)
app.route("/ai", aiRoutes)

app.onError((err, c) => {
	logger.error({ err }, "Request error")

	if (err instanceof HTTPException) {
		return c.json(
			{
				error: err.message,
				code: "HTTP_ERROR",
			},
			err.status,
		)
	}

	if (isAppError(err)) {
		const appErr = err
		return c.json(appErr.toJSON(), appErr.statusCode)
	}

	const isDev = process.env.NODE_ENV !== "production"

	return c.json(
		{
			error: isDev ? err.message : "Internal server error",
			code: "INTERNAL_ERROR",
			...(isDev && err instanceof Error && { stack: err.stack }),
		},
		500,
	)
})

app.notFound((c) => {
	return c.json(
		{
			error: "Not found",
			code: "NOT_FOUND",
			path: c.req.path,
		},
		404,
	)
})

export default app
