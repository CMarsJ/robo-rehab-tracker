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
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      game_settings: {
        Row: {
          configuracion_inicio: Json | null
          created_at: string
          enemy_speed: number
          espacio_pilares_flappy: number
          id: string
          intervalo_disparo_ms: number
          modo_oscuro: boolean
          numero_base_enemigos: number
          player_shot_speed: number
          updated_at: string
          user_id: string
        }
        Insert: {
          configuracion_inicio?: Json | null
          created_at?: string
          enemy_speed?: number
          espacio_pilares_flappy?: number
          id?: string
          intervalo_disparo_ms?: number
          modo_oscuro?: boolean
          numero_base_enemigos?: number
          player_shot_speed?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          configuracion_inicio?: Json | null
          created_at?: string
          enemy_speed?: number
          espacio_pilares_flappy?: number
          id?: string
          intervalo_disparo_ms?: number
          modo_oscuro?: boolean
          numero_base_enemigos?: number
          player_shot_speed?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      "Non-Paretical_Hand_Data": {
        Row: {
          An_DIP_D: number | null
          An_MCP_D: number | null
          An_MCP_F: number | null
          An_PIP_F: number | null
          id: number
          Update_Time: string
          user_id: string | null
        }
        Insert: {
          An_DIP_D?: number | null
          An_MCP_D?: number | null
          An_MCP_F?: number | null
          An_PIP_F?: number | null
          id?: number
          Update_Time?: string
          user_id?: string | null
        }
        Update: {
          An_DIP_D?: number | null
          An_MCP_D?: number | null
          An_MCP_F?: number | null
          An_PIP_F?: number | null
          id?: number
          Update_Time?: string
          user_id?: string | null
        }
        Relationships: []
      }
      Paretical_Hand_Data_duplicate: {
        Row: {
          An_DIP_D: number | null
          An_MCP_D: number | null
          An_MCP_F: number | null
          An_PIP_F: number | null
          id: number
          Update_Time: string
          user_id: string | null
        }
        Insert: {
          An_DIP_D?: number | null
          An_MCP_D?: number | null
          An_MCP_F?: number | null
          An_PIP_F?: number | null
          id?: number
          Update_Time?: string
          user_id?: string | null
        }
        Update: {
          An_DIP_D?: number | null
          An_MCP_D?: number | null
          An_MCP_F?: number | null
          An_PIP_F?: number | null
          id?: number
          Update_Time?: string
          user_id?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          patient_age: number | null
          therapist_name: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          patient_age?: number | null
          therapist_name?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          patient_age?: number | null
          therapist_name?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      rankings_orabge_squeeze: {
        Row: {
          juice_used: number
          orange_used: number
          position: number
          start_time: string | null
          therapy_type: string | null
          time_orange: number
          user_id: string | null
        }
        Insert: {
          juice_used?: number
          orange_used?: number
          position: number
          start_time?: string | null
          therapy_type?: string | null
          time_orange?: number
          user_id?: string | null
        }
        Update: {
          juice_used?: number
          orange_used?: number
          position?: number
          start_time?: string | null
          therapy_type?: string | null
          time_orange?: number
          user_id?: string | null
        }
        Relationships: []
      }
      sessions: {
        Row: {
          details: Json | null
          duration: number
          extra_date: Json | null
          id: string
          juice_used: number | null
          orange_used: number | null
          score: number | null
          start_time: string | null
          state: string
          stats: Json | null
          therapy_type: string
          user_id: string
        }
        Insert: {
          details?: Json | null
          duration: number
          extra_date?: Json | null
          id?: string
          juice_used?: number | null
          orange_used?: number | null
          score?: number | null
          start_time?: string | null
          state?: string
          stats?: Json | null
          therapy_type: string
          user_id: string
        }
        Update: {
          details?: Json | null
          duration?: number
          extra_date?: Json | null
          id?: string
          juice_used?: number | null
          orange_used?: number | null
          score?: number | null
          start_time?: string | null
          state?: string
          stats?: Json | null
          therapy_type?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      rebuild_rankings_force: { Args: never; Returns: undefined }
      rebuild_rankings_force_positions: { Args: never; Returns: undefined }
      update_rankings: { Args: never; Returns: undefined }
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
