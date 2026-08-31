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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      card_comments: {
        Row: {
          body: string
          card_id: string
          created_at: string
          id: string
          parent_comment_id: string | null
          status: string
          user_id: string
        }
        Insert: {
          body: string
          card_id: string
          created_at?: string
          id?: string
          parent_comment_id?: string | null
          status?: string
          user_id: string
        }
        Update: {
          body?: string
          card_id?: string
          created_at?: string
          id?: string
          parent_comment_id?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "card_comments_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "card_comments_parent_comment_id_fkey"
            columns: ["parent_comment_id"]
            isOneToOne: false
            referencedRelation: "card_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "card_comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      card_likes: {
        Row: {
          card_id: string
          created_at: string
          user_id: string
        }
        Insert: {
          card_id: string
          created_at?: string
          user_id: string
        }
        Update: {
          card_id?: string
          created_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "card_likes_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "card_likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      cards: {
        Row: {
          ai_summary: string | null
          ai_summary_generated_at: string | null
          comment_count: number
          created_at: string
          id: string
          like_count: number
          share_slug: string
          snapshot: Json | null
          user_id: string
        }
        Insert: {
          ai_summary?: string | null
          ai_summary_generated_at?: string | null
          comment_count?: number
          created_at?: string
          id?: string
          like_count?: number
          share_slug?: string
          snapshot?: Json | null
          user_id: string
        }
        Update: {
          ai_summary?: string | null
          ai_summary_generated_at?: string | null
          comment_count?: number
          created_at?: string
          id?: string
          like_count?: number
          share_slug?: string
          snapshot?: Json | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cards_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          emoji: string | null
          id: string
          is_active: boolean
          label: string
          slug: string
          sort_order: number
        }
        Insert: {
          emoji?: string | null
          id?: string
          is_active?: boolean
          label: string
          slug: string
          sort_order?: number
        }
        Update: {
          emoji?: string | null
          id?: string
          is_active?: boolean
          label?: string
          slug?: string
          sort_order?: number
        }
        Relationships: []
      }
      comment_likes: {
        Row: {
          comment_id: string
          created_at: string
          user_id: string
        }
        Insert: {
          comment_id: string
          created_at?: string
          user_id: string
        }
        Update: {
          comment_id?: string
          created_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comment_likes_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comment_likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      comments: {
        Row: {
          body: string
          comparison_id: string
          created_at: string
          id: string
          like_count: number
          option_id: string
          parent_comment_id: string | null
          status: string
          user_id: string
        }
        Insert: {
          body: string
          comparison_id: string
          created_at?: string
          id?: string
          like_count?: number
          option_id: string
          parent_comment_id?: string | null
          status?: string
          user_id: string
        }
        Update: {
          body?: string
          comparison_id?: string
          created_at?: string
          id?: string
          like_count?: number
          option_id?: string
          parent_comment_id?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_comparison_id_fkey"
            columns: ["comparison_id"]
            isOneToOne: false
            referencedRelation: "comparisons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_option_id_fkey"
            columns: ["option_id"]
            isOneToOne: false
            referencedRelation: "comparison_options"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_parent_comment_id_fkey"
            columns: ["parent_comment_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      comparison_likes: {
        Row: {
          comparison_id: string
          created_at: string
          user_id: string
        }
        Insert: {
          comparison_id: string
          created_at?: string
          user_id: string
        }
        Update: {
          comparison_id?: string
          created_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comparison_likes_comparison_id_fkey"
            columns: ["comparison_id"]
            isOneToOne: false
            referencedRelation: "comparisons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comparison_likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      comparison_options: {
        Row: {
          comparison_id: string
          id: string
          image_url: string | null
          label: string
          side: string
          vote_count: number
        }
        Insert: {
          comparison_id: string
          id?: string
          image_url?: string | null
          label: string
          side: string
          vote_count?: number
        }
        Update: {
          comparison_id?: string
          id?: string
          image_url?: string | null
          label?: string
          side?: string
          vote_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "comparison_options_comparison_id_fkey"
            columns: ["comparison_id"]
            isOneToOne: false
            referencedRelation: "comparisons"
            referencedColumns: ["id"]
          },
        ]
      }
      comparisons: {
        Row: {
          caption: string | null
          category_id: string | null
          comment_count: number
          correct_side: string | null
          created_at: string
          creator_id: string | null
          fun_fact: string | null
          id: string
          is_onboarding: boolean
          like_count: number
          prompt: string | null
          status: string
          subject: string | null
          vote_count: number
        }
        Insert: {
          caption?: string | null
          category_id?: string | null
          comment_count?: number
          correct_side?: string | null
          created_at?: string
          creator_id?: string | null
          fun_fact?: string | null
          id?: string
          is_onboarding?: boolean
          like_count?: number
          prompt?: string | null
          status?: string
          subject?: string | null
          vote_count?: number
        }
        Update: {
          caption?: string | null
          category_id?: string | null
          comment_count?: number
          correct_side?: string | null
          created_at?: string
          creator_id?: string | null
          fun_fact?: string | null
          id?: string
          is_onboarding?: boolean
          like_count?: number
          prompt?: string | null
          status?: string
          subject?: string | null
          vote_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "comparisons_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comparisons_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      follows: {
        Row: {
          created_at: string
          followee_id: string
          follower_id: string
        }
        Insert: {
          created_at?: string
          followee_id: string
          follower_id: string
        }
        Update: {
          created_at?: string
          followee_id?: string
          follower_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "follows_followee_id_fkey"
            columns: ["followee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follows_follower_id_fkey"
            columns: ["follower_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          actor_id: string | null
          created_at: string
          entity_id: string | null
          entity_type: string | null
          id: string
          read_at: string | null
          recipient_id: string
          type: string
        }
        Insert: {
          actor_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          read_at?: string | null
          recipient_id: string
          type: string
        }
        Update: {
          actor_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          read_at?: string | null
          recipient_id?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      play_answers: {
        Row: {
          comparison_id: string
          correct: boolean | null
          created_at: string
          id: string
          subject: string
          user_id: string
        }
        Insert: {
          comparison_id: string
          correct?: boolean | null
          created_at?: string
          id?: string
          subject: string
          user_id: string
        }
        Update: {
          comparison_id?: string
          correct?: boolean | null
          created_at?: string
          id?: string
          subject?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "play_answers_comparison_id_fkey"
            columns: ["comparison_id"]
            isOneToOne: false
            referencedRelation: "comparisons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "play_answers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      play_stats: {
        Row: {
          correct: number
          subject: string
          total: number
          updated_at: string
          user_id: string
        }
        Insert: {
          correct?: number
          subject: string
          total?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          correct?: number
          subject?: string
          total?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "play_stats_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      preference_dna: {
        Row: {
          breakdown: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          breakdown?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          breakdown?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "preference_dna_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_answers: {
        Row: {
          answer: string
          question_key: string
          updated_at: string
          user_id: string
        }
        Insert: {
          answer: string
          question_key: string
          updated_at?: string
          user_id: string
        }
        Update: {
          answer?: string
          question_key?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profile_answers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          ai_bio: string | null
          ai_bio_generated_at: string | null
          avatar_fullbody_url: string | null
          avatar_meta: Json
          avatar_model_url: string | null
          avatar_renderer: string | null
          avatar_upgrade_prompt_dismissed_at: string | null
          avatar_upgraded_at: string | null
          avatar_url: string | null
          bio: string | null
          created_at: string
          current_streak: number
          display_name: string | null
          follower_count: number
          following_count: number
          id: string
          is_admin: boolean
          is_seed_account: boolean
          last_active_date: string | null
          longest_streak: number
          onboarding_completed_at: string | null
          show_dna: boolean
          show_play_score: boolean
          show_streak: boolean
          social_links: Json
          suspended_at: string | null
          username: string
        }
        Insert: {
          ai_bio?: string | null
          ai_bio_generated_at?: string | null
          avatar_fullbody_url?: string | null
          avatar_meta?: Json
          avatar_model_url?: string | null
          avatar_renderer?: string | null
          avatar_upgrade_prompt_dismissed_at?: string | null
          avatar_upgraded_at?: string | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          current_streak?: number
          display_name?: string | null
          follower_count?: number
          following_count?: number
          id: string
          is_admin?: boolean
          is_seed_account?: boolean
          last_active_date?: string | null
          longest_streak?: number
          onboarding_completed_at?: string | null
          show_dna?: boolean
          show_play_score?: boolean
          show_streak?: boolean
          social_links?: Json
          suspended_at?: string | null
          username: string
        }
        Update: {
          ai_bio?: string | null
          ai_bio_generated_at?: string | null
          avatar_fullbody_url?: string | null
          avatar_meta?: Json
          avatar_model_url?: string | null
          avatar_renderer?: string | null
          avatar_upgrade_prompt_dismissed_at?: string | null
          avatar_upgraded_at?: string | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          current_streak?: number
          display_name?: string | null
          follower_count?: number
          following_count?: number
          id?: string
          is_admin?: boolean
          is_seed_account?: boolean
          last_active_date?: string | null
          longest_streak?: number
          onboarding_completed_at?: string | null
          show_dna?: boolean
          show_play_score?: boolean
          show_streak?: boolean
          social_links?: Json
          suspended_at?: string | null
          username?: string
        }
        Relationships: []
      }
      reports: {
        Row: {
          created_at: string
          details: string | null
          id: string
          reason: string
          reporter_id: string
          resolved_at: string | null
          resolved_by: string | null
          status: string
          target_id: string
          target_type: string
        }
        Insert: {
          created_at?: string
          details?: string | null
          id?: string
          reason: string
          reporter_id: string
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
          target_id: string
          target_type: string
        }
        Update: {
          created_at?: string
          details?: string | null
          id?: string
          reason?: string
          reporter_id?: string
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
          target_id?: string
          target_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "reports_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_comparisons: {
        Row: {
          comparison_id: string
          created_at: string
          user_id: string
        }
        Insert: {
          comparison_id: string
          created_at?: string
          user_id: string
        }
        Update: {
          comparison_id?: string
          created_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_comparisons_comparison_id_fkey"
            columns: ["comparison_id"]
            isOneToOne: false
            referencedRelation: "comparisons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saved_comparisons_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_outfit: {
        Row: {
          item_id: string | null
          slot: string
          updated_at: string
          user_id: string
        }
        Insert: {
          item_id?: string | null
          slot: string
          updated_at?: string
          user_id: string
        }
        Update: {
          item_id?: string | null
          slot?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_outfit_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "wardrobe_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_outfit_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_wardrobe: {
        Row: {
          acquired_at: string
          item_id: string
          source: string
          user_id: string
        }
        Insert: {
          acquired_at?: string
          item_id: string
          source: string
          user_id: string
        }
        Update: {
          acquired_at?: string
          item_id?: string
          source?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_wardrobe_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "wardrobe_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_wardrobe_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      votes: {
        Row: {
          comparison_id: string
          created_at: string
          id: string
          option_id: string
          user_id: string
        }
        Insert: {
          comparison_id: string
          created_at?: string
          id?: string
          option_id: string
          user_id: string
        }
        Update: {
          comparison_id?: string
          created_at?: string
          id?: string
          option_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "votes_comparison_id_fkey"
            columns: ["comparison_id"]
            isOneToOne: false
            referencedRelation: "comparisons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "votes_option_id_fkey"
            columns: ["option_id"]
            isOneToOne: false
            referencedRelation: "comparison_options"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "votes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      wardrobe_items: {
        Row: {
          asset_url: string
          created_at: string
          drop_expires_at: string | null
          id: string
          name: string
          price_cents: number | null
          slot: string
          z_index: number
        }
        Insert: {
          asset_url: string
          created_at?: string
          drop_expires_at?: string | null
          id?: string
          name: string
          price_cents?: number | null
          slot: string
          z_index?: number
        }
        Update: {
          asset_url?: string
          created_at?: string
          drop_expires_at?: string | null
          id?: string
          name?: string
          price_cents?: number | null
          slot?: string
          z_index?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      bump_streak: { Args: { p_user_id: string }; Returns: undefined }
      compare_dna: { Args: { user_a: string; user_b: string }; Returns: Json }
      compare_users: { Args: { user_a: string; user_b: string }; Returns: Json }
      get_daily_featured_comparison: { Args: { p_min_votes?: number }; Returns: string }
      get_feed_order: {
        Args: { p_limit?: number; p_user_id?: string }
        Returns: {
          comparison_id: string
        }[]
      }
      get_leaderboard: {
        Args: { p_limit?: number; p_subject?: string }
        Returns: {
          avatar_url: string
          correct: number
          display_name: string
          total: number
          user_id: string
          username: string
        }[]
      }
      get_user_rank: {
        Args: { p_subject?: string; p_user_id: string }
        Returns: {
          avatar_url: string
          correct: number
          display_name: string
          rank_position: number
          total: number
          user_id: string
          username: string
        }[]
      }
      record_play_answer: {
        Args: { p_comparison_id: string; p_correct: boolean | null; p_subject: string }
        Returns: undefined
      }
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
