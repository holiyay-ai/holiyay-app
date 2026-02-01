/**
 * AI Service
 *
 * Handles AI-powered features: packing checklist generation, activity
 * recommendations, and destination suggestions.
 *
 * Uses a caching strategy for cost efficiency:
 * 1. In-memory cache (fastest)
 * 2. LLM API call (when cache misses)
 */

import { createAdminClient } from "@/lib/supabase/server"
import type {
	ActivityRecommendation,
	ChecklistItem,
	GeneratedChecklist,
	RecommendationsResponse,
} from "@/types"
import {
	checklistCache,
	createCacheKey,
	destinationCache,
	recommendationCache,
} from "./cache"
import { aiConfig, llmService, systemPrompts, userPrompts } from "./llm.service"

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

		// Check in-memory cache first
		const cached = checklistCache.get(cacheKey) as
			| GeneratedChecklist
			| undefined
		if (cached) {
			return { ...cached, cached: true }
		}

		// Check database for existing checklist if calendarId provided
		if (input.calendarId) {
			const supabase = await createAdminClient()
			const { data: existingChecklists } = await supabase
				.from("checklists")
				.select("*")
				.eq("calendar_id", input.calendarId)
				.eq("ai_generated", true)

			const matchingChecklist = existingChecklists?.find(
				(c) =>
					c.ai_generated &&
					c.title.toLowerCase().includes(input.destination.toLowerCase()),
			)

			if (matchingChecklist) {
				const result: GeneratedChecklist = {
					id: matchingChecklist.id,
					calendarId: matchingChecklist.calendar_id,
					title: matchingChecklist.title,
					items: matchingChecklist.items as unknown as ChecklistItem[],
					aiGenerated: true,
					cached: true,
				}
				checklistCache.set(cacheKey, result)
				return result
			}
		}

		// Generate new checklist via LLM
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

		const items = await llmService.completionJson<ChecklistItem[]>({
			model: aiConfig.model,
			messages: [
				{ role: "system", content: systemPrompts.checklist },
				{ role: "user", content: prompt },
			],
			temperature: aiConfig.checklist.temperature,
			maxTokens: aiConfig.checklist.maxTokens,
		})

		const title = `Packing list for ${input.destination}`

		// Save to database if calendarId provided
		let savedId: string | undefined
		if (input.calendarId) {
			const supabase = await createAdminClient()
			const { data: saved } = await supabase
				.from("checklists")
				.insert({
					calendar_id: input.calendarId,
					title,
					items: JSON.parse(JSON.stringify(items)),
					ai_generated: true,
				})
				.select()
				.single()

			savedId = saved?.id
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

		// Check in-memory cache first
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

		const recommendations = await llmService.completionJson<
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

		// Check in-memory cache first
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

		const destinations = await llmService.completionJson<string[]>({
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
		return llmService.isAvailable()
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
