import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabaseServer'

export async function GET(req: NextRequest) {
  const cookies = req.cookies
  const token = cookies.get('trial_session')?.value
  if (!token) {
    return NextResponse.json({ active: false }, { status: 200 })
  }

  const supabaseAdmin = getSupabaseAdmin()
  if (!supabaseAdmin) {
    return NextResponse.json({ active: false }, { status: 200 })
  }

  // Load session and link
  const { data: session } = await supabaseAdmin
    .from('trial_sessions')
    .select('id, link_id, created_at, last_seen_at, revoked_at')
    .eq('session_token', token)
    .single()

  if (!session || session.revoked_at) {
    return NextResponse.json({ active: false }, { status: 200 })
  }

  const { data: link } = await supabaseAdmin
    .from('trial_links')
    .select('id, expires_at, enabled')
    .eq('id', session.link_id)
    .single()

  if (!link || !link.enabled || new Date(link.expires_at) <= new Date()) {
    return NextResponse.json({ active: false }, { status: 200 })
  }

  // Load targets defining scope
  const { data: targets } = await supabaseAdmin
    .from('trial_link_targets')
    .select('level_group_id, level_id, lesson_id, max_courses_per_level, max_lessons_per_course')
    .eq('link_id', link.id)

  return NextResponse.json({
    active: true,
    expiresAt: link.expires_at,
    targets: targets || []
  })
}


