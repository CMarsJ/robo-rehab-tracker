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
      achievements: {
        Row: {
          best_closing_time_ms: number | null
          best_opening_time_ms: number | null
          created_at: string
          id: string
          period_end: string
          period_start: string
          period_type: string
          sessions_completed: number
          sessions_target: number
          streak_days: number
          total_duration_minutes: number
          total_repetitions: number
          updated_at: string
          user_id: string
        }
        Insert: {
          best_closing_time_ms?: number | null
          best_opening_time_ms?: number | null
          created_at?: string
          id?: string
          period_end: string
          period_start: string
          period_type: string
          sessions_completed?: number
          sessions_target?: number
          streak_days?: number
          total_duration_minutes?: number
          total_repetitions?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          best_closing_time_ms?: number | null
          best_opening_time_ms?: number | null
          created_at?: string
          id?: string
          period_end?: string
          period_start?: string
          period_type?: string
          sessions_completed?: number
          sessions_target?: number
          streak_days?: number
          total_duration_minutes?: number
          total_repetitions?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
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
      rankings_flappy_bird: {
        Row: {
          duration: number
          game_type: string | null
          points_per_minute: number
          position: number
          score: number
          start_time: string | null
          user_id: string | null
        }
        Insert: {
          duration?: number
          game_type?: string | null
          points_per_minute?: number
          position: number
          score?: number
          start_time?: string | null
          user_id?: string | null
        }
        Update: {
          duration?: number
          game_type?: string | null
          points_per_minute?: number
          position?: number
          score?: number
          start_time?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      rankings_neurolink: {
        Row: {
          duration: number
          game_type: string | null
          points_per_second: number
          position: number
          score: number
          start_time: string | null
          user_id: string | null
        }
        Insert: {
          duration?: number
          game_type?: string | null
          points_per_second?: number
          position: number
          score?: number
          start_time?: string | null
          user_id?: string | null
        }
        Update: {
          duration?: number
          game_type?: string | null
          points_per_second?: number
          position?: number
          score?: number
          start_time?: string | null
          user_id?: string | null
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
      session_ble_chunks: {
        Row: {
          chunk_index: number
          created_at: string
          data: Json
          id: string
          session_id: string
        }
        Insert: {
          chunk_index: number
          created_at?: string
          data?: Json
          id?: string
          session_id: string
        }
        Update: {
          chunk_index?: number
          created_at?: string
          data?: Json
          id?: string
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_ble_chunks_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
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
      rebuild_rankings_flappy_bird: { Args: never; Returns: undefined }
      rebuild_rankings_force: { Args: never; Returns: undefined }
      rebuild_rankings_force_positions: { Args: never; Returns: undefined }
      rebuild_rankings_neurolink: { Args: never; Returns: undefined }
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
