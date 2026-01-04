/**
 * Share Service
 *
 * Handles calendar sharing: generating share links, inviting users by email,
 * managing permissions, and joining shared calendars via token. Users can be
 * invited with view or edit permissions. Share tokens provide public read access.
 */

import type { CalendarShare } from "../db/schema"
import {
	ConflictError,
	ForbiddenError,
	NotFoundError,
	ValidationError,
} from "../lib/errors"
import { calendarRepository } from "../repositories/calendar.repository"
import { itemRepository } from "../repositories/item.repository"
import { shareRepository } from "../repositories/share.repository"
import { userRepository } from "../repositories/user.repository"
import type { SharedCalendarView, ShareInfo, ShareLink } from "../types"

export interface InviteInput {
	email: string
	permission?: "view" | "edit"
}

export const shareService = {
	async getShareLink(calendarId: string, userId: string): Promise<ShareLink> {
		const isOwner = await calendarRepository.isOwner(calendarId, userId)

		if (!isOwner) {
			throw new NotFoundError("Calendar")
		}

		const calendar = await calendarRepository.findById(calendarId)

		if (!calendar || !calendar.shareToken) {
			throw new NotFoundError("Calendar")
		}

		return {
			shareToken: calendar.shareToken,
			shareUrl: `/share/${calendar.shareToken}`,
		}
	},

	async inviteByEmail(
		calendarId: string,
		ownerId: string,
		input: InviteInput,
	): Promise<{ share: CalendarShare; isNew: boolean }> {
		const isOwner = await calendarRepository.isOwner(calendarId, ownerId)

		if (!isOwner) {
			throw new NotFoundError("Calendar")
		}

		const invitedUser = await userRepository.findByEmail(input.email)

		if (!invitedUser) {
			throw new NotFoundError("User not found. They need to register first.")
		}

		if (invitedUser.id === ownerId) {
			throw new ValidationError("You cannot invite yourself")
		}

		const existingShare = await shareRepository.findByCalendarAndUser(
			calendarId,
			invitedUser.id,
		)

		const permission = input.permission ?? "view"

		if (existingShare) {
			if (existingShare.permission !== permission) {
				const updated = await shareRepository.updatePermission(
					existingShare.id,
					permission,
				)
				return { share: updated, isNew: false }
			}

			return { share: existingShare, isNew: false }
		}

		const share = await shareRepository.create({
			calendarId,
			userId: invitedUser.id,
			permission,
		})

		return { share, isNew: true }
	},

	async listShares(calendarId: string, userId: string): Promise<ShareInfo[]> {
		const isOwner = await calendarRepository.isOwner(calendarId, userId)

		if (!isOwner) {
			throw new NotFoundError("Calendar")
		}

		return await shareRepository.listByCalendar(calendarId)
	},

	async updatePermission(
		shareId: string,
		userId: string,
		permission: "view" | "edit",
	): Promise<CalendarShare> {
		const shareWithCalendar =
			await shareRepository.findByIdWithCalendar(shareId)

		if (!shareWithCalendar) {
			throw new NotFoundError("Share")
		}

		if (shareWithCalendar.calendar.ownerId !== userId) {
			throw new ForbiddenError("Only the calendar owner can modify shares")
		}

		return await shareRepository.updatePermission(shareId, permission)
	},

	async removeShare(shareId: string, userId: string): Promise<void> {
		const shareWithCalendar =
			await shareRepository.findByIdWithCalendar(shareId)

		if (!shareWithCalendar) {
			throw new NotFoundError("Share")
		}

		const isOwner = shareWithCalendar.calendar.ownerId === userId
		const isSelf = shareWithCalendar.share.userId === userId

		if (!isOwner && !isSelf) {
			throw new ForbiddenError("You don't have permission to remove this share")
		}

		await shareRepository.delete(shareId)
	},

	async viewByToken(
		token: string,
		viewerId?: string,
	): Promise<SharedCalendarView> {
		const calendar = await calendarRepository.findByShareToken(token)

		if (!calendar) {
			throw new NotFoundError("Shared calendar")
		}

		const items = await itemRepository.findByCalendarId(calendar.id)

		let canEdit = false

		if (viewerId) {
			if (calendar.ownerId === viewerId) {
				canEdit = true
			} else {
				const share = await shareRepository.findByCalendarAndUser(
					calendar.id,
					viewerId,
				)
				canEdit = share?.permission === "edit"
			}
		}

		return {
			calendar: {
				id: calendar.id,
				name: calendar.name,
				destination: calendar.destination,
				startDate: calendar.startDate,
				endDate: calendar.endDate,
			},
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
			canEdit,
		}
	},

	async joinByToken(
		token: string,
		userId: string,
	): Promise<{ share: CalendarShare; isNew: boolean }> {
		const calendar = await calendarRepository.findByShareToken(token)

		if (!calendar) {
			throw new NotFoundError("Shared calendar")
		}

		if (calendar.ownerId === userId) {
			throw new ConflictError("This is your own calendar")
		}

		const existingShare = await shareRepository.findByCalendarAndUser(
			calendar.id,
			userId,
		)

		if (existingShare) {
			return { share: existingShare, isNew: false }
		}

		const share = await shareRepository.create({
			calendarId: calendar.id,
			userId,
			permission: "view",
		})

		return { share, isNew: true }
	},

	async hasAccess(
		calendarId: string,
		userId: string,
	): Promise<{ hasAccess: boolean; permission: "view" | "edit" | null }> {
		const share = await shareRepository.findByCalendarAndUser(
			calendarId,
			userId,
		)

		if (!share) {
			return { hasAccess: false, permission: null }
		}

		return { hasAccess: true, permission: share.permission }
	},
}

export type ShareService = typeof shareService
