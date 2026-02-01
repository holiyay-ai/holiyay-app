/**
 * In-Memory Cache
 *
 * Lightweight caching layer for AI responses and expensive operations.
 * Supports TTL (time-to-live) for automatic expiration.
 *
 * Note: This cache is per-process and not shared across instances.
 * For production with multiple instances, consider Redis or similar.
 */

import { config } from "./config"

export interface CacheEntry<T> {
	value: T
	expiresAt: number
}

export interface CacheOptions {
	ttlSeconds: number
	maxEntries?: number
}

export function createCacheKey(
	...parts: (string | undefined | null)[]
): string {
	return parts
		.filter(Boolean)
		.map((p) => String(p).toLowerCase().trim())
		.join(":")
}

class MemoryCache<T = unknown> {
	private cache: Map<string, CacheEntry<T>> = new Map()
	private readonly ttlSeconds: number
	private readonly maxEntries: number

	constructor(options: Partial<CacheOptions> = {}) {
		this.ttlSeconds = options.ttlSeconds ?? config.cache.defaultTtlSeconds
		this.maxEntries = options.maxEntries ?? config.cache.defaultMaxEntries
	}

	get(key: string): T | undefined {
		const entry = this.cache.get(key)

		if (!entry) {
			return undefined
		}

		if (Date.now() > entry.expiresAt) {
			this.cache.delete(key)
			return undefined
		}

		return entry.value
	}

	set(key: string, value: T, ttlSeconds?: number): void {
		if (this.cache.size >= this.maxEntries) {
			this.evictOldest()
		}

		const ttl = ttlSeconds ?? this.ttlSeconds
		const expiresAt = Date.now() + ttl * 1000

		this.cache.set(key, { value, expiresAt })
	}

	has(key: string): boolean {
		const entry = this.cache.get(key)

		if (!entry) {
			return false
		}

		if (Date.now() > entry.expiresAt) {
			this.cache.delete(key)
			return false
		}

		return true
	}

	delete(key: string): boolean {
		return this.cache.delete(key)
	}

	clear(): void {
		this.cache.clear()
	}

	get size(): number {
		return this.cache.size
	}

	prune(): number {
		const now = Date.now()
		let pruned = 0

		for (const [key, entry] of this.cache.entries()) {
			if (now > entry.expiresAt) {
				this.cache.delete(key)
				pruned++
			}
		}

		return pruned
	}

	private evictOldest(): void {
		const firstKey = this.cache.keys().next().value
		if (firstKey !== undefined) {
			this.cache.delete(firstKey)
		}
	}

	async getOrSet(
		key: string,
		factory: () => Promise<T>,
		ttlSeconds?: number,
	): Promise<T> {
		const cached = this.get(key)

		if (cached !== undefined) {
			return cached
		}

		const value = await factory()
		this.set(key, value, ttlSeconds)
		return value
	}
}

export const checklistCache = new MemoryCache<unknown>({
	ttlSeconds: config.cache.checklist.ttlSeconds,
	maxEntries: config.cache.checklist.maxEntries,
})

export const recommendationCache = new MemoryCache<unknown>({
	ttlSeconds: config.cache.recommendations.ttlSeconds,
	maxEntries: config.cache.recommendations.maxEntries,
})

export const destinationCache = new MemoryCache<unknown>({
	ttlSeconds: config.cache.destinations.ttlSeconds,
	maxEntries: config.cache.destinations.maxEntries,
})

export const genericCache = new MemoryCache<unknown>({
	ttlSeconds: config.cache.defaultTtlSeconds,
	maxEntries: config.cache.defaultMaxEntries,
})

export { MemoryCache }
