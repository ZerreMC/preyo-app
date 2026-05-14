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
        PostgrestVersion: "14.1"
    }
    public: {
        Tables: {
            list_invite_tokens: {
                Row: {
                    created_at: string
                    created_by: string
                    expires_at: string
                    list_id: string
                    role: string
                    token: string
                    used_at: string | null
                    used_by: string | null
                }
                Insert: {
                    created_at?: string
                    created_by: string
                    expires_at?: string
                    list_id: string
                    role?: string
                    token?: string
                    used_at?: string | null
                    used_by?: string | null
                }
                Update: {
                    created_at?: string
                    created_by?: string
                    expires_at?: string
                    list_id?: string
                    role?: string
                    token?: string
                    used_at?: string | null
                    used_by?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "list_invite_tokens_list_id_fkey"
                        columns: ["list_id"]
                        isOneToOne: false
                        referencedRelation: "shopping_lists"
                        referencedColumns: ["id"]
                    },
                ]
            }
            profiles: {
                Row: {
                    avatar_url: string | null
                    created_at: string
                    display_name: string
                    id: string
                    onboarding_done: boolean
                    updated_at: string
                }
                Insert: {
                    avatar_url?: string | null
                    created_at?: string
                    display_name?: string
                    id: string
                    onboarding_done?: boolean
                    updated_at?: string
                }
                Update: {
                    avatar_url?: string | null
                    created_at?: string
                    display_name?: string
                    id?: string
                    onboarding_done?: boolean
                    updated_at?: string
                }
                Relationships: []
            }
            shopping_list_collaborators: {
                Row: {
                    can_invite: boolean
                    created_at: string | null
                    invited_by: string | null
                    joined_at: string
                    list_id: string
                    role: string
                    user_id: string
                }
                Insert: {
                    can_invite?: boolean
                    created_at?: string | null
                    invited_by?: string | null
                    joined_at?: string
                    list_id: string
                    role: string
                    user_id: string
                }
                Update: {
                    can_invite?: boolean
                    created_at?: string | null
                    invited_by?: string | null
                    joined_at?: string
                    list_id?: string
                    role?: string
                    user_id?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "shopping_list_collaborators_list_id_fkey"
                        columns: ["list_id"]
                        isOneToOne: false
                        referencedRelation: "shopping_lists"
                        referencedColumns: ["id"]
                    },
                ]
            }
            shopping_list_invites: {
                Row: {
                    can_invite: boolean
                    created_at: string
                    created_by: string
                    email: string | null
                    expires_at: string
                    id: string
                    list_id: string
                    revoked_at: string | null
                    role: string
                    token_hash: string
                    used_at: string | null
                }
                Insert: {
                    can_invite?: boolean
                    created_at?: string
                    created_by: string
                    email?: string | null
                    expires_at: string
                    id?: string
                    list_id: string
                    revoked_at?: string | null
                    role: string
                    token_hash: string
                    used_at?: string | null
                }
                Update: {
                    can_invite?: boolean
                    created_at?: string
                    created_by?: string
                    email?: string | null
                    expires_at?: string
                    id?: string
                    list_id?: string
                    revoked_at?: string | null
                    role?: string
                    token_hash?: string
                    used_at?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "shopping_list_invites_list_id_fkey"
                        columns: ["list_id"]
                        isOneToOne: false
                        referencedRelation: "shopping_lists"
                        referencedColumns: ["id"]
                    },
                ]
            }
            shopping_list_items: {
                Row: {
                    checked: boolean
                    created_at: string
                    estimated_weight_g: number
                    id: string
                    last_command_id: string | null
                    list_id: string
                    name: string
                    product_ref: string
                    quantity: string | null
                    updated_at: string
                }
                Insert: {
                    checked?: boolean
                    created_at?: string
                    estimated_weight_g: number
                    id: string
                    last_command_id?: string | null
                    list_id: string
                    name: string
                    product_ref: string
                    quantity?: string | null
                    updated_at?: string
                }
                Update: {
                    checked?: boolean
                    created_at?: string
                    estimated_weight_g?: number
                    id?: string
                    last_command_id?: string | null
                    list_id?: string
                    name?: string
                    product_ref?: string
                    quantity?: string | null
                    updated_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "shopping_list_items_list_id_fkey"
                        columns: ["list_id"]
                        isOneToOne: false
                        referencedRelation: "shopping_lists"
                        referencedColumns: ["id"]
                    },
                ]
            }
            shopping_lists: {
                Row: {
                    created_at: string
                    id: string
                    last_command_at: string | null
                    last_command_id: string | null
                    owner_id: string
                    status: Database["public"]["Enums"]["list_status"]
                    title: string
                    transport_capacity_g: number
                    updated_at: string
                }
                Insert: {
                    created_at?: string
                    id: string
                    last_command_at?: string | null
                    last_command_id?: string | null
                    owner_id: string
                    status?: Database["public"]["Enums"]["list_status"]
                    title: string
                    transport_capacity_g: number
                    updated_at?: string
                }
                Update: {
                    created_at?: string
                    id?: string
                    last_command_at?: string | null
                    last_command_id?: string | null
                    owner_id?: string
                    status?: Database["public"]["Enums"]["list_status"]
                    title?: string
                    transport_capacity_g?: number
                    updated_at?: string
                }
                Relationships: []
            }
            user_preferences: {
                Row: {
                    created_at: string
                    load_capacity: Database["public"]["Enums"]["load_capacity"] | null
                    main_goal: Database["public"]["Enums"]["main_goal"] | null
                    postal_code: string | null
                    preferred_store_names: string[]
                    transport_mode: Database["public"]["Enums"]["transport_mode"] | null
                    updated_at: string
                    user_id: string
                }
                Insert: {
                    created_at?: string
                    load_capacity?: Database["public"]["Enums"]["load_capacity"] | null
                    main_goal?: Database["public"]["Enums"]["main_goal"] | null
                    postal_code?: string | null
                    preferred_store_names?: string[]
                    transport_mode?: Database["public"]["Enums"]["transport_mode"] | null
                    updated_at?: string
                    user_id: string
                }
                Update: {
                    created_at?: string
                    load_capacity?: Database["public"]["Enums"]["load_capacity"] | null
                    main_goal?: Database["public"]["Enums"]["main_goal"] | null
                    postal_code?: string | null
                    preferred_store_names?: string[]
                    transport_mode?: Database["public"]["Enums"]["transport_mode"] | null
                    updated_at?: string
                    user_id?: string
                }
                Relationships: []
            }
        }
        Views: {
            [_ in never]: never
        }
        Functions: {
            cl_accept_invite: { Args: { p_token: string }; Returns: string }
            cl_add_collaborator_by_email: {
                Args: { p_email: string; p_list_id: string; p_role: string }
                Returns: undefined
            }
            cl_add_item: {
                Args: {
                    p_command_id: string
                    p_estimated_weight_g: number
                    p_item_id: string
                    p_list_id: string
                    p_name: string
                    p_product_ref: string
                    p_quantity: string
                }
                Returns: undefined
            }
            cl_change_status: {
                Args: {
                    p_command_id: string
                    p_list_id: string
                    p_next_status: Database["public"]["Enums"]["list_status"]
                }
                Returns: undefined
            }
            cl_create_list: {
                Args: {
                    p_command_id: string
                    p_list_id: string
                    p_title: string
                    p_transport_capacity_g: number
                }
                Returns: undefined
            }
            cl_delete_list: {
                Args: { p_command_id: string; p_list_id: string }
                Returns: undefined
            }
            cl_generate_invite_token: {
                Args: {
                    p_can_invite?: boolean
                    p_email?: string | null
                    p_list_id: string
                    p_role?: string
                }
                Returns: string
            }
            cl_remove_collaborator: {
                Args: { p_list_id: string; p_target_user_id: string }
                Returns: undefined
            }
            cl_revoke_invite: { Args: { p_invite_id: string }; Returns: undefined }
            cl_update_collaborator_invite_permission: {
                Args: {
                    p_can_invite: boolean
                    p_list_id: string
                    p_target_user_id: string
                }
                Returns: undefined
            }
            cl_remove_item: {
                Args: { p_command_id: string; p_item_id: string; p_list_id: string }
                Returns: undefined
            }
            cl_rename_list: {
                Args: { p_command_id: string; p_list_id: string; p_title: string }
                Returns: undefined
            }
            cl_toggle_item: {
                Args: {
                    p_checked: boolean
                    p_command_id: string
                    p_item_id: string
                    p_list_id: string
                }
                Returns: undefined
            }
        }
        Enums: {
            list_status: "draft" | "active" | "shopping" | "completed" | "archived"
            load_capacity: "low" | "medium" | "high"
            main_goal: "save_money" | "save_time" | "organize"
            transport_mode: "foot" | "car" | "public_transport"
        }
        CompositeTypes: {
            [_ in never]: never
        }
    }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
    DefaultSchemaTableNameOrOptions extends | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
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
    DefaultSchemaTableNameOrOptions extends | keyof DefaultSchema["Tables"]
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
    DefaultSchemaTableNameOrOptions extends | keyof DefaultSchema["Tables"]
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
    DefaultSchemaEnumNameOrOptions extends | keyof DefaultSchema["Enums"]
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
    PublicCompositeTypeNameOrOptions extends | keyof DefaultSchema["CompositeTypes"]
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
        Enums: {
            list_status: ["draft", "active", "shopping", "completed", "archived"],
            load_capacity: ["low", "medium", "high"],
            main_goal: ["save_money", "save_time", "organize"],
            transport_mode: ["foot", "car", "public_transport"],
        },
    },
} as const
