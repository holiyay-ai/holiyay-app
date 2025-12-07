/**
 * Service Barrel Exports
 *
 * Services contain business logic and orchestrate between repositories
 * and external providers. Routes should only call services, never
 * repositories or external clients directly.
 */

export type {
	AIService,
	DestinationPreferences,
	GenerateChecklistInput,
	RecommendActivitiesInput,
} from "./ai.service"
export { aiService } from "./ai.service"
export type { AuthService, LoginInput, RegisterInput } from "./auth.service"
export { authService } from "./auth.service"
export type {
	CalendarService,
	CreateCalendarInput,
	UpdateCalendarInput,
} from "./calendar.service"
export { calendarService } from "./calendar.service"
export type {
	CreateItemInput,
	ItemService,
	ReorderItemInput,
	UpdateItemInput,
} from "./item.service"
export { itemService } from "./item.service"
export type { InviteInput, ShareService } from "./share.service"
export { shareService } from "./share.service"
