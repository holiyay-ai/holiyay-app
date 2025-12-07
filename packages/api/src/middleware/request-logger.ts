/**
 * Request Logger Middleware
 *
 * HTTP request/response logging using Pino. Logs method, path,
 * status code, and response time for each request.
 */

import type { Context, Next } from "hono"
import { createLogger } from "../lib/logger"

const log = createLogger("http")

export async function requestLogger(c: Context, next: Next) {
	const start = Date.now()
	const { method, path } = c.req

	await next()

	const duration = Date.now() - start
	const status = c.res.status

	log.info({
		method,
		path,
		status,
		duration,
	})
}
