import { NextRequest, NextResponse } from 'next/server'
import { authorize } from '@/lib/articles/auth'

export const runtime = 'nodejs'

// GET /api/articles/me — is the signed-in user an articles admin? (admin session only)
export async function GET(req: NextRequest) {
  const auth = await authorize(req, { userOnly: true })
  if (!auth.ok) return auth.response
  const email = auth.caller.via === 'user' ? auth.caller.email : null
  return NextResponse.json({ admin: true, email }, { headers: { 'Cache-Control': 'no-store' } })
}
