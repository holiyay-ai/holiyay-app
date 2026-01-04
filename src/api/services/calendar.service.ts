/**
 * Calendar Service
 *
 * Handles calendar operations: creating, updating, deleting, and listing calendars.
 * Manages access control for owned and shared calendars, combining both into a
 * unified list with role indicators (owner/shared) and permission levels (view/edit).
 */

import type { Calendar, NewCalendar } from "../db/schema"
import { ForbiddenError, NotFoundError } from "../lib/errors"
import { calendarRepository } from "../repositories/calendar.repository"
import { itemRepository } from "../repositories/item.repository"
import type { CalendarWithItems, CalendarWithRole } from "../types"

export interface CreateCalendarInput {
	name: string
	destination?: string | undefined
	startDate: string
	endDate: string
}

export interface UpdateCalendarInput {
	name?: string | undefined
	destination?: string | null | undefined
	startDate?: string | undefined
	endDate?: string | undefined
}

export const calendarService = {
	async listForUser(userId: string): Promise<CalendarWithRole[]> {
		const owned = await calendarRepository.findByOwnerId(userId)
		const shared = await calendarRepository.findSharedWithUser(userId)

		const ownedWithRole: CalendarWithRole[] = owned.map((cal) => ({
			id: cal.id,
			ownerId: cal.ownerId,
			name: cal.name,
			destination: cal.destination,
			startDate: cal.startDate,
			endDate: cal.endDate,
			shareToken: cal.shareToken,
			createdAt: cal.createdAt,
			updatedAt: cal.updatedAt,
			role: "owner" as const,
			permission: "edit" as const,
		}))

		const sharedWithRole: CalendarWithRole[] = shared.map(
			({ calendar, permission }) => ({
				id: calendar.id,
				ownerId: calendar.ownerId,
				name: calendar.name,
				destination: calendar.destination,
				startDate: calendar.startDate,
				endDate: calendar.endDate,
				shareToken: calendar.shareToken,
				createdAt: calendar.createdAt,
				updatedAt: calendar.updatedAt,
				role: "shared" as const,
				permission,
			}),
		)

		return [...ownedWithRole, ...sharedWithRole]
	},

	async getWithItems(
		calendarId: string,
		userId: string,
	): Promise<CalendarWithItems> {
		const access = await calendarRepository.findWithAccess(calendarId, userId)

		if (!access) {
			throw new NotFoundError("Calendar")
		}

		const items = await itemRepository.findByCalendarId(calendarId)

		return {
			id: access.calendar.id,
			ownerId: access.calendar.ownerId,
			name: access.calendar.name,
			destination: access.calendar.destination,
			startDate: access.calendar.startDate,
			endDate: access.calendar.endDate,
			shareToken: access.calendar.shareToken,
			createdAt: access.calendar.createdAt,
			updatedAt: access.calendar.updatedAt,
			permission: access.permission,
			items: items.map((item) => ({
				id: item.id,
				calendarId: item.calendarId,
				date: item.date,
				title: item.title,
				description: item.description,
				startTime: item.startTime,
				endTime: item.endTime,
				location: item.location,
				category: item.category,
				checklistId: item.checklistId,
				orderIndex: item.orderIndex,
				createdAt: item.createdAt,
				updatedAt: item.updatedAt,
			})),
		}
	},

	async create(userId: string, input: CreateCalendarInput): Promise<Calendar> {
		const data: NewCalendar = {
			ownerId: userId,
			name: input.name,
			destination: input.destination ?? null,
			startDate: input.startDate,
			endDate: input.endDate,
		}

		return await calendarRepository.create(data)
	},

	async update(
		calendarId: string,
		userId: string,
		input: UpdateCalendarInput,
	): Promise<Calendar> {
		const access = await calendarRepository.findWithAccess(calendarId, userId)

		if (!access) {
			throw new NotFoundError("Calendar")
		}

		if (access.permission !== "edit") {
			throw new ForbiddenError(
				"You don't have permission to edit this calendar",
			)
		}

		const updateData: Partial<Calendar> = {}
		if (input.name !== undefined) updateData.name = input.name
		if (input.destination !== undefined)
			updateData.destination = input.destination
		if (input.startDate !== undefined) updateData.startDate = input.startDate
		if (input.endDate !== undefined) updateData.endDate = input.endDate

		const updated = await calendarRepository.update(calendarId, updateData)

		if (!updated) {
			throw new NotFoundError("Calendar")
		}

		return updated
	},

	async delete(calendarId: string, userId: string): Promise<void> {
		const isOwner = await calendarRepository.isOwner(calendarId, userId)

		if (!isOwner) {
			throw new NotFoundError("Calendar")
		}

		const deleted = await calendarRepository.delete(calendarId)

		if (!deleted) {
			throw new NotFoundError("Calendar")
		}
	},

	async checkAccess(
		calendarId: string,
		userId: string,
		requireEdit: boolean = false,
	): Promise<{ hasAccess: boolean; isOwner: boolean }> {
		const access = await calendarRepository.findWithAccess(calendarId, userId)

		if (!access) {
			return { hasAccess: false, isOwner: false }
		}

		if (requireEdit && access.permission !== "edit") {
			return { hasAccess: false, isOwner: false }
		}

		return { hasAccess: true, isOwner: access.isOwner }
	},

	async getById(calendarId: string): Promise<Calendar | null> {
		return await calendarRepository.findById(calendarId)
	},
}

export type CalendarService = typeof calendarService
