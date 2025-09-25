import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

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
  order: number
  pdf_url: string
}

export interface Lesson {
  id: number
  level_id: number
  title: string
  video_url: string
  lichess_embed_url: string
  order: number
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