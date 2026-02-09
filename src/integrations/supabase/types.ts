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
      base_vocabulary: {
        Row: {
          audio_url: string | null
          category: string
          created_at: string
          definition: string | null
          difficulty: Database["public"]["Enums"]["difficulty_level"]
          example_sentence: string | null
          example_translation: string | null
          id: string
          pronunciation: string | null
          translation: string
          updated_at: string
          word: string
        }
        Insert: {
          audio_url?: string | null
          category?: string
          created_at?: string
          definition?: string | null
          difficulty?: Database["public"]["Enums"]["difficulty_level"]
          example_sentence?: string | null
          example_translation?: string | null
          id?: string
          pronunciation?: string | null
          translation: string
          updated_at?: string
          word: string
        }
        Update: {
          audio_url?: string | null
          category?: string
          created_at?: string
          definition?: string | null
          difficulty?: Database["public"]["Enums"]["difficulty_level"]
          example_sentence?: string | null
          example_translation?: string | null
          id?: string
          pronunciation?: string | null
          translation?: string
          updated_at?: string
          word?: string
        }
        Relationships: []
      }
      flashcard_reviews: {
        Row: {
          ease_factor_after: number
          ease_factor_before: number
          flashcard_id: string
          id: string
          interval_after: number
          interval_before: number
          quality: number
          reviewed_at: string
          user_id: string
        }
        Insert: {
          ease_factor_after: number
          ease_factor_before: number
          flashcard_id: string
          id?: string
          interval_after: number
          interval_before: number
          quality: number
          reviewed_at?: string
          user_id: string
        }
        Update: {
          ease_factor_after?: number
          ease_factor_before?: number
          flashcard_id?: string
          id?: string
          interval_after?: number
          interval_before?: number
          quality?: number
          reviewed_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "flashcard_reviews_flashcard_id_fkey"
            columns: ["flashcard_id"]
            isOneToOne: false
            referencedRelation: "flashcards"
            referencedColumns: ["id"]
          },
        ]
      }
      flashcards: {
        Row: {
          created_at: string
          definition: string | null
          ease_factor: number
          example_sentence: string | null
          id: string
          interval: number
          next_review_at: string | null
          pronunciation: string | null
          repetitions: number
          text_id: string | null
          translation: string
          updated_at: string
          user_id: string
          word: string
        }
        Insert: {
          created_at?: string
          definition?: string | null
          ease_factor?: number
          example_sentence?: string | null
          id?: string
          interval?: number
          next_review_at?: string | null
          pronunciation?: string | null
          repetitions?: number
          text_id?: string | null
          translation: string
          updated_at?: string
          user_id: string
          word: string
        }
        Update: {
          created_at?: string
          definition?: string | null
          ease_factor?: number
          example_sentence?: string | null
          id?: string
          interval?: number
          next_review_at?: string | null
          pronunciation?: string | null
          repetitions?: number
          text_id?: string | null
          translation?: string
          updated_at?: string
          user_id?: string
          word?: string
        }
        Relationships: [
          {
            foreignKeyName: "flashcards_text_id_fkey"
            columns: ["text_id"]
            isOneToOne: false
            referencedRelation: "texts"
            referencedColumns: ["id"]
          },
        ]
      }
      grammar_topics: {
        Row: {
          category: string
          created_at: string
          difficulty: Database["public"]["Enums"]["difficulty_level"]
          examples: Json | null
          explanation: string
          explanation_portuguese: string | null
          id: string
          name: string
          order_index: number | null
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          difficulty?: Database["public"]["Enums"]["difficulty_level"]
          examples?: Json | null
          explanation: string
          explanation_portuguese?: string | null
          id?: string
          name: string
          order_index?: number | null
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          difficulty?: Database["public"]["Enums"]["difficulty_level"]
          examples?: Json | null
          explanation?: string
          explanation_portuguese?: string | null
          id?: string
          name?: string
          order_index?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      practice_exercises: {
        Row: {
          audio_url: string | null
          category: string
          content: string
          content_portuguese: string | null
          created_at: string
          difficulty: Database["public"]["Enums"]["difficulty_level"]
          exercise_type: string
          hints: Json | null
          id: string
          instructions: string
          instructions_portuguese: string | null
          reference_answer: string | null
          title: string
          updated_at: string
        }
        Insert: {
          audio_url?: string | null
          category?: string
          content: string
          content_portuguese?: string | null
          created_at?: string
          difficulty?: Database["public"]["Enums"]["difficulty_level"]
          exercise_type: string
          hints?: Json | null
          id?: string
          instructions: string
          instructions_portuguese?: string | null
          reference_answer?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          audio_url?: string | null
          category?: string
          content?: string
          content_portuguese?: string | null
          created_at?: string
          difficulty?: Database["public"]["Enums"]["difficulty_level"]
          exercise_type?: string
          hints?: Json | null
          id?: string
          instructions?: string
          instructions_portuguese?: string | null
          reference_answer?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          native_language: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          native_language?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          native_language?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      quiz_questions: {
        Row: {
          category: string
          correct_answer: string
          created_at: string
          difficulty: Database["public"]["Enums"]["difficulty_level"]
          explanation: string | null
          explanation_portuguese: string | null
          grammar_topic_id: string | null
          id: string
          options: Json | null
          question: string
          question_type: string
          updated_at: string
        }
        Insert: {
          category?: string
          correct_answer: string
          created_at?: string
          difficulty?: Database["public"]["Enums"]["difficulty_level"]
          explanation?: string | null
          explanation_portuguese?: string | null
          grammar_topic_id?: string | null
          id?: string
          options?: Json | null
          question: string
          question_type?: string
          updated_at?: string
        }
        Update: {
          category?: string
          correct_answer?: string
          created_at?: string
          difficulty?: Database["public"]["Enums"]["difficulty_level"]
          explanation?: string | null
          explanation_portuguese?: string | null
          grammar_topic_id?: string | null
          id?: string
          options?: Json | null
          question?: string
          question_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_questions_grammar_topic_id_fkey"
            columns: ["grammar_topic_id"]
            isOneToOne: false
            referencedRelation: "grammar_topics"
            referencedColumns: ["id"]
          },
        ]
      }
      texts: {
        Row: {
          audio_url: string | null
          category: string
          content: string
          content_portuguese: string | null
          created_at: string
          difficulty: Database["public"]["Enums"]["difficulty_level"]
          id: string
          title: string
          updated_at: string
          word_count: number | null
        }
        Insert: {
          audio_url?: string | null
          category?: string
          content: string
          content_portuguese?: string | null
          created_at?: string
          difficulty?: Database["public"]["Enums"]["difficulty_level"]
          id?: string
          title: string
          updated_at?: string
          word_count?: number | null
        }
        Update: {
          audio_url?: string | null
          category?: string
          content?: string
          content_portuguese?: string | null
          created_at?: string
          difficulty?: Database["public"]["Enums"]["difficulty_level"]
          id?: string
          title?: string
          updated_at?: string
          word_count?: number | null
        }
        Relationships: []
      }
      user_progress: {
        Row: {
          completed: boolean | null
          completed_at: string | null
          created_at: string
          grammar_topic_id: string | null
          id: string
          progress_type: string
          text_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string
          grammar_topic_id?: string | null
          id?: string
          progress_type: string
          text_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string
          grammar_topic_id?: string | null
          id?: string
          progress_type?: string
          text_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_progress_grammar_topic_id_fkey"
            columns: ["grammar_topic_id"]
            isOneToOne: false
            referencedRelation: "grammar_topics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_progress_text_id_fkey"
            columns: ["text_id"]
            isOneToOne: false
            referencedRelation: "texts"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      word_definitions: {
        Row: {
          audio_url: string | null
          created_at: string
          definition: string | null
          examples: Json | null
          id: string
          part_of_speech: string | null
          phonetic: string | null
          source: string | null
          translation: string | null
          word: string
        }
        Insert: {
          audio_url?: string | null
          created_at?: string
          definition?: string | null
          examples?: Json | null
          id?: string
          part_of_speech?: string | null
          phonetic?: string | null
          source?: string | null
          translation?: string | null
          word: string
        }
        Update: {
          audio_url?: string | null
          created_at?: string
          definition?: string | null
          examples?: Json | null
          id?: string
          part_of_speech?: string | null
          phonetic?: string | null
          source?: string | null
          translation?: string | null
          word?: string
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
    }
    Enums: {
      app_role: "admin" | "user"
      difficulty_level: "beginner" | "intermediate" | "advanced"
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
      app_role: ["admin", "user"],
      difficulty_level: ["beginner", "intermediate", "advanced"],
    },
  },
} as const
