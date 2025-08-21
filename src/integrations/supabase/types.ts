export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      /** Tabla de sesiones / actividades de terapia */
      sessions: {
        Row: {
          id: string;
          user_id: string;
          therapy_type: string;
          start_time: string;
          duration: number;
          state: string;
          score: number;
          orange_used: number;
          juice_used: number;
          stats: Json;
          details: Json;
          extra_data: Json;
        };
        Insert: {
          id?: string;
          user_id: string;
          therapy_type: string;
          start_time?: string;
          duration: number;
          state?: string;
          score?: number;
          orange_used?: number;
          juice_used?: number;
          stats?: Json;
          details?: Json;
          extra_data?: Json;
        };
        Update: Partial<{
          id: string;
          user_id: string;
          therapy_type: string;
          start_time: string;
          duration: number;
          state: string;
          score: number;
          orange_used: number;
          juice_used: number;
          stats: Json;
          details: Json;
          extra_data: Json;
        }>;
        Relationships: [
          {
            foreignKeyName: "sessions_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };

      /** Tabla de ranking de juegos */
      rankings: {
        Row: {
          id: string;
          user_id: string;
          game_type: string;
          score: number;
          position: number | null;
          details: Json | null;
          created_at: string;
          calculated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          game_type: string;
          score: number;
          position?: number | null;
          details?: Json | null;
          created_at?: string;
          calculated_at?: string;
        };
        Update: Partial<{
          id: string;
          user_id: string;
          game_type: string;
          score: number;
          position: number | null;
          details: Json | null;
          created_at: string;
          calculated_at: string;
        }>;
        Relationships: [];
      };

      /** Tabla de perfiles de usuario */
      profiles: {
        Row: {
          id: string;
          user_id: string;
          display_name: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          display_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<{
          id: string;
          user_id: string;
          display_name: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        }>;
        Relationships: [];
      };

      /** Tabla de configuraciones de juego */
      game_settings: {
        Row: {
          id: string;
          user_id: string;
          configuracion_inicio: Json | null;
          enemy_speed: number;
          espacio_pilares_flappy: number;
          intervalo_disparo_ms: number;
          modo_oscuro: boolean;
          numero_base_enemigos: number;
          player_shot_speed: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          configuracion_inicio?: Json | null;
          enemy_speed: number;
          espacio_pilares_flappy: number;
          intervalo_disparo_ms: number;
          modo_oscuro: boolean;
          numero_base_enemigos: number;
          player_shot_speed: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<{
          id: string;
          user_id: string;
          configuracion_inicio: Json | null;
          enemy_speed: number;
          espacio_pilares_flappy: number;
          intervalo_disparo_ms: number;
          modo_oscuro: boolean;
          numero_base_enemigos: number;
          player_shot_speed: number;
          created_at: string;
          updated_at: string;
        }>;
        Relationships: [];
      };
    };
    Views: {};
    Functions: {};
    Enums: {};
    CompositeTypes: {};
  };
};
