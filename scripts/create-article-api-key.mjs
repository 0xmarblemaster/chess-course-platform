#!/usr/bin/env node
// Mints an articles API key straight in the database (for the first key, before anyone can use
// /admin/articles/keys). Prints the plain key once; only its sha256 is stored.
//   NEXT_PUBLIC_SUPABASE_URL=… SUPABASE_SERVICE_ROLE_KEY=… node scripts/create-article-api-key.mjs "Content bot"
import { createHash, randomBytes } from 'crypto'
import { createClient } from '@supabase/supabase-js'

const name = (process.argv[2] || '').trim()
const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!name || name.length > 80) {
  console.error('Usage: node scripts/create-article-api-key.mjs "<name, 1–80 chars>"')
  process.exit(1)
}
if (!url || !serviceKey) {
  console.error('Set NEXT_PUBLIC_SUPABASE_URL (or SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

// Same format as POST /api/articles/keys (src/lib/articles/auth.ts).
const key = 'cea_' + randomBytes(32).toString('base64url')
const db = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } })
const { data, error } = await db
  .from('article_api_keys')
  .insert({ name, key_prefix: key.slice(0, 8), key_hash: createHash('sha256').update(key).digest('hex') })
  .select('id')
  .single()
if (error) {
  console.error('Could not create the key:', error.message)
  process.exit(1)
}
console.error(`Created key "${name}" (id ${data.id}). Store it now — it is not shown again:`)
console.log(key)
