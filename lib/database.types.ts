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
      achievements: {
        Row: {
          earned_at: string
          type: string
          user_id: string
        }
        Insert: {
          earned_at?: string
          type: string
          user_id: string
        }
        Update: {
          earned_at?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "achievements_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      blocks: {
        Row: {
          blocked_id: string
          blocker_id: string
          created_at: string
        }
        Insert: {
          blocked_id: string
          blocker_id: string
          created_at?: string
        }
        Update: {
          blocked_id?: string
          blocker_id?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "blocks_blocked_id_fkey"
            columns: ["blocked_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blocks_blocker_id_fkey"
            columns: ["blocker_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      bookmark_collections: {
        Row: {
          created_at: string
          id: string
          name: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookmark_collections_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      card_comments: {
        Row: {
          body: string
          card_id: string
          created_at: string
          id: string
          status: string
          user_id: string
        }
        Insert: {
          body: string
          card_id: string
          created_at?: string
          id?: string
          status?: string
          user_id: string
        }
        Update: {
          body?: string
          card_id?: string
          created_at?: string
          id?: string
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
          view_count: number
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
          view_count?: number
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
          view_count?: number
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
      category_feed_prefs: {
        Row: {
          category_id: string
          updated_at: string
          user_id: string
          weight: number
        }
        Insert: {
          category_id: string
          updated_at?: string
          user_id: string
          weight?: number
        }
        Update: {
          category_id?: string
          updated_at?: string
          user_id?: string
          weight?: number
        }
        Relationships: [
          {
            foreignKeyName: "category_feed_prefs_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "category_feed_prefs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
          edited_at: string | null
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
          edited_at?: string | null
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
          edited_at?: string | null
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
      comparison_drafts: {
        Row: {
          category_id: string | null
          created_at: string
          creator_id: string
          id: string
          options: Json
          prompt: string | null
          updated_at: string
          visibility: string
        }
        Insert: {
          category_id?: string | null
          created_at?: string
          creator_id: string
          id?: string
          options?: Json
          prompt?: string | null
          updated_at?: string
          visibility?: string
        }
        Update: {
          category_id?: string | null
          created_at?: string
          creator_id?: string
          id?: string
          options?: Json
          prompt?: string | null
          updated_at?: string
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "comparison_drafts_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comparison_drafts_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      comparison_hashtags: {
        Row: {
          comparison_id: string
          hashtag_id: string
        }
        Insert: {
          comparison_id: string
          hashtag_id: string
        }
        Update: {
          comparison_id?: string
          hashtag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comparison_hashtags_comparison_id_fkey"
            columns: ["comparison_id"]
            isOneToOne: false
            referencedRelation: "comparisons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comparison_hashtags_hashtag_id_fkey"
            columns: ["hashtag_id"]
            isOneToOne: false
            referencedRelation: "hashtags"
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
      comparison_topics: {
        Row: {
          comparison_id: string
          topic_id: string
        }
        Insert: {
          comparison_id: string
          topic_id: string
        }
        Update: {
          comparison_id?: string
          topic_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comparison_topics_comparison_id_fkey"
            columns: ["comparison_id"]
            isOneToOne: false
            referencedRelation: "comparisons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comparison_topics_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
        ]
      }
      comparisons: {
        Row: {
          ai_opinion: string | null
          ai_opinion_generated_at: string | null
          caption: string | null
          category_id: string | null
          comment_count: number
          correct_side: string | null
          created_at: string
          creator_id: string | null
          fun_fact: string | null
          id: string
          is_onboarding: boolean
          is_sponsored: boolean
          like_count: number
          prompt: string | null
          sponsor_label: string | null
          status: string
          subject: string | null
          visibility: string
          vote_count: number
        }
        Insert: {
          ai_opinion?: string | null
          ai_opinion_generated_at?: string | null
          caption?: string | null
          category_id?: string | null
          comment_count?: number
          correct_side?: string | null
          created_at?: string
          creator_id?: string | null
          fun_fact?: string | null
          id?: string
          is_onboarding?: boolean
          is_sponsored?: boolean
          like_count?: number
          prompt?: string | null
          sponsor_label?: string | null
          status?: string
          subject?: string | null
          visibility?: string
          vote_count?: number
        }
        Update: {
          ai_opinion?: string | null
          ai_opinion_generated_at?: string | null
          caption?: string | null
          category_id?: string | null
          comment_count?: number
          correct_side?: string | null
          created_at?: string
          creator_id?: string | null
          fun_fact?: string | null
          id?: string
          is_onboarding?: boolean
          is_sponsored?: boolean
          like_count?: number
          prompt?: string | null
          sponsor_label?: string | null
          status?: string
          subject?: string | null
          visibility?: string
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
      feed_dismissals: {
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
            foreignKeyName: "feed_dismissals_comparison_id_fkey"
            columns: ["comparison_id"]
            isOneToOne: false
            referencedRelation: "comparisons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feed_dismissals_user_id_fkey"
            columns: ["user_id"]
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
      hashtags: {
        Row: {
          created_at: string
          id: string
          tag: string
          use_count: number
        }
        Insert: {
          created_at?: string
          id?: string
          tag: string
          use_count?: number
        }
        Update: {
          created_at?: string
          id?: string
          tag?: string
          use_count?: number
        }
        Relationships: []
      }
      mutes: {
        Row: {
          created_at: string
          muted_id: string
          muter_id: string
        }
        Insert: {
          created_at?: string
          muted_id: string
          muter_id: string
        }
        Update: {
          created_at?: string
          muted_id?: string
          muter_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mutes_muted_id_fkey"
            columns: ["muted_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mutes_muter_id_fkey"
            columns: ["muter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          actor_id: string
          comment_id: string | null
          comparison_id: string | null
          created_at: string
          id: string
          read_at: string | null
          recipient_id: string
          type: string
        }
        Insert: {
          actor_id: string
          comment_id?: string | null
          comparison_id?: string | null
          created_at?: string
          id?: string
          read_at?: string | null
          recipient_id: string
          type: string
        }
        Update: {
          actor_id?: string
          comment_id?: string | null
          comparison_id?: string | null
          created_at?: string
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
            foreignKeyName: "notifications_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_comparison_id_fkey"
            columns: ["comparison_id"]
            isOneToOne: false
            referencedRelation: "comparisons"
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
      payments: {
        Row: {
          amount_cents: number
          created_at: string
          currency: string
          id: string
          kind: string
          reference: string
          status: string
          user_id: string
          wardrobe_item_id: string | null
        }
        Insert: {
          amount_cents: number
          created_at?: string
          currency: string
          id?: string
          kind: string
          reference: string
          status?: string
          user_id: string
          wardrobe_item_id?: string | null
        }
        Update: {
          amount_cents?: number
          created_at?: string
          currency?: string
          id?: string
          kind?: string
          reference?: string
          status?: string
          user_id?: string
          wardrobe_item_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_wardrobe_item_id_fkey"
            columns: ["wardrobe_item_id"]
            isOneToOne: false
            referencedRelation: "wardrobe_items"
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
      predictions: {
        Row: {
          comparison_id: string
          correct: boolean | null
          created_at: string
          id: string
          predicted_option_id: string
          user_id: string
        }
        Insert: {
          comparison_id: string
          correct?: boolean | null
          created_at?: string
          id?: string
          predicted_option_id: string
          user_id: string
        }
        Update: {
          comparison_id?: string
          correct?: boolean | null
          created_at?: string
          id?: string
          predicted_option_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "predictions_comparison_id_fkey"
            columns: ["comparison_id"]
            isOneToOne: false
            referencedRelation: "comparisons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "predictions_predicted_option_id_fkey"
            columns: ["predicted_option_id"]
            isOneToOne: false
            referencedRelation: "comparison_options"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "predictions_user_id_fkey"
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
      preference_signals: {
        Row: {
          category_id: string | null
          label: string
          label_key: string
          opportunities: number
          updated_at: string
          user_id: string
          wins: number
        }
        Insert: {
          category_id?: string | null
          label: string
          label_key: string
          opportunities?: number
          updated_at?: string
          user_id: string
          wins?: number
        }
        Update: {
          category_id?: string | null
          label?: string
          label_key?: string
          opportunities?: number
          updated_at?: string
          user_id?: string
          wins?: number
        }
        Relationships: [
          {
            foreignKeyName: "preference_signals_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "preference_signals_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
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
          avatar_url: string | null
          bio: string | null
          card_visibility: string
          compatibility_visibility: string
          country: string | null
          created_at: string
          current_streak: number
          deactivated_at: string | null
          display_name: string | null
          follower_count: number
          following_count: number
          id: string
          is_admin: boolean
          is_pro: boolean
          is_seed_account: boolean
          last_active_date: string | null
          longest_streak: number
          onboarding_completed_at: string | null
          play_best_streak: number
          play_streak: number
          preference_visibility: string
          pro_expires_at: string | null
          reputation: number
          show_dna: boolean
          show_play_score: boolean
          show_streak: boolean
          social_links: Json
          social_links_visibility: string
          suspended_at: string | null
          username: string
        }
        Insert: {
          ai_bio?: string | null
          ai_bio_generated_at?: string | null
          avatar_url?: string | null
          bio?: string | null
          card_visibility?: string
          compatibility_visibility?: string
          country?: string | null
          created_at?: string
          current_streak?: number
          deactivated_at?: string | null
          display_name?: string | null
          follower_count?: number
          following_count?: number
          id: string
          is_admin?: boolean
          is_pro?: boolean
          is_seed_account?: boolean
          last_active_date?: string | null
          longest_streak?: number
          onboarding_completed_at?: string | null
          play_best_streak?: number
          play_streak?: number
          preference_visibility?: string
          pro_expires_at?: string | null
          reputation?: number
          show_dna?: boolean
          show_play_score?: boolean
          show_streak?: boolean
          social_links?: Json
          social_links_visibility?: string
          suspended_at?: string | null
          username: string
        }
        Update: {
          ai_bio?: string | null
          ai_bio_generated_at?: string | null
          avatar_url?: string | null
          bio?: string | null
          card_visibility?: string
          compatibility_visibility?: string
          country?: string | null
          created_at?: string
          current_streak?: number
          deactivated_at?: string | null
          display_name?: string | null
          follower_count?: number
          following_count?: number
          id?: string
          is_admin?: boolean
          is_pro?: boolean
          is_seed_account?: boolean
          last_active_date?: string | null
          longest_streak?: number
          onboarding_completed_at?: string | null
          play_best_streak?: number
          play_streak?: number
          preference_visibility?: string
          pro_expires_at?: string | null
          reputation?: number
          show_dna?: boolean
          show_play_score?: boolean
          show_streak?: boolean
          social_links?: Json
          social_links_visibility?: string
          suspended_at?: string | null
          username?: string
        }
        Relationships: []
      }
      recently_viewed: {
        Row: {
          comparison_id: string
          user_id: string
          viewed_at: string
        }
        Insert: {
          comparison_id: string
          user_id: string
          viewed_at?: string
        }
        Update: {
          comparison_id?: string
          user_id?: string
          viewed_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "recently_viewed_comparison_id_fkey"
            columns: ["comparison_id"]
            isOneToOne: false
            referencedRelation: "comparisons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recently_viewed_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
          collection_id: string | null
          comparison_id: string
          created_at: string
          user_id: string
        }
        Insert: {
          collection_id?: string | null
          comparison_id: string
          created_at?: string
          user_id: string
        }
        Update: {
          collection_id?: string | null
          comparison_id?: string
          created_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_comparisons_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "bookmark_collections"
            referencedColumns: ["id"]
          },
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
      search_history: {
        Row: {
          created_at: string
          id: string
          query: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          query: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          query?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "search_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      topic_follows: {
        Row: {
          created_at: string
          topic_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          topic_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          topic_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "topic_follows_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "topic_follows_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      topics: {
        Row: {
          category_id: string | null
          created_at: string
          follower_count: number
          id: string
          label: string
          slug: string
        }
        Insert: {
          category_id?: string | null
          created_at?: string
          follower_count?: number
          id?: string
          label: string
          slug: string
        }
        Update: {
          category_id?: string | null
          created_at?: string
          follower_count?: number
          id?: string
          label?: string
          slug?: string
        }
        Relationships: [
          {
            foreignKeyName: "topics_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
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
      vote_changes: {
        Row: {
          changed_at: string
          comparison_id: string
          from_option_id: string
          id: string
          reason: string | null
          to_option_id: string
          user_id: string
        }
        Insert: {
          changed_at?: string
          comparison_id: string
          from_option_id: string
          id?: string
          reason?: string | null
          to_option_id: string
          user_id: string
        }
        Update: {
          changed_at?: string
          comparison_id?: string
          from_option_id?: string
          id?: string
          reason?: string | null
          to_option_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vote_changes_comparison_id_fkey"
            columns: ["comparison_id"]
            isOneToOne: false
            referencedRelation: "comparisons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vote_changes_from_option_id_fkey"
            columns: ["from_option_id"]
            isOneToOne: false
            referencedRelation: "comparison_options"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vote_changes_to_option_id_fkey"
            columns: ["to_option_id"]
            isOneToOne: false
            referencedRelation: "comparison_options"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vote_changes_user_id_fkey"
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
      change_vote: {
        Args: { p_comparison_id: string; p_option_id: string; p_reason?: string }
        Returns: undefined
      }
      compare_users: { Args: { user_a: string; user_b: string }; Returns: Json }
      get_feed_order: {
        Args: { p_limit?: number; p_user_id?: string }
        Returns: {
          comparison_id: string
        }[]
      }
      get_global_pulse: {
        Args: { p_comparison_id: string }
        Returns: { country: string; option_id: string; votes: number }[]
      }
      get_leaderboard: {
        Args: { p_country?: string; p_friends_of?: string; p_limit?: number; p_subject?: string }
        Returns: {
          avatar_url: string
          correct: number
          display_name: string
          total: number
          user_id: string
          username: string
        }[]
      }
      get_onboarding_stats: {
        Args: { p_user_id: string }
        Returns: { preferences_discovered: number; votes_cast: number }[]
      }
      get_trending_comparisons: {
        Args: { p_category_id?: string; p_limit?: number }
        Returns: { comparison_id: string }[]
      }
      get_vote_change_count: { Args: { p_comparison_id: string }; Returns: number }
      increment_card_view: { Args: { p_card_id: string }; Returns: undefined }
      is_blocked: { Args: { p_a: string; p_b: string }; Returns: boolean }
      record_play_answer: {
        Args: { p_comparison_id: string; p_correct: boolean | null; p_subject: string }
        Returns: undefined
      }
      record_prediction: {
        Args: { p_comparison_id: string; p_predicted_option_id: string }
        Returns: boolean
      }
      record_recently_viewed: { Args: { p_comparison_id: string }; Returns: undefined }
      set_last_vote_change_reason: {
        Args: { p_comparison_id: string; p_reason: string }
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
