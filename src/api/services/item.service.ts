/**
 * Item Service
 *
 * Handles calendar item operations: creating, updating, deleting, reordering,
 * and duplicating items. All operations verify calendar access before proceeding.
 * Items are ordered within their date using an orderIndex for drag-and-drop support.
 */

import type { Item, NewItem } from "../db/schema"
import { ForbiddenError, NotFoundError } from "../lib/errors"
import { calendarRepository } from "../repositories/calendar.repository"
import { itemRepository } from "../repositories/item.repository"

export interface CreateItemInput {
	date: string
	title: string
	description?: string | undefined
	startTime?: string | undefined
	endTime?: string | undefined
	location?: string | undefined
	category?: "activity" | "transport" | "food" | "lodging" | "other" | undefined
	affiliateLink?: string | null | undefined
	orderIndex?: number | undefined
}

export interface UpdateItemInput {
	date?: string | undefined
	title?: string | undefined
	description?: string | null | undefined
	startTime?: string | null | undefined
	endTime?: string | null | undefined
	location?: string | null | undefined
	category?: "activity" | "transport" | "food" | "lodging" | "other" | undefined
	affiliateLink?: string | null | undefined
	orderIndex?: number | undefined
}

export interface ReorderItemInput {
	id: string
	orderIndex: number
}

async function assertCalendarAccess(
	calendarId: string,
	userId: string,
	requireEdit: boolean = false,
): Promise<void> {
	const access = await calendarRepository.findWithAccess(calendarId, userId)

	if (!access) {
		throw new NotFoundError("Calendar")
	}

	if (requireEdit && access.permission !== "edit") {
		throw new ForbiddenError("You don't have permission to edit this calendar")
	}
}

async function getItemWithAccess(
	itemId: string,
	userId: string,
	requireEdit: boolean = false,
): Promise<Item> {
	const item = await itemRepository.findById(itemId)

	if (!item) {
		throw new NotFoundError("Item")
	}

	await assertCalendarAccess(item.calendarId, userId, requireEdit)

	return item
}

export const itemService = {
	async listByCalendar(calendarId: string, userId: string): Promise<Item[]> {
		await assertCalendarAccess(calendarId, userId)
		return await itemRepository.findByCalendarId(calendarId)
	},

	async listByDate(
		calendarId: string,
		date: string,
		userId: string,
	): Promise<Item[]> {
		await assertCalendarAccess(calendarId, userId)
		return await itemRepository.findByCalendarAndDate(calendarId, date)
	},

	async getById(itemId: string, userId: string): Promise<Item> {
		return await getItemWithAccess(itemId, userId)
	},

	async create(
		calendarId: string,
		userId: string,
		input: CreateItemInput,
	): Promise<Item> {
		await assertCalendarAccess(calendarId, userId, true)

		const orderIndex =
			input.orderIndex ??
			(await itemRepository.getNextOrderIndex(calendarId, input.date))

		const newItem: NewItem = {
			calendarId,
			date: input.date,
			title: input.title,
			description: input.description || null,
			startTime: input.startTime || null,
			endTime: input.endTime || null,
			location: input.location || null,
			category: input.category ?? "other",
			affiliateLink: input.affiliateLink || null,
			orderIndex,
		}

		return await itemRepository.create(newItem)
	},

	async update(
		itemId: string,
		userId: string,
		input: UpdateItemInput,
	): Promise<Item> {
		await getItemWithAccess(itemId, userId, true)

		const updateData: Partial<Item> = {}

		if (input.date !== undefined) updateData.date = input.date
		if (input.title !== undefined) updateData.title = input.title
		if (input.description !== undefined)
			updateData.description = input.description
		if (input.startTime !== undefined) updateData.startTime = input.startTime
		if (input.endTime !== undefined) updateData.endTime = input.endTime
		if (input.location !== undefined) updateData.location = input.location
		if (input.category !== undefined) updateData.category = input.category
		if (input.affiliateLink !== undefined)
			updateData.affiliateLink = input.affiliateLink
		if (input.orderIndex !== undefined) updateData.orderIndex = input.orderIndex

		const updated = await itemRepository.update(itemId, updateData)

		if (!updated) {
			throw new NotFoundError("Item")
		}

		return updated
	},

	async delete(itemId: string, userId: string): Promise<void> {
		await getItemWithAccess(itemId, userId, true)

		const deleted = await itemRepository.delete(itemId)

		if (!deleted) {
			throw new NotFoundError("Item")
		}
	},

	async reorder(
		calendarId: string,
		userId: string,
		items: ReorderItemInput[],
	): Promise<void> {
		await assertCalendarAccess(calendarId, userId, true)
		await itemRepository.reorder(calendarId, items)
	},

	async moveToDate(
		itemId: string,
		userId: string,
		newDate: string,
	): Promise<Item> {
		const item = await getItemWithAccess(itemId, userId, true)

		const orderIndex = await itemRepository.getNextOrderIndex(
			item.calendarId,
			newDate,
		)

		const updated = await itemRepository.update(itemId, {
			date: newDate,
			orderIndex,
		})

		if (!updated) {
			throw new NotFoundError("Item")
		}

		return updated
	},

	async duplicate(
		itemId: string,
		userId: string,
		targetDate?: string,
	): Promise<Item> {
		const item = await getItemWithAccess(itemId, userId, true)

		const date = targetDate ?? item.date
		const orderIndex = await itemRepository.getNextOrderIndex(
			item.calendarId,
			date,
		)

		const newItem: NewItem = {
			calendarId: item.calendarId,
			date,
			title: item.title,
			description: item.description,
			startTime: item.startTime,
			endTime: item.endTime,
			location: item.location,
			category: item.category,
			affiliateLink: item.affiliateLink,
			orderIndex,
		}

		return await itemRepository.create(newItem)
	},
}

export type ItemService = typeof itemService
