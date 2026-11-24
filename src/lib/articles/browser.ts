import { createClient } from '@supabase/supabase-js'

// Browser client for /admin/articles, on the articles project (NEXT_PUBLIC_ARTICLES_SUPABASE_*,
// falling back to the main project). Its own storage key keeps this session apart from the main
// app's (src/lib/supabaseClient.ts).
export const articlesSupabase = createClient(
  (process.env.NEXT_PUBLIC_ARTICLES_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL)!,
  (process.env.NEXT_PUBLIC_ARTICLES_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)!,
  { auth: { persistSession: true, autoRefreshToken: true, storageKey: 'ce-articles-auth' } },
)
