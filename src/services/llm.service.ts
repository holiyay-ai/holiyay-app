/**
 * LLM Service
 *
 * Provider-agnostic wrapper for LLM API calls. Currently uses OpenAI.
 * Provides:
 * - Lazy singleton client initialization
 * - Retry logic with exponential backoff for transient failures
 * - JSON response parsing with markdown code block handling
 * - Consistent error handling
 */

import OpenAI from "openai"
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions"
import { config } from "./config"

export interface ChatMessage {
	role: "system" | "user" | "assistant"
	content: string
}

export interface CompletionOptions {
	model?: string
	messages: ChatMessage[]
	temperature?: number
	maxTokens?: number
}

export interface CompletionResult {
	content: string
	finishReason: string | null
	usage?: {
		promptTokens: number
		completionTokens: number
		totalTokens: number
	}
}

export interface RetryOptions {
	maxRetries?: number
	initialDelayMs?: number
	maxDelayMs?: number
	backoffMultiplier?: number
}

// Error classes
export class ServiceUnavailableError extends Error {
	code: string
	constructor(message: string, code: string = "SERVICE_UNAVAILABLE") {
		super(message)
		this.name = "ServiceUnavailableError"
		this.code = code
	}
}

// AI Configuration
export const aiConfig = {
	provider: "openai" as const,
	model: "gpt-4o-mini",

	defaults: {
		temperature: 0.7,
		maxTokens: 1000,
	},

	checklist: {
		temperature: 0.7,
		maxTokens: 1000,
	},

	activities: {
		temperature: 0.8,
		maxTokens: 2000,
	},

	destinations: {
		temperature: 0.9,
		maxTokens: 500,
	},
}

// System prompts
export const systemPrompts = {
	checklist:
		"You are a travel assistant that generates packing checklists. Respond with valid JSON only.",

	activities:
		"You are a travel assistant that recommends activities. Respond with valid JSON only.",

	destinations: "You are a travel expert. Respond with valid JSON only.",
}

// User prompt templates
export const userPrompts = {
	checklist: (params: {
		destination: string
		startDate: string
		endDate: string
		duration: number
		activitiesContext: string
	}) =>
		`Generate a packing checklist for a trip to ${params.destination} from ${params.startDate} to ${params.endDate} (${params.duration} days). ${params.activitiesContext}

Consider weather/climate, essential travel items, activity-specific items, and trip duration.

Return as JSON array: [{"text": "Item name", "checked": false}]`,

	activities: (params: {
		destination: string
		limit: number
		dateContext: string
		interestsContext: string
	}) =>
		`Recommend ${params.limit} activities in ${params.destination} ${params.dateContext}. ${params.interestsContext}

For each, provide: title, description (2-3 sentences), category (activity/food/transport/lodging/other), estimatedDuration, location.

Return as JSON array.`,

	destinations: (preferencesContext: string) =>
		`Suggest 5 travel destinations based on: ${preferencesContext || "general preferences"}.

Return as JSON array of strings: ["City, Country", ...]`,
}

const DEFAULT_RETRY_OPTIONS: Required<RetryOptions> = {
	maxRetries: config.llm.retry.maxRetries,
	initialDelayMs: config.llm.retry.initialDelayMs,
	maxDelayMs: config.llm.retry.maxDelayMs,
	backoffMultiplier: config.llm.retry.backoffMultiplier,
}

let clientInstance: OpenAI | null = null

function getOpenAIClient(): OpenAI {
	if (clientInstance) {
		return clientInstance
	}

	const apiKey = process.env.OPENAI_API_KEY

	if (!apiKey) {
		throw new ServiceUnavailableError("AI features", "AI_NOT_CONFIGURED")
	}

	clientInstance = new OpenAI({ apiKey })
	return clientInstance
}

function isRetryableError(error: unknown): boolean {
	if (error instanceof OpenAI.APIError) {
		const status = error.status
		if (status === 429) return true
		if (status >= 500 && status < 600) return true
	}

	if (error instanceof Error) {
		const message = error.message.toLowerCase()
		if (
			message.includes("network") ||
			message.includes("timeout") ||
			message.includes("econnreset") ||
			message.includes("econnrefused")
		) {
			return true
		}
	}

	return false
}

function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms))
}

async function withRetry<T>(
	fn: () => Promise<T>,
	options: RetryOptions = {},
): Promise<T> {
	const opts = { ...DEFAULT_RETRY_OPTIONS, ...options }
	let lastError: unknown
	let delay = opts.initialDelayMs

	for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
		try {
			return await fn()
		} catch (error) {
			lastError = error

			if (!isRetryableError(error)) {
				throw error
			}

			if (attempt === opts.maxRetries) {
				break
			}

			console.warn(
				`LLM API call failed (attempt ${attempt + 1}/${opts.maxRetries + 1}), retrying in ${delay}ms`,
			)

			await sleep(delay)

			const jitter = Math.random() * 0.1 * delay
			delay = Math.min(delay * opts.backoffMultiplier + jitter, opts.maxDelayMs)
		}
	}

	throw lastError
}

export function parseJsonResponse<T>(content: string): T {
	let jsonContent = content.trim()

	if (jsonContent.startsWith("```")) {
		jsonContent = jsonContent
			.replace(/```json\n?/g, "")
			.replace(/```\n?/g, "")
			.trim()
	}

	return JSON.parse(jsonContent) as T
}

async function openaiCompletion(
	options: CompletionOptions,
	retryOptions?: RetryOptions,
): Promise<CompletionResult> {
	const client = getOpenAIClient()

	const completion = await withRetry(async () => {
		return client.chat.completions.create({
			model: options.model ?? aiConfig.model,
			messages: options.messages as ChatCompletionMessageParam[],
			temperature: options.temperature ?? aiConfig.defaults.temperature,
			max_tokens: options.maxTokens ?? aiConfig.defaults.maxTokens,
		})
	}, retryOptions)

	const choice = completion.choices[0]

	return {
		content: choice?.message?.content ?? "",
		finishReason: choice?.finish_reason ?? null,
		...(completion.usage && {
			usage: {
				promptTokens: completion.usage.prompt_tokens,
				completionTokens: completion.usage.completion_tokens,
				totalTokens: completion.usage.total_tokens,
			},
		}),
	}
}

export const llmService = {
	isAvailable(): boolean {
		return !!process.env.OPENAI_API_KEY
	},

	async completion(
		options: CompletionOptions,
		retryOptions?: RetryOptions,
	): Promise<CompletionResult> {
		return openaiCompletion(options, retryOptions)
	},

	async completionJson<T>(
		options: CompletionOptions,
		retryOptions?: RetryOptions,
	): Promise<T> {
		const result = await this.completion(options, retryOptions)

		try {
			return parseJsonResponse<T>(result.content)
		} catch {
			throw new ServiceUnavailableError(
				"Failed to parse AI response",
				"AI_SERVICE_ERROR",
			)
		}
	},

	reset(): void {
		clientInstance = null
	},
}

export type LLMService = typeof llmService
