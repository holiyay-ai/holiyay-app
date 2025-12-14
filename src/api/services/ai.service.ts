/**
 * AI Service
 *
 * Handles AI-powered features: packing checklist generation, activity
 * recommendations, and destination suggestions.
 *
 * Uses a 3-tier caching strategy for cost efficiency:
 * 1. In-memory cache (fastest)
 * 2. Database lookup (for persisted checklists)
 * 3. LLM API call (when cache misses)
 *
 * Generated checklists can optionally be persisted to a calendar.
 */

import { aiConfig, systemPrompts, userPrompts } from "@/api/config"
import { llmClient } from "@/api/external"
import {
	checklistCache,
	createCacheKey,
	destinationCache,
	recommendationCache,
} from "@/api/external/cache"
import { checklistRepository } from "@/api/repositories/checklist.repository"
import type {
	ActivityRecommendation,
	ChecklistItem,
	GeneratedChecklist,
	RecommendationsResponse,
} from "@/api/types"

export interface GenerateChecklistInput {
	destination: string
	startDate: string
	endDate: string
	activities?: string[] | undefined
	calendarId?: string | undefined
}

export interface RecommendActivitiesInput {
	destination: string
	date?: string | undefined
	interests?: string[] | undefined
	limit?: number | undefined
}

export interface DestinationPreferences {
	climate?: "tropical" | "temperate" | "cold" | "any" | undefined
	budget?: "budget" | "moderate" | "luxury" | undefined
	interests?: string[] | undefined
	duration?: number | undefined
}

function getTripDuration(startDate: string, endDate: string): number {
	const start = new Date(startDate)
	const end = new Date(endDate)
	const diffTime = Math.abs(end.getTime() - start.getTime())
	return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
}

function getChecklistCacheKey(input: GenerateChecklistInput): string {
	const activitiesKey = input.activities?.sort().join(",") ?? ""
	return createCacheKey(
		"checklist",
		input.destination,
		input.startDate,
		input.endDate,
		activitiesKey,
	)
}

function getRecommendationCacheKey(input: RecommendActivitiesInput): string {
	const interestsKey = input.interests?.sort().join(",") ?? ""
	return createCacheKey(
		"recommend",
		input.destination,
		input.date ?? "any",
		interestsKey,
		String(input.limit ?? 5),
	)
}

function getDestinationCacheKey(preferences: DestinationPreferences): string {
	const interestsKey = preferences.interests?.sort().join(",") ?? ""
	return createCacheKey(
		"destinations",
		preferences.climate ?? "any",
		preferences.budget ?? "any",
		interestsKey,
		String(preferences.duration ?? 0),
	)
}

export const aiService = {
	async generateChecklist(
		input: GenerateChecklistInput,
	): Promise<GeneratedChecklist> {
		const cacheKey = getChecklistCacheKey(input)

		const cached = checklistCache.get(cacheKey) as
			| GeneratedChecklist
			| undefined
		if (cached) {
			return { ...cached, cached: true }
		}

		if (input.calendarId) {
			const existing = await checklistRepository.findByCalendarId(
				input.calendarId,
			)
			const matchingChecklist = existing.find(
				(c) =>
					c.aiGenerated &&
					c.title.toLowerCase().includes(input.destination.toLowerCase()),
			)

			if (matchingChecklist) {
				const result: GeneratedChecklist = {
					id: matchingChecklist.id,
					calendarId: matchingChecklist.calendarId,
					title: matchingChecklist.title,
					items: matchingChecklist.items as ChecklistItem[],
					aiGenerated: true,
					cached: true,
				}
				checklistCache.set(cacheKey, result)
				return result
			}
		}

		const duration = getTripDuration(input.startDate, input.endDate)
		const activitiesContext =
			input.activities && input.activities.length > 0
				? `The traveler plans to do these activities: ${input.activities.join(", ")}.`
				: ""

		const prompt = userPrompts.checklist({
			destination: input.destination,
			startDate: input.startDate,
			endDate: input.endDate,
			duration,
			activitiesContext,
		})

		const items = await llmClient.completionJson<ChecklistItem[]>({
			model: aiConfig.model,
			messages: [
				{ role: "system", content: systemPrompts.checklist },
				{ role: "user", content: prompt },
			],
			temperature: aiConfig.checklist.temperature,
			maxTokens: aiConfig.checklist.maxTokens,
		})

		const title = `Packing list for ${input.destination}`

		let savedId: string | undefined
		if (input.calendarId) {
			const saved = await checklistRepository.create({
				calendarId: input.calendarId,
				title,
				items,
				aiGenerated: true,
			})
			savedId = saved.id
		}

		const result: GeneratedChecklist = {
			id: savedId,
			calendarId: input.calendarId,
			title,
			items,
			aiGenerated: true,
			cached: false,
		}

		checklistCache.set(cacheKey, result)

		return result
	},

	async recommendActivities(
		input: RecommendActivitiesInput,
	): Promise<RecommendationsResponse> {
		const cacheKey = getRecommendationCacheKey(input)

		const cached = recommendationCache.get(cacheKey) as
			| RecommendationsResponse
			| undefined
		if (cached) {
			return { ...cached, cached: true }
		}

		const limit = input.limit ?? 5
		const dateContext = input.date ? `for ${input.date}` : ""
		const interestsContext =
			input.interests && input.interests.length > 0
				? `Interests: ${input.interests.join(", ")}.`
				: ""

		const prompt = userPrompts.activities({
			destination: input.destination,
			limit,
			dateContext,
			interestsContext,
		})

		const recommendations = await llmClient.completionJson<
			ActivityRecommendation[]
		>({
			model: aiConfig.model,
			messages: [
				{ role: "system", content: systemPrompts.activities },
				{ role: "user", content: prompt },
			],
			temperature: aiConfig.activities.temperature,
			maxTokens: aiConfig.activities.maxTokens,
		})

		const result: RecommendationsResponse = {
			destination: input.destination,
			recommendations,
			cached: false,
		}

		recommendationCache.set(cacheKey, result)

		return result
	},

	async suggestDestinations(
		preferences: DestinationPreferences,
	): Promise<string[]> {
		const cacheKey = getDestinationCacheKey(preferences)

		const cached = destinationCache.get(cacheKey) as string[] | undefined
		if (cached) {
			return cached
		}

		const parts = [
			preferences.climate && `Climate: ${preferences.climate}`,
			preferences.budget && `Budget: ${preferences.budget}`,
			preferences.interests?.length &&
				`Interests: ${preferences.interests.join(", ")}`,
			preferences.duration && `Duration: ${preferences.duration} days`,
		].filter(Boolean)

		const prompt = userPrompts.destinations(parts.join(". "))

		const destinations = await llmClient.completionJson<string[]>({
			model: aiConfig.model,
			messages: [
				{ role: "system", content: systemPrompts.destinations },
				{ role: "user", content: prompt },
			],
			temperature: aiConfig.destinations.temperature,
			maxTokens: aiConfig.destinations.maxTokens,
		})

		destinationCache.set(cacheKey, destinations)

		return destinations
	},

	isAvailable(): boolean {
		return llmClient.isAvailable()
	},

	clearCache(): void {
		checklistCache.clear()
		recommendationCache.clear()
		destinationCache.clear()
	},

	getCacheStats(): {
		checklists: number
		recommendations: number
		destinations: number
	} {
		return {
			checklists: checklistCache.size,
			recommendations: recommendationCache.size,
			destinations: destinationCache.size,
		}
	},
}

export type AIService = typeof aiService
