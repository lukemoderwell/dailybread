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
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          age: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          age?: number;
          created_at?: string;
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
    };
  };
}
