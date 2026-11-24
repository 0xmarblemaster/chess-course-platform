import { createHash, randomBytes, timingSafeEqual } from 'crypto'
import type { SupabaseClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { getArticlesDb } from '@/lib/articles/db'

export const API_KEY_PREFIX = 'cea_'

export type Caller = { via: 'key'; keyId: string } | { via: 'user'; userId: string; email: string | null }
type AuthResult = { ok: true; caller: Caller } | { ok: false; response: NextResponse }

export const sha256 = (s: string) => createHash('sha256').update(s).digest('hex')

/** A new plain key (shown once) plus what is stored for it. */
export function mintApiKey() {
  const key = API_KEY_PREFIX + randomBytes(32).toString('base64url')
  return { key, key_prefix: key.slice(0, 8), key_hash: sha256(key) }
}

export const jsonError = (status: number, error: string, extra?: object) =>
  NextResponse.json({ error, ...extra }, { status })

/**
 * Who is calling: an article API key (`Authorization: Bearer cea_…`, unless userOnly) or a
 * Supabase access token of an admin (see isAdmin). Missing/invalid → 401, valid but not
 * allowed → 403.
 */
export async function authorize(req: Request, opts: { userOnly?: boolean } = {}): Promise<AuthResult> {
  const fail = (status: number, error: string): AuthResult => ({ ok: false, response: jsonError(status, error) })
  const token = req.headers.get('authorization')?.match(/^Bearer\s+(\S+)$/i)?.[1]
  if (!token) return fail(401, 'Missing bearer token')
  const db = getArticlesDb()
  if (!db) return fail(503, 'Database is not configured')

  if (token.startsWith(API_KEY_PREFIX)) {
    const hash = sha256(token)
    const { data, error } = await db
      .from('article_api_keys')
      .select('id, key_hash')
      .eq('key_hash', hash)
      .is('revoked_at', null)
      .maybeSingle()
    if (error) return fail(503, 'Could not check the API key')
    if (!data || !timingSafeEqual(Buffer.from(data.key_hash, 'hex'), Buffer.from(hash, 'hex'))) return fail(401, 'Invalid API key')
    if (opts.userOnly) return fail(403, 'This endpoint needs an admin session, not an API key')
    await db.from('article_api_keys').update({ last_used_at: new Date().toISOString() }).eq('id', data.id)
    return { ok: true, caller: { via: 'key', keyId: data.id } }
  }

  const { data: auth, error } = await db.auth.getUser(token)
  if (error || !auth.user) return fail(401, 'Invalid or expired session')
  const admin = await isAdmin(db, auth.user.id)
  if (admin === null) return fail(503, 'Could not check the admin role')
  if (!admin) return fail(403, 'Admin role required')
  return { ok: true, caller: { via: 'user', userId: auth.user.id, email: auth.user.email ?? null } }
}

// Missing table: 42P01 from Postgres, PGRST205 from PostgREST 13+.
const NO_TABLE = new Set(['42P01', 'PGRST205'])

/**
 * Admin = a public.user_roles row with role 'admin' (Chess Empire DB). Where that table doesn't
 * exist (the local test stack), users.role = 'admin' instead. null when the check itself failed.
 */
async function isAdmin(db: SupabaseClient, userId: string): Promise<boolean | null> {
  const roles = await db.from('user_roles').select('role').eq('user_id', userId).eq('role', 'admin').limit(1)
  if (!roles.error) return roles.data.length > 0
  if (!NO_TABLE.has(roles.error.code)) return null
  const { data, error } = await db.from('users').select('role').eq('id', userId).maybeSingle()
  return error ? null : data?.role === 'admin'
}
