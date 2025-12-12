import { createClient, type SupabaseClient } from '@supabase/supabase-js'

let cachedClient: SupabaseClient | null = null

export function getSupabaseAdmin(): SupabaseClient | null {
  if (cachedClient) return cachedClient

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string | undefined
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string | undefined

  if (!supabaseUrl || !supabaseServiceKey) {
    // Avoid crashing the entire app if envs are missing in a dev env; caller should handle null
    if (process.env.NODE_ENV !== 'production') {
      console.warn('Supabase admin not configured. Missing env(s):', { hasUrl: !!supabaseUrl, hasServiceKey: !!supabaseServiceKey })
    }
    return null
  }

  cachedClient = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  })
  return cachedClient
}


