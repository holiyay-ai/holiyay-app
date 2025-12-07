/**
 * Error Handling
 *
 * Custom error classes for consistent error handling across the application.
 * All errors extend AppError and are caught by the global error handler.
 *
 * Error codes are typed to ensure consistency between backend and frontend.
 * Each error class maps to an HTTP status code and includes a machine-readable code.
 */

import type { Context } from "hono"
import type { ContentfulStatusCode } from "hono/utils/http-status"

export type ErrorCode =
	| "UNAUTHORIZED"
	| "FORBIDDEN"
	| "INVALID_CREDENTIALS"
	| "INVALID_TOKEN"
	| "TOKEN_EXPIRED"
	| "USER_NOT_FOUND"
	| "USER_ALREADY_EXISTS"
	| "WEAK_PASSWORD"
	| "NOT_FOUND"
	| "ALREADY_EXISTS"
	| "CONFLICT"
	| "VALIDATION_ERROR"
	| "INVALID_INPUT"
	| "AI_SERVICE_ERROR"
	| "AI_NOT_CONFIGURED"
	| "WEATHER_SERVICE_ERROR"
	| "INTERNAL_ERROR"
	| "SERVICE_UNAVAILABLE"
	| "AUTH_ERROR"

export class AppError extends Error {
	public readonly statusCode: ContentfulStatusCode

	constructor(
		message: string,
		public readonly code: ErrorCode,
		statusCode: number = 500,
		public readonly details?: unknown,
	) {
		super(message)
		this.name = "AppError"
		this.statusCode = statusCode as ContentfulStatusCode
		Error.captureStackTrace(this, this.constructor)
	}

	toJSON(): { error: string; code: ErrorCode; details?: unknown } {
		const result: { error: string; code: ErrorCode; details?: unknown } = {
			error: this.message,
			code: this.code,
		}
		if (this.details !== undefined) {
			result.details = this.details
		}
		return result
	}
}

export class ValidationError extends AppError {
	constructor(message: string, details?: unknown) {
		super(message, "VALIDATION_ERROR", 400, details)
		this.name = "ValidationError"
	}
}

export class UnauthorizedError extends AppError {
	constructor(
		message: string = "Authentication required",
		code: ErrorCode = "UNAUTHORIZED",
	) {
		super(message, code, 401)
		this.name = "UnauthorizedError"
	}
}

export class ForbiddenError extends AppError {
	constructor(message: string = "Access denied") {
		super(message, "FORBIDDEN", 403)
		this.name = "ForbiddenError"
	}
}

export class NotFoundError extends AppError {
	constructor(resource: string = "Resource") {
		super(`${resource} not found`, "NOT_FOUND", 404)
		this.name = "NotFoundError"
	}
}

export class ConflictError extends AppError {
	constructor(message: string, code: ErrorCode = "CONFLICT") {
		super(message, code, 409)
		this.name = "ConflictError"
	}
}

export class ServiceUnavailableError extends AppError {
	constructor(service: string, code: ErrorCode = "SERVICE_UNAVAILABLE") {
		super(`${service} is not available`, code, 503)
		this.name = "ServiceUnavailableError"
	}
}

export function isAppError(error: unknown): error is AppError {
	return error instanceof AppError
}

export function handleError(c: Context, error: unknown) {
	if (isAppError(error)) {
		return c.json(error.toJSON(), error.statusCode)
	}
	throw error
}
