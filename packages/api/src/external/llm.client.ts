/**
 * LLM Client
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
import { aiConfig, constants } from "../config"
import { ServiceUnavailableError } from "../lib/errors"
import { createLogger } from "../lib/logger"

const log = createLogger("llm")

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

const DEFAULT_RETRY_OPTIONS: Required<RetryOptions> = {
	maxRetries: constants.llm.retry.maxRetries,
	initialDelayMs: constants.llm.retry.initialDelayMs,
	maxDelayMs: constants.llm.retry.maxDelayMs,
	backoffMultiplier: constants.llm.retry.backoffMultiplier,
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

			log.warn(
				{
					attempt: attempt + 1,
					maxAttempts: opts.maxRetries + 1,
					retryIn: delay,
					error: error instanceof Error ? error.message : error,
				},
				"LLM API call failed, retrying",
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
			promptTokens: completion.usage.prompt_tokens,
			completionTokens: completion.usage.completion_tokens,
			totalTokens: completion.usage.total_tokens,
		}),
	}
}

export const llmClient = {
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

export type LLMClient = typeof llmClient
