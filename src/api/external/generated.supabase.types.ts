export type Json =
	| string
	| number
	| boolean
	| null
	| { [key: string]: Json | undefined }
	| Json[]

export type Database = {
	// Allows to automatically instantiate createClient with right options
	// instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
	__InternalSupabase: {
		PostgrestVersion: "13.0.5"
	}
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
					calendar_id?: string
					id?: string
					invited_at?: string
					permission?: string
					user_id?: string
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
						foreignKeyName: "calendar_shares_calender_id_fkey"
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
				}
				Insert: {
					created_at?: string
					destination?: string | null
					end_date: string
					id?: string
					name: string
					owner_id?: string
					share_token?: string | null
					start_date: string
					updated_at?: string
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
					checklist_id: string | null
					calendar_id: string
					category: string
					created_at: string
					date: string
					description: string | null
					end_time: string | null
					id: string
					location: string | null
					order_index: number
					start_time: string | null
					title: string
					updated_at: string
				}
				Insert: {
					checklist_id?: string | null
					calendar_id: string
					category?: string
					created_at?: string
					date: string
					description?: string | null
					end_time?: string | null
					id?: string
					location?: string | null
					order_index?: number
					start_time?: string | null
					title: string
					updated_at?: string
				}
				Update: {
					checklist_id?: string | null
					calendar_id?: string
					category?: string
					created_at?: string
					date?: string
					description?: string | null
					end_time?: string | null
					id?: string
					location?: string | null
					order_index?: number
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
			kv_store_19b903d7: {
				Row: {
					key: string
					value: Json
				}
				Insert: {
					key: string
					value: Json
				}
				Update: {
					key?: string
					value?: Json
				}
				Relationships: []
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

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
	DefaultSchemaTableNameOrOptions extends
		| keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
		| { schema: keyof DatabaseWithoutInternals },
	TableName extends DefaultSchemaTableNameOrOptions extends {
		schema: keyof DatabaseWithoutInternals
	}
		? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
				DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
		: never = never,
> = DefaultSchemaTableNameOrOptions extends {
	schema: keyof DatabaseWithoutInternals
}
	? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
			DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
			Row: infer R
		}
		? R
		: never
	: DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
				DefaultSchema["Views"])
		? (DefaultSchema["Tables"] &
				DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
				Row: infer R
			}
			? R
			: never
		: never

export type TablesInsert<
	DefaultSchemaTableNameOrOptions extends
		| keyof DefaultSchema["Tables"]
		| { schema: keyof DatabaseWithoutInternals },
	TableName extends DefaultSchemaTableNameOrOptions extends {
		schema: keyof DatabaseWithoutInternals
	}
		? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
		: never = never,
> = DefaultSchemaTableNameOrOptions extends {
	schema: keyof DatabaseWithoutInternals
}
	? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
			Insert: infer I
		}
		? I
		: never
	: DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
		? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
				Insert: infer I
			}
			? I
			: never
		: never

export type TablesUpdate<
	DefaultSchemaTableNameOrOptions extends
		| keyof DefaultSchema["Tables"]
		| { schema: keyof DatabaseWithoutInternals },
	TableName extends DefaultSchemaTableNameOrOptions extends {
		schema: keyof DatabaseWithoutInternals
	}
		? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
		: never = never,
> = DefaultSchemaTableNameOrOptions extends {
	schema: keyof DatabaseWithoutInternals
}
	? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
			Update: infer U
		}
		? U
		: never
	: DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
		? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
				Update: infer U
			}
			? U
			: never
		: never

export type Enums<
	DefaultSchemaEnumNameOrOptions extends
		| keyof DefaultSchema["Enums"]
		| { schema: keyof DatabaseWithoutInternals },
	EnumName extends DefaultSchemaEnumNameOrOptions extends {
		schema: keyof DatabaseWithoutInternals
	}
		? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
		: never = never,
> = DefaultSchemaEnumNameOrOptions extends {
	schema: keyof DatabaseWithoutInternals
}
	? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
	: DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
		? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
		: never

export type CompositeTypes<
	PublicCompositeTypeNameOrOptions extends
		| keyof DefaultSchema["CompositeTypes"]
		| { schema: keyof DatabaseWithoutInternals },
	CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
		schema: keyof DatabaseWithoutInternals
	}
		? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
		: never = never,
> = PublicCompositeTypeNameOrOptions extends {
	schema: keyof DatabaseWithoutInternals
}
	? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
	: PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
		? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
		: never

export const Constants = {
	public: {
		Enums: {},
	},
} as const
