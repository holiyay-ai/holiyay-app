/**
 * Database Schema
 *
 * Drizzle ORM schema definitions for PostgreSQL. Defines all tables, relations,
 * enums, and inferred TypeScript types. Tables use UUID primary keys with
 * automatic generation and cascade deletion for referential integrity.
 */

import { relations } from "drizzle-orm"
import {
	boolean,
	date,
	integer,
	jsonb,
	pgEnum,
	pgTable,
	text,
	time,
	timestamp,
	uuid,
	varchar,
} from "drizzle-orm/pg-core"

export const permissionEnum = pgEnum("permission", ["view", "edit"])
export const categoryEnum = pgEnum("category", [
	"activity",
	"transport",
	"food",
	"lodging",
	"other",
])

export const users = pgTable("users", {
	id: uuid("id").defaultRandom().primaryKey(),
	email: varchar("email", { length: 255 }).notNull().unique(),
	name: varchar("name", { length: 255 }).notNull(),
	passwordHash: text("password_hash").notNull(),
	avatarUrl: text("avatar_url"),
	createdAt: timestamp("created_at", { withTimezone: true })
		.defaultNow()
		.notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true })
		.defaultNow()
		.notNull(),
})

export const calendars = pgTable("calendars", {
	id: uuid("id").defaultRandom().primaryKey(),
	ownerId: uuid("owner_id")
		.notNull()
		.references(() => users.id, { onDelete: "cascade" }),
	name: varchar("name", { length: 255 }).notNull(),
	destination: varchar("destination", { length: 255 }),
	startDate: date("start_date").notNull(),
	endDate: date("end_date").notNull(),
	shareToken: uuid("share_token").defaultRandom().unique(),
	createdAt: timestamp("created_at", { withTimezone: true })
		.defaultNow()
		.notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true })
		.defaultNow()
		.notNull(),
})

export const calendarShares = pgTable("calendar_shares", {
	id: uuid("id").defaultRandom().primaryKey(),
	calendarId: uuid("calendar_id")
		.notNull()
		.references(() => calendars.id, { onDelete: "cascade" }),
	userId: uuid("user_id")
		.notNull()
		.references(() => users.id, { onDelete: "cascade" }),
	permission: permissionEnum("permission").notNull().default("view"),
	invitedAt: timestamp("invited_at", { withTimezone: true })
		.defaultNow()
		.notNull(),
})

export const items = pgTable("items", {
	id: uuid("id").defaultRandom().primaryKey(),
	calendarId: uuid("calendar_id")
		.notNull()
		.references(() => calendars.id, { onDelete: "cascade" }),
	date: date("date").notNull(),
	title: varchar("title", { length: 255 }).notNull(),
	description: text("description"),
	startTime: time("start_time"),
	endTime: time("end_time"),
	location: varchar("location", { length: 255 }),
	category: categoryEnum("category").notNull().default("other"),
	affiliateLink: text("affiliate_link"),
	orderIndex: integer("order_index").notNull().default(0),
	createdAt: timestamp("created_at", { withTimezone: true })
		.defaultNow()
		.notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true })
		.defaultNow()
		.notNull(),
})

export const checklists = pgTable("checklists", {
	id: uuid("id").defaultRandom().primaryKey(),
	calendarId: uuid("calendar_id")
		.notNull()
		.references(() => calendars.id, { onDelete: "cascade" }),
	title: varchar("title", { length: 255 }).notNull(),
	items: jsonb("items")
		.$type<{ text: string; checked: boolean }[]>()
		.notNull()
		.default([]),
	aiGenerated: boolean("ai_generated").notNull().default(false),
	createdAt: timestamp("created_at", { withTimezone: true })
		.defaultNow()
		.notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true })
		.defaultNow()
		.notNull(),
})

export const usersRelations = relations(users, ({ many }) => ({
	calendars: many(calendars),
	calendarShares: many(calendarShares),
}))

export const calendarsRelations = relations(calendars, ({ one, many }) => ({
	owner: one(users, {
		fields: [calendars.ownerId],
		references: [users.id],
	}),
	items: many(items),
	checklists: many(checklists),
	shares: many(calendarShares),
}))

export const calendarSharesRelations = relations(calendarShares, ({ one }) => ({
	calendar: one(calendars, {
		fields: [calendarShares.calendarId],
		references: [calendars.id],
	}),
	user: one(users, {
		fields: [calendarShares.userId],
		references: [users.id],
	}),
}))

export const itemsRelations = relations(items, ({ one }) => ({
	calendar: one(calendars, {
		fields: [items.calendarId],
		references: [calendars.id],
	}),
}))

export const checklistsRelations = relations(checklists, ({ one }) => ({
	calendar: one(calendars, {
		fields: [checklists.calendarId],
		references: [calendars.id],
	}),
}))

export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert

export type Calendar = typeof calendars.$inferSelect
export type NewCalendar = typeof calendars.$inferInsert

export type CalendarShare = typeof calendarShares.$inferSelect
export type NewCalendarShare = typeof calendarShares.$inferInsert

export type Item = typeof items.$inferSelect
export type NewItem = typeof items.$inferInsert

export type Checklist = typeof checklists.$inferSelect
export type NewChecklist = typeof checklists.$inferInsert
