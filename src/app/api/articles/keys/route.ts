import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabaseServer'
import { authorize, jsonError, mintApiKey } from '@/lib/articles/auth'

export const runtime = 'nodejs'

const COLUMNS = 'id, name, key_prefix, created_by, created_at, last_used_at, revoked_at'

// GET /api/articles/keys — list (admin session only)
export async function GET(req: NextRequest) {
  const auth = await authorize(req, { userOnly: true })
  if (!auth.ok) return auth.response
  const { data, error } = await getSupabaseAdmin()!.from('article_api_keys').select(COLUMNS).order('created_at', { ascending: false })
  if (error) return jsonError(500, error.message)
  return NextResponse.json({ keys: data }, { headers: { 'Cache-Control': 'no-store' } })
}

// POST /api/articles/keys { name } — the plain key is only in this response
export async function POST(req: NextRequest) {
  const auth = await authorize(req, { userOnly: true })
  if (!auth.ok) return auth.response
  const body = await req.json().catch(() => null)
  const name = typeof body?.name === 'string' ? body.name.trim() : ''
  if (!name || name.length > 80) return jsonError(400, 'Validation failed', { fields: { name: 'Name must be 1–80 characters' } })

  const { key, key_prefix, key_hash } = mintApiKey()
  const created_by = auth.caller.via === 'user' ? auth.caller.userId : null
  const { data, error } = await getSupabaseAdmin()!
    .from('article_api_keys')
    .insert({ name, key_prefix, key_hash, created_by })
    .select(COLUMNS)
    .single()
  if (error) return jsonError(500, error.message)
  return NextResponse.json({ key, apiKey: data }, { status: 201, headers: { 'Cache-Control': 'no-store' } })
}
