import { NextRequest, NextResponse } from 'next/server'
import { authorize, jsonError } from '@/lib/articles/auth'

export const runtime = 'nodejs'

// GET /api/articles/me — what may the signed-in user do in the articles editor? (session only)
// `admin: true` is kept for older clients: it means "may manage articles", like canManage.
export async function GET(req: NextRequest) {
  const auth = await authorize(req)
  if (!auth.ok) return auth.response
  if (auth.caller.via !== 'user') return jsonError(403, 'This endpoint needs a user session, not an API key')
  const { email, canManage, canManageKeys } = auth.caller
  return NextResponse.json({ admin: true, email, canManage, canManageKeys }, { headers: { 'Cache-Control': 'no-store' } })
}
