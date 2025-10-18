import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  }
})

// Database types
export interface User {
  id: string
  email: string
  role: 'student' | 'admin'
  created_at: string
}

export interface Level {
  id: number
  title: string
  description: string
  order_index: number
  level_group_id?: number
  video_url?: string
  puzzle_practice_url?: string
  pdf_url?: string
}

// Higher-level category that contains Courses (existing `levels`)
export interface LevelGroup {
  id: number
  title: string
  description: string
  order_index: number
}

export interface Lesson {
  id: number
  level_id: number
  title: string
  description?: string
  video_url: string
  lichess_embed_url: string
  lichess_image_url?: string
  lichess_image_url_2?: string
  lichess_embed_url_2?: string
  lichess_description?: string
  lichess_description_2?: string
  order_index: number
}

export interface Progress {
  id: string
  user_id: string
  lesson_id: number
  video_watched: boolean
  test_passed: boolean
  completed_at: string | null
}

export interface Badge {
  id: string
  user_id: string
  level_id: number
  badge_url: string
  earned_at: string
}

// Per-user access overrides for early unlocks
export interface AccessOverride {
  id: number
  user_id: string
  level_group_id?: number | null
  level_id?: number | null
  lesson_id?: number | null
  note?: string | null
  created_by?: string | null
  created_at: string
}
