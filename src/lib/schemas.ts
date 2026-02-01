/**
 * Validation Schemas
 *
 * Zod schemas for request validation across the application.
 * Each schema validates input data and provides typed inference.
 */

import { z } from "zod"

const dateRegex = /^\d{4}-\d{2}-\d{2}$/
const timeRegex = /^\d{2}:\d{2}(:\d{2})?$/

export const registerSchema = z.object({
	email: z.email("Invalid email address"),
	password: z.string().min(8, "Password must be at least 8 characters"),
	name: z.string().min(1, "Name is required").max(255),
})

export const loginSchema = z.object({
	email: z.email("Invalid email address"),
	password: z.string().min(1, "Password is required"),
})

export const createCalendarSchema = z
	.object({
		name: z.string().min(1, "Name is required").max(255),
		destination: z.string().max(255).optional(),
		startDate: z.string().regex(dateRegex, "Invalid date format (YYYY-MM-DD)"),
		endDate: z.string().regex(dateRegex, "Invalid date format (YYYY-MM-DD)"),
	})
	.refine((data) => new Date(data.startDate) <= new Date(data.endDate), {
		message: "End date must be after or equal to start date",
	})

export const updateCalendarSchema = z.object({
	name: z.string().min(1).max(255).optional(),
	destination: z.string().max(255).optional().nullable(),
	startDate: z.string().regex(dateRegex).optional(),
	endDate: z.string().regex(dateRegex).optional(),
})

export const categorySchema = z.enum([
	"activity",
	"transport",
	"food",
	"lodging",
	"other",
])

export const createItemSchema = z.object({
	startDate: z.string().regex(dateRegex, "Invalid date format (YYYY-MM-DD)"),
	endDate: z
		.string()
		.regex(dateRegex, "Invalid date format (YYYY-MM-DD)")
		.optional(),
	title: z.string().min(1, "Title is required").max(255),
	description: z.string().optional(),
	startTime: z
		.string()
		.regex(timeRegex, "Invalid time format (HH:MM)")
		.optional(),
	endTime: z
		.string()
		.regex(timeRegex, "Invalid time format (HH:MM)")
		.optional(),
	location: z.string().max(255).optional(),
	category: categorySchema.optional().default("other"),
	checklistId: z.uuid().optional().nullable(),
	orderIndex: z.number().int().optional(),
})

export const createItemSchemaWithinRange = (
	startDate: string,
	endDate: string,
) =>
	createItemSchema.superRefine((val, ctx) => {
		if (val.startDate < startDate || val.startDate > endDate) {
			ctx.addIssue({
				code: "invalid_value",
				path: ["startDate"],
				message: `Start date must be between ${startDate} and ${endDate}`,
				values: [val.startDate],
			})
		}
		if (val.endDate && (val.endDate < val.startDate || val.endDate > endDate)) {
			ctx.addIssue({
				code: "invalid_value",
				path: ["endDate"],
				message: `End date must be between ${val.startDate} and ${endDate}`,
				values: [val.endDate],
			})
		}
	})

export const updateItemSchema = z.object({
	startDate: z.string().regex(dateRegex).optional(),
	endDate: z.string().regex(dateRegex).optional(),
	title: z.string().min(1).max(255).optional(),
	description: z.string().optional().nullable(),
	startTime: z.string().regex(timeRegex).optional().nullable(),
	endTime: z.string().regex(timeRegex).optional().nullable(),
	location: z.string().max(255).optional().nullable(),
	category: categorySchema.optional(),
	checklistId: z.uuid().optional().nullable(),
	orderIndex: z.number().int().optional(),
})

export const reorderItemsSchema = z.object({
	items: z.array(
		z.object({
			id: z.uuid(),
			orderIndex: z.number().int(),
		}),
	),
})

export const permissionSchema = z.enum(["view", "edit"])

export const inviteSchema = z.object({
	email: z.email("Invalid email address"),
	permission: permissionSchema.optional().default("view"),
})

export const updateShareSchema = z.object({
	permission: permissionSchema,
})

export const checklistItemSchema = z.object({
	text: z.string().min(1),
	checked: z.boolean().default(false),
	affiliateLink: z.url().optional().nullable(),
})

export const createChecklistSchema = z.object({
	title: z.string().min(1, "Title is required").max(255),
	items: z.array(checklistItemSchema).optional().default([]),
	aiGenerated: z.boolean().optional().default(false),
})

export const updateChecklistSchema = z.object({
	title: z.string().min(1).max(255).optional(),
	items: z.array(checklistItemSchema).optional(),
})

export const generateChecklistSchema = z.object({
	destination: z.string().min(1, "Destination is required"),
	startDate: z.string().regex(dateRegex),
	endDate: z.string().regex(dateRegex),
	activities: z.array(z.string()).optional().default([]),
	calendarId: z.uuid().optional(),
})

export const recommendActivitiesSchema = z.object({
	destination: z.string().min(1, "Destination is required"),
	startDate: z.string().regex(dateRegex).optional(),
	interests: z.array(z.string()).optional().default([]),
	limit: z.number().int().min(1).max(20).optional().default(5),
})

export const weatherQuerySchema = z.object({
	location: z.string().min(1, "Location is required"),
	startDate: z.string().regex(dateRegex).optional(),
})

// Type exports
export type RegisterInput = z.infer<typeof registerSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type CreateCalendarInput = z.infer<typeof createCalendarSchema>
export type UpdateCalendarInput = z.infer<typeof updateCalendarSchema>
export type CreateItemInput = z.infer<typeof createItemSchema>
export type UpdateItemInput = z.infer<typeof updateItemSchema>
export type ReorderItemsInput = z.infer<typeof reorderItemsSchema>
export type InviteInput = z.infer<typeof inviteSchema>
export type UpdateShareInput = z.infer<typeof updateShareSchema>
export type CreateChecklistInput = z.infer<typeof createChecklistSchema>
export type UpdateChecklistInput = z.infer<typeof updateChecklistSchema>
export type GenerateChecklistInput = z.infer<typeof generateChecklistSchema>
export type RecommendActivitiesInput = z.infer<typeof recommendActivitiesSchema>
export type WeatherQueryInput = z.infer<typeof weatherQuerySchema>
