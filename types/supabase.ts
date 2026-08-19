// Auto-generated from the connected Supabase schema. Do not edit by hand.

export type Json = string | number | boolean | null | { [key: string]: Json } | Json[]

export interface Database {
  public: {
    Tables: {
      habits: {
        Row: {
          id: string
          user_id: string
          name: string
          description: string | null
          color: string | null
          icon: string | null
          frequency: string
          current_streak: number
          longest_streak: number
          archived_at: string | null
          created_at: string
          updated_at: string
        }
      }
      habit_completions: {
        Row: {
          id: string
          habit_id: string
          user_id: string
          completed_date: string
          note: string | null
          created_at: string
        }
      }
      profiles: {
        Row: {
          id: string
          display_name: string | null
          avatar_url: string | null
          timezone: string
          created_at: string
          updated_at: string
        }
      }
    }
  }
}

Files created: `app/layout.tsx`, `lib/data.ts`, `lib/motion.ts`, `components/Reveal.tsx`, `components/Navbar.tsx`, `components/Footer.tsx`, `app/globals.css`, `messages/en.json`, `messages/es.json`, `types/supabase.ts`.