/**
 * Logger
 *
 * Structured logging using Pino. JSON output in production,
 * pretty-printed in development. Use child loggers for context.
 */

import pino from "pino"

const isDev = process.env.NODE_ENV !== "production"
const level = process.env.LOG_LEVEL ?? (isDev ? "debug" : "info")

const baseOptions: pino.LoggerOptions = {
	level,
	base: {
		service: "holiyay",
		env: process.env.NODE_ENV ?? "development",
	},
}

let logger: pino.Logger

if (isDev) {
	// Only import pino-pretty in development
	const pretty = await import("pino-pretty").then(
		(m) => m.default,
		() => null,
	)

	if (pretty) {
		logger = pino(
			baseOptions,
			pretty({
				colorize: true,
				translateTime: "HH:MM:ss",
				ignore: "pid,hostname",
			}),
		)
	} else {
		logger = pino(baseOptions)
	}
} else {
	// Production: plain JSON logs, no pino-pretty
	logger = pino(baseOptions)
}

export { logger }

export function createLogger(name: string) {
	return logger.child({ module: name })
}
