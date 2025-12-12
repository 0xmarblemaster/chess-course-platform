import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabaseServer'

export async function POST(req: NextRequest) {
  const token = req.cookies.get('trial_session')?.value
  if (!token) return new NextResponse(null, { status: 204 })

  const { route } = await req.json().catch(() => ({ route: null }))

  // Find session by token
  const supabaseAdmin = getSupabaseAdmin()
  if (!supabaseAdmin) return new NextResponse(null, { status: 204 })

  const { data: session } = await supabaseAdmin
    .from('trial_sessions')
    .select('id, link_id')
    .eq('session_token', token)
    .single()

  if (!session) return new NextResponse(null, { status: 204 })

  const nowIso = new Date().toISOString()
  // Update last_seen_at (and optionally ip/ua)
  const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || null
  const ua = req.headers.get('user-agent') || null

  await supabaseAdmin
    .from('trial_sessions')
    .update({ last_seen_at: nowIso, user_agent: ua, ip: ip as string | null })
    .eq('id', session.id)

  // Insert pageview event
  await supabaseAdmin
    .from('trial_events')
    .insert({ session_id: session.id, event_type: 'pageview', route: route || null })

  return NextResponse.json({ ok: true })
}


