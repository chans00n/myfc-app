export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          email: string
          full_name: string | null
          avatar_url: string | null
          stripe_customer_id: string | null
          subscription_status: 'active' | 'canceled' | 'past_due' | 'trialing' | 'unpaid' | null
          subscription_plan: 'MONTHLY' | 'ANNUAL' | null
          trial_end_date: string | null
        }
        Insert: {
          id: string
          created_at?: string
          updated_at?: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          stripe_customer_id?: string | null
          subscription_status?: 'active' | 'canceled' | 'past_due' | 'trialing' | 'unpaid' | null
          subscription_plan?: 'MONTHLY' | 'ANNUAL' | null
          trial_end_date?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          stripe_customer_id?: string | null
          subscription_status?: 'active' | 'canceled' | 'past_due' | 'trialing' | 'unpaid' | null
          subscription_plan?: 'MONTHLY' | 'ANNUAL' | null
          trial_end_date?: string | null
        }
      }
      workouts: {
        Row: {
          id: string
          title: string
          description: string
          difficulty: 'beginner' | 'intermediate' | 'advanced'
          duration_seconds: number
          exercises: Json
          created_at: string
          updated_at: string
          date: string
          user_id: string | null
        }
        Insert: {
          id?: string
          title: string
          description: string
          difficulty: 'beginner' | 'intermediate' | 'advanced'
          duration_seconds: number
          exercises: Json
          created_at?: string
          updated_at?: string
          date?: string
          user_id?: string | null
        }
        Update: {
          id?: string
          title?: string
          description?: string
          difficulty?: 'beginner' | 'intermediate' | 'advanced'
          duration_seconds?: number
          exercises?: Json
          created_at?: string
          updated_at?: string
          date?: string
          user_id?: string | null
        }
      }
      movements: {
        Row: {
          id: string
          created_at: string
          name: string
          description: string
          video_url: string
          thumbnail_url: string
          category: string
          difficulty: 'beginner' | 'intermediate' | 'advanced'
        }
        Insert: {
          id?: string
          created_at?: string
          name: string
          description: string
          video_url: string
          thumbnail_url: string
          category: string
          difficulty: 'beginner' | 'intermediate' | 'advanced'
        }
        Update: {
          id?: string
          created_at?: string
          name?: string
          description?: string
          video_url?: string
          thumbnail_url?: string
          category?: string
          difficulty?: 'beginner' | 'intermediate' | 'advanced'
        }
      }
      messages: {
        Row: {
          id: string
          created_at: string
          user_id: string
          content: string
          channel: 'general' | 'support' | 'workouts'
        }
        Insert: {
          id?: string
          created_at?: string
          user_id: string
          content: string
          channel: 'general' | 'support' | 'workouts'
        }
        Update: {
          id?: string
          created_at?: string
          user_id?: string
          content?: string
          channel?: 'general' | 'support' | 'workouts'
        }
      }
      workout_progress: {
        Row: {
          id: string
          user_id: string
          workout_id: string
          completed_at: string
          duration_seconds: number
          rating: number | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          workout_id: string
          completed_at: string
          duration_seconds: number
          rating?: number | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          workout_id?: string
          completed_at?: string
          duration_seconds?: number
          rating?: number | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      user_achievements: {
        Row: {
          id: string
          user_id: string
          achievement_id: string
          earned_at: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          achievement_id: string
          earned_at: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          achievement_id?: string
          earned_at?: string
          created_at?: string
          updated_at?: string
        }
      }
      progress_metrics: {
        Row: {
          id: string
          user_id: string
          metric_name: string
          value: number
          notes: string | null
          recorded_at: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          metric_name: string
          value: number
          notes?: string | null
          recorded_at: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          metric_name?: string
          value?: number
          notes?: string | null
          recorded_at?: string
          created_at?: string
          updated_at?: string
        }
      }
      achievements: {
        Row: {
          id: string
          name: string
          description: string
          category: string
          requirement: number
          reward_points: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description: string
          category: string
          requirement: number
          reward_points: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string
          category?: string
          requirement?: number
          reward_points?: number
          created_at?: string
          updated_at?: string
        }
      }
      user_streaks: {
        Row: {
          id: string
          user_id: string
          current_streak: number
          longest_streak: number
          last_workout_date: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          current_streak?: number
          longest_streak?: number
          last_workout_date?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          current_streak?: number
          longest_streak?: number
          last_workout_date?: string | null
          created_at?: string
          updated_at?: string
        }
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
  }
} 