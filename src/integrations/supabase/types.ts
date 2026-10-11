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
      active_sessions: {
        Row: {
          completed_exercises: Json | null
          current_day_index: number | null
          id: string
          started_at: string | null
          template_id: string | null
          updated_at: string | null
          user_id: string
          workout_data: Json
        }
        Insert: {
          completed_exercises?: Json | null
          current_day_index?: number | null
          id?: string
          started_at?: string | null
          template_id?: string | null
          updated_at?: string | null
          user_id: string
          workout_data: Json
        }
        Update: {
          completed_exercises?: Json | null
          current_day_index?: number | null
          id?: string
          started_at?: string | null
          template_id?: string | null
          updated_at?: string | null
          user_id?: string
          workout_data?: Json
        }
        Relationships: [
          {
            foreignKeyName: "active_sessions_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "workout_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      body_measurements: {
        Row: {
          body_fat_percentage: number | null
          created_at: string | null
          height: number | null
          id: string
          measured_at: string
          muscle_mass: number | null
          notes: string | null
          user_id: string
          waist_cm: number | null
          weight: number | null
        }
        Insert: {
          body_fat_percentage?: number | null
          created_at?: string | null
          height?: number | null
          id?: string
          measured_at?: string
          muscle_mass?: number | null
          notes?: string | null
          user_id: string
          waist_cm?: number | null
          weight?: number | null
        }
        Update: {
          body_fat_percentage?: number | null
          created_at?: string | null
          height?: number | null
          id?: string
          measured_at?: string
          muscle_mass?: number | null
          notes?: string | null
          user_id?: string
          waist_cm?: number | null
          weight?: number | null
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          room: string
          user_id: string
          user_name: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          room: string
          user_id: string
          user_name?: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          room?: string
          user_id?: string
          user_name?: string
        }
        Relationships: []
      }
      direct_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          read: boolean
          receiver_id: string
          sender_id: string
          sender_name: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          read?: boolean
          receiver_id: string
          sender_id: string
          sender_name?: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          read?: boolean
          receiver_id?: string
          sender_id?: string
          sender_name?: string
        }
        Relationships: []
      }
      exercise_logs: {
        Row: {
          duration_seconds: number | null
          exercise_name: string
          id: string
          logged_at: string | null
          muscle_group: string | null
          reps: number | null
          set_number: number
          user_id: string
          weight_kg: number | null
          workout_id: string
        }
        Insert: {
          duration_seconds?: number | null
          exercise_name: string
          id?: string
          logged_at?: string | null
          muscle_group?: string | null
          reps?: number | null
          set_number: number
          user_id: string
          weight_kg?: number | null
          workout_id: string
        }
        Update: {
          duration_seconds?: number | null
          exercise_name?: string
          id?: string
          logged_at?: string | null
          muscle_group?: string | null
          reps?: number | null
          set_number?: number
          user_id?: string
          weight_kg?: number | null
          workout_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "exercise_logs_workout_id_fkey"
            columns: ["workout_id"]
            isOneToOne: false
            referencedRelation: "workouts"
            referencedColumns: ["id"]
          },
        ]
      }
      followers: {
        Row: {
          created_at: string
          follower_id: string
          following_id: string
          id: string
        }
        Insert: {
          created_at?: string
          follower_id: string
          following_id: string
          id?: string
        }
        Update: {
          created_at?: string
          follower_id?: string
          following_id?: string
          id?: string
        }
        Relationships: []
      }
      gyms: {
        Row: {
          access_password: string
          admin_id: string | null
          created_at: string | null
          description: string | null
          id: string
          is_verified: boolean
          location_city: string | null
          name: string
        }
        Insert: {
          access_password: string
          admin_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_verified?: boolean
          location_city?: string | null
          name: string
        }
        Update: {
          access_password?: string
          admin_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_verified?: boolean
          location_city?: string | null
          name?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          body_fat_percentage: number | null
          created_at: string
          daily_quiz_done: boolean | null
          date_of_birth: string | null
          email: string
          gender: string | null
          goal: string | null
          gym_id: string | null
          gym_name: string | null
          height: number | null
          id: string
          last_activity_date: string | null
          level: string | null
          name: string
          onboarded: boolean
          primary_muscle: string | null
          rank: string
          streak: number
          target_weight: number | null
          updated_at: string
          user_id: string
          weight: number | null
          xp: number
          suspended: boolean
        }
        Insert: {
          avatar_url?: string | null
          body_fat_percentage?: number | null
          created_at?: string
          daily_quiz_done?: boolean | null
          date_of_birth?: string | null
          email?: string
          gender?: string | null
          goal?: string | null
          gym_id?: string | null
          gym_name?: string | null
          height?: number | null
          id?: string
          last_activity_date?: string | null
          level?: string | null
          name?: string
          onboarded?: boolean
          primary_muscle?: string | null
          rank?: string
          streak?: number
          target_weight?: number | null
          updated_at?: string
          user_id: string
          weight?: number | null
          xp?: number
          suspended?: boolean
        }
        Update: {
          avatar_url?: string | null
          body_fat_percentage?: number | null
          created_at?: string
          daily_quiz_done?: boolean | null
          date_of_birth?: string | null
          email?: string
          gender?: string | null
          goal?: string | null
          gym_id?: string | null
          gym_name?: string | null
          height?: number | null
          id?: string
          last_activity_date?: string | null
          level?: string | null
          name?: string
          onboarded?: boolean
          primary_muscle?: string | null
          rank?: string
          streak?: number
          target_weight?: number | null
          updated_at?: string
          user_id?: string
          weight?: number | null
          xp?: number
          suspended?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "profiles_gym_id_fkey"
            columns: ["gym_id"]
            isOneToOne: false
            referencedRelation: "gyms"
            referencedColumns: ["id"]
          },
        ]
      }
      site_reviews: {
        Row: {
          comment: string
          created_at: string | null
          id: string
          rating: number
          user_id: string
        }
        Insert: {
          comment: string
          created_at?: string | null
          id?: string
          rating: number
          user_id: string
        }
        Update: {
          comment?: string
          created_at?: string | null
          id?: string
          rating?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "site_reviews_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      system_logs: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          id: string
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          id?: string
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          id?: string
          user_id?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      workout_templates: {
        Row: {
          created_at: string
          days: Json
          goal: string | null
          id: string
          level: string | null
          source: string
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          days?: Json
          goal?: string | null
          id?: string
          level?: string | null
          source?: string
          title: string
          user_id: string
        }
        Update: {
          created_at?: string
          days?: Json
          goal?: string | null
          id?: string
          level?: string | null
          source?: string
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      workouts: {
        Row: {
          ai_analysis: string | null
          calories: number
          created_at: string
          duration: number
          exercises: Json | null
          id: string
          raw_input_url: string | null
          type: string
          user_id: string
          workout_date: string
        }
        Insert: {
          ai_analysis?: string | null
          calories?: number
          created_at?: string
          duration?: number
          exercises?: Json | null
          id?: string
          raw_input_url?: string | null
          type: string
          user_id: string
          workout_date?: string
        }
        Update: {
          ai_analysis?: string | null
          calories?: number
          created_at?: string
          duration?: number
          exercises?: Json | null
          id?: string
          raw_input_url?: string | null
          type?: string
          user_id?: string
          workout_date?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_xp: {
        Args: { user_id: string; xp_to_add: number }
        Returns: undefined
      }
      weekly_leaderboard: {
        Args: { week_start?: string }
        Returns: {
          level: string
          name: string
          rank: string
          streak: number
          user_id: string
          weekly_xp: number
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "user" | "gym_admin" | "super_admin"
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
    Enums: {
      app_role: ["admin", "user", "gym_admin", "super_admin"],
    },
  },
} as const
