import { createHash, randomBytes, timingSafeEqual } from 'crypto'
import type { SupabaseClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { getArticlesDb } from '@/lib/articles/db'

export const API_KEY_PREFIX = 'cea_'

type Permissions = { canManage: boolean; canManageKeys: boolean }
export type Caller = { via: 'key'; keyId: string } | ({ via: 'user'; userId: string; email: string | null } & Permissions)
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
 * Supabase access token of a user allowed to manage articles (see articlePermissions). userOnly
 * endpoints (key management) also need the admin role. Missing/invalid → 401, valid but not
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
  const perms = await articlePermissions(db, auth.user.id)
  if (!perms) return fail(503, 'Could not check the article permission')
  if (!perms.canManage) return fail(403, 'Article management permission required')
  if (opts.userOnly && !perms.canManageKeys) return fail(403, 'Admin role required to manage API keys')
  return { ok: true, caller: { via: 'user', userId: auth.user.id, email: auth.user.email ?? null, ...perms } }
}

// Missing table: 42P01 from Postgres, PGRST205 from PostgREST 13+.
const NO_TABLE = new Set(['42P01', 'PGRST205'])

/**
 * canManage = a public.user_roles row with can_manage_articles (Chess Empire DB); canManageKeys =
 * that row also has role 'admin'. Where user_roles doesn't exist (the local test stack), users
 * instead: role 'admin' or can_manage_articles, keys for role 'admin'. null when the check failed.
 */
async function articlePermissions(db: SupabaseClient, userId: string): Promise<Permissions | null> {
  const roles = await db.from('user_roles').select('role').eq('user_id', userId).eq('can_manage_articles', true)
  if (!roles.error) return { canManage: roles.data.length > 0, canManageKeys: roles.data.some((r) => r.role === 'admin') }
  if (!NO_TABLE.has(roles.error.code)) return null
  const { data, error } = await db.from('users').select('role, can_manage_articles').eq('id', userId).maybeSingle()
  if (error) return null
  const admin = data?.role === 'admin'
  return { canManage: admin || data?.can_manage_articles === true, canManageKeys: admin }
}
