/**
 * Supabase Database Types
 *
 * Generated types for the Supabase database schema.
 * This file provides type safety for all database operations.
 */

export type Json =
	| string
	| number
	| boolean
	| null
	| { [key: string]: Json | undefined }
	| Json[]

export type Database = {
	public: {
		Tables: {
			calendar_shares: {
				Row: {
					calendar_id: string
					id: string
					invited_at: string
					permission: string
					user_id: string
				}
				Insert: {
					calendar_id: string
					id?: string
					invited_at?: string
					permission?: string
					user_id: string
				}
				Update: {
					calendar_id?: string
					id?: string
					invited_at?: string
					permission?: string
					user_id?: string
				}
				Relationships: [
					{
						foreignKeyName: "calendar_shares_calendar_id_fkey"
						columns: ["calendar_id"]
						isOneToOne: false
						referencedRelation: "calendars"
						referencedColumns: ["id"]
					},
				]
			}
			calendars: {
				Row: {
					created_at: string
					destination: string | null
					end_date: string
					id: string
					name: string
					owner_id: string
					share_token: string | null
					start_date: string
					updated_at: string
					weather_details: Json | null
				}
				Insert: {
					created_at?: string
					destination?: string | null
					end_date: string
					id?: string
					name: string
					owner_id: string
					share_token?: string | null
					start_date: string
					updated_at?: string
					weather_details?: Json | null
				}
				Update: {
					created_at?: string
					destination?: string | null
					end_date?: string
					id?: string
					name?: string
					owner_id?: string
					share_token?: string | null
					start_date?: string
					updated_at?: string
					weather_details?: Json | null
				}
				Relationships: []
			}
			checklists: {
				Row: {
					ai_generated: boolean
					calendar_id: string
					created_at: string
					id: string
					items: Json
					title: string
					updated_at: string
				}
				Insert: {
					ai_generated?: boolean
					calendar_id: string
					created_at?: string
					id?: string
					items?: Json
					title: string
					updated_at?: string
				}
				Update: {
					ai_generated?: boolean
					calendar_id?: string
					created_at?: string
					id?: string
					items?: Json
					title?: string
					updated_at?: string
				}
				Relationships: [
					{
						foreignKeyName: "checklists_calendar_id_fkey"
						columns: ["calendar_id"]
						isOneToOne: false
						referencedRelation: "calendars"
						referencedColumns: ["id"]
					},
				]
			}
			items: {
				Row: {
					calendar_id: string
					category: string
					checklist_id: string | null
					created_at: string
					description: string | null
					end_date: string | null
					end_time: string | null
					id: string
					location: string | null
					order_index: number
					start_date: string
					start_time: string | null
					title: string
					updated_at: string
				}
				Insert: {
					calendar_id: string
					category?: string
					checklist_id?: string | null
					created_at?: string
					description?: string | null
					end_date?: string | null
					end_time?: string | null
					id?: string
					location?: string | null
					order_index?: number
					start_date: string
					start_time?: string | null
					title: string
					updated_at?: string
				}
				Update: {
					calendar_id?: string
					category?: string
					checklist_id?: string | null
					created_at?: string
					description?: string | null
					end_date?: string | null
					end_time?: string | null
					id?: string
					location?: string | null
					order_index?: number
					start_date?: string
					start_time?: string | null
					title?: string
					updated_at?: string
				}
				Relationships: [
					{
						foreignKeyName: "items_calendar_id_fkey"
						columns: ["calendar_id"]
						isOneToOne: false
						referencedRelation: "calendars"
						referencedColumns: ["id"]
					},
					{
						foreignKeyName: "items_checklist_id_fkey"
						columns: ["checklist_id"]
						isOneToOne: false
						referencedRelation: "checklists"
						referencedColumns: ["id"]
					},
				]
			}
		}
		Views: {
			[_ in never]: never
		}
		Functions: {
			[_ in never]: never
		}
		Enums: {
			[_ in never]: never
		}
		CompositeTypes: {
			[_ in never]: never
		}
	}
}

// Helper types for table operations
export type Tables<T extends keyof Database["public"]["Tables"]> =
	Database["public"]["Tables"][T]["Row"]

export type TablesInsert<T extends keyof Database["public"]["Tables"]> =
	Database["public"]["Tables"][T]["Insert"]

export type TablesUpdate<T extends keyof Database["public"]["Tables"]> =
	Database["public"]["Tables"][T]["Update"]

// Convenience type aliases for common table types
export type Calendar = Tables<"calendars">
export type CalendarInsert = TablesInsert<"calendars">
export type CalendarUpdate = TablesUpdate<"calendars">

export type CalendarShare = Tables<"calendar_shares">
export type CalendarShareInsert = TablesInsert<"calendar_shares">
export type CalendarShareUpdate = TablesUpdate<"calendar_shares">

export type Item = Tables<"items">
export type ItemInsert = TablesInsert<"items">
export type ItemUpdate = TablesUpdate<"items">

export type Checklist = Tables<"checklists">
export type ChecklistInsert = TablesInsert<"checklists">
export type ChecklistUpdate = TablesUpdate<"checklists">

// Permission and category types
export type Permission = "view" | "edit"
export type Category = "activity" | "transport" | "food" | "lodging" | "other"
