export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          avatar_url: string | null;
          updated_at: string;
          created_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          avatar_url?: string | null;
          updated_at?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          updated_at?: string;
          created_at?: string;
        };
      };
      customers: {
        Row: {
          id: string;
          stripe_customer_id: string;
          created_at: string;
        };
        Insert: {
          id: string;
          stripe_customer_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          stripe_customer_id?: string;
          created_at?: string;
        };
      };
      subscriptions: {
        Row: {
          id: string;
          user_id: string;
          status: string;
          price_id: string;
          quantity: number | null;
          cancel_at_period_end: boolean;
          current_period_start: string | null;
          current_period_end: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          user_id: string;
          status: string;
          price_id: string;
          quantity?: number | null;
          cancel_at_period_end?: boolean;
          current_period_start?: string | null;
          current_period_end?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          status?: string;
          price_id?: string;
          quantity?: number | null;
          cancel_at_period_end?: boolean;
          current_period_start?: string | null;
          current_period_end?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      payments: {
        Row: {
          id: string;
          user_id: string;
          amount: number;
          currency: string;
          status: string;
          description: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          user_id: string;
          amount: number;
          currency: string;
          status: string;
          description?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          amount?: number;
          currency?: string;
          status?: string;
          description?: string | null;
          created_at?: string;
        };
      };
      family_members: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          age: number;
          color: string;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          age: number;
          color?: string;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          age?: number;
          color?: string;
          notes?: string | null;
          created_at?: string;
        };
      };
      user_preferences: {
        Row: {
          user_id: string;
          bible_translation: string;
          daily_reading_minutes: number;
          verses_per_session: number;
          enable_paintings: boolean;
          painting_style_preference: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          bible_translation?: string;
          daily_reading_minutes?: number;
          verses_per_session?: number;
          enable_paintings?: boolean;
          painting_style_preference?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          bible_translation?: string;
          daily_reading_minutes?: number;
          verses_per_session?: number;
          enable_paintings?: boolean;
          painting_style_preference?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      reading_progress: {
        Row: {
          user_id: string;
          current_book: string;
          current_chapter: number;
          current_streak: number;
          longest_streak: number;
          last_completed_date: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          current_book: string;
          current_chapter?: number;
          current_streak?: number;
          longest_streak?: number;
          last_completed_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          current_book?: string;
          current_chapter?: number;
          current_streak?: number;
          longest_streak?: number;
          last_completed_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      reading_sessions: {
        Row: {
          id: string;
          user_id: string;
          book: string;
          chapter: number;
          date: string;
          completed_at: string;
          content: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          book: string;
          chapter: number;
          date?: string;
          completed_at?: string;
          content?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          book?: string;
          chapter?: number;
          date?: string;
          completed_at?: string;
          content?: Json;
          created_at?: string;
        };
      };
      achievement_definitions: {
        Row: {
          id: string;
          category: string;
          name: string;
          description: string;
          icon: string;
          requirement_type: string;
          requirement_value: number | null;
          is_major: boolean;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id: string;
          category: string;
          name: string;
          description: string;
          icon: string;
          requirement_type: string;
          requirement_value?: number | null;
          is_major?: boolean;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          category?: string;
          name?: string;
          description?: string;
          icon?: string;
          requirement_type?: string;
          requirement_value?: number | null;
          is_major?: boolean;
          sort_order?: number;
          created_at?: string;
        };
      };
      family_achievements: {
        Row: {
          id: string;
          user_id: string;
          achievement_id: string;
          unlocked_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          achievement_id: string;
          unlocked_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          achievement_id?: string;
          unlocked_at?: string;
        };
      };
      achievement_notifications: {
        Row: {
          id: string;
          user_id: string;
          achievement_id: string;
          seen: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          achievement_id: string;
          seen?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          achievement_id?: string;
          seen?: boolean;
          created_at?: string;
        };
      };
    };
  };
}
