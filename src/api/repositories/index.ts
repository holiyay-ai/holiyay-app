/**
 * Repository Barrel Exports
 *
 * Repositories handle all direct database access. Services should use
 * repositories instead of accessing the database directly. This ensures
 * consistent query patterns and makes testing easier.
 */

export type { CalendarAccess } from "./calendar.repository"
export { calendarRepository } from "./calendar.repository"
export type {
	ChecklistItem,
	UpdateChecklistData,
} from "./checklist.repository"
export { checklistRepository } from "./checklist.repository"
export type {
	ItemFilters,
	ItemRepository,
	ReorderItem,
} from "./item.repository"
export { itemRepository } from "./item.repository"
export type { ShareWithCalendar, ShareWithUser } from "./share.repository"
export { shareRepository } from "./share.repository"
export type {
	CreateUserData,
	UpdateUserData,
	UserRepository,
} from "./user.repository"
export { userRepository } from "./user.repository"
