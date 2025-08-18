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
      game_records: {
        Row: {
          attempts_count: number | null
          average_oranges_per_minute: number | null
          avg_close_time: number | null
          avg_open_time: number | null
          best_close_time: number | null
          best_open_time: number | null
          close_times: number[] | null
          created_at: string
          game_type: string
          id: string
          open_times: number[] | null
          session_id: string
          total_glasses: number | null
          total_oranges: number | null
          user_id: string
        }
        Insert: {
          attempts_count?: number | null
          average_oranges_per_minute?: number | null
          avg_close_time?: number | null
          avg_open_time?: number | null
          best_close_time?: number | null
          best_open_time?: number | null
          close_times?: number[] | null
          created_at?: string
          game_type: string
          id?: string
          open_times?: number[] | null
          session_id: string
          total_glasses?: number | null
          total_oranges?: number | null
          user_id: string
        }
        Update: {
          attempts_count?: number | null
          average_oranges_per_minute?: number | null
          avg_close_time?: number | null
          avg_open_time?: number | null
          best_close_time?: number | null
          best_open_time?: number | null
          close_times?: number[] | null
          created_at?: string
          game_type?: string
          id?: string
          open_times?: number[] | null
          session_id?: string
          total_glasses?: number | null
          total_oranges?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "game_records_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
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
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      rankings: {
        Row: {
          calculated_at: string
          created_at: string
          details: Json | null
          game_type: string
          id: string
          position: number | null
          score: number
          user_id: string
        }
        Insert: {
          calculated_at?: string
          created_at?: string
          details?: Json | null
          game_type: string
          id?: string
          position?: number | null
          score: number
          user_id: string
        }
        Update: {
          calculated_at?: string
          created_at?: string
          details?: Json | null
          game_type?: string
          id?: string
          position?: number | null
          score?: number
          user_id?: string
        }
        Relationships: []
      }
      sessions: {
        Row: {
          created_at: string
          duracion_minutos: number
          estado: string
          fecha_inicio: string
          id: string
          metrics: Json | null
          notes: string | null
          tipo_actividad: string
          user_id: string
        }
        Insert: {
          created_at?: string
          duracion_minutos: number
          estado?: string
          fecha_inicio?: string
          id?: string
          metrics?: Json | null
          notes?: string | null
          tipo_actividad: string
          user_id: string
        }
        Update: {
          created_at?: string
          duracion_minutos?: number
          estado?: string
          fecha_inicio?: string
          id?: string
          metrics?: Json | null
          notes?: string | null
          tipo_actividad?: string
          user_id?: string
        }
        Relationships: []
      }
      therapy_records: {
        Row: {
          attempts_count: number | null
          avg_close_time: number | null
          avg_open_time: number | null
          best_close_time: number | null
          best_open_time: number | null
          close_times: number[] | null
          created_at: string
          effort_data: Json | null
          id: string
          open_times: number[] | null
          session_id: string | null
          user_id: string
        }
        Insert: {
          attempts_count?: number | null
          avg_close_time?: number | null
          avg_open_time?: number | null
          best_close_time?: number | null
          best_open_time?: number | null
          close_times?: number[] | null
          created_at?: string
          effort_data?: Json | null
          id?: string
          open_times?: number[] | null
          session_id?: string | null
          user_id: string
        }
        Update: {
          attempts_count?: number | null
          avg_close_time?: number | null
          avg_open_time?: number | null
          best_close_time?: number | null
          best_open_time?: number | null
          close_times?: number[] | null
          created_at?: string
          effort_data?: Json | null
          id?: string
          open_times?: number[] | null
          session_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "therapy_records_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
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
