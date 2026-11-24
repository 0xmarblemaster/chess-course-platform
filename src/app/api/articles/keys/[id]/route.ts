import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabaseServer'
import { authorize, jsonError } from '@/lib/articles/auth'

export const runtime = 'nodejs'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// DELETE /api/articles/keys/[id] — revoke (admin session only); the row stays for the audit trail
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authorize(req, { userOnly: true })
  if (!auth.ok) return auth.response
  const { id } = await params
  if (!UUID_RE.test(id)) return jsonError(404, 'Key not found')
  const db = getSupabaseAdmin()!
  const { data: key, error } = await db.from('article_api_keys').select('id, revoked_at').eq('id', id).maybeSingle()
  if (error) return jsonError(500, error.message)
  if (!key) return jsonError(404, 'Key not found')
  if (!key.revoked_at) {
    const { error: e } = await db.from('article_api_keys').update({ revoked_at: new Date().toISOString() }).eq('id', id)
    if (e) return jsonError(500, e.message)
  }
  return NextResponse.json({ revoked: id })
}
