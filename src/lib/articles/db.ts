import { createClient, type SupabaseClient } from '@supabase/supabase-js'

let cachedClient: SupabaseClient | null = null

/**
 * Server client for the articles tables and the article-covers bucket, which live in the Chess
 * Empire DB project (ARTICLES_SUPABASE_*). Falls back to the main project's vars when unset.
 * Returns null when unconfigured; callers handle that.
 */
export function getArticlesDb(): SupabaseClient | null {
  if (cachedClient) return cachedClient

  const url = process.env.ARTICLES_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.ARTICLES_SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('Articles DB not configured. Missing env(s):', { hasUrl: !!url, hasSecretKey: !!key })
    }
    return null
  }

  cachedClient = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
  return cachedClient
}
