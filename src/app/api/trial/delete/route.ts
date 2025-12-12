import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabaseServer'

export async function POST(req: NextRequest) {
  try {
    const { sessionId } = await req.json()
    if (!sessionId) return NextResponse.json({ error: 'sessionId is required' }, { status: 400 })
    const admin = getSupabaseAdmin()
    if (!admin) return NextResponse.json({ error: 'Server not configured' }, { status: 500 })
    // Load the session to identify its link
    const { data: sess, error: fetchErr } = await admin
      .from('trial_sessions')
      .select('link_id')
      .eq('id', sessionId)
      .single()
    if (fetchErr) return NextResponse.json({ error: fetchErr.message }, { status: 500 })

    // Delete the entire link; ON DELETE CASCADE removes all related sessions
    const { error } = await admin.from('trial_links').delete().eq('id', sess.link_id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch (e: unknown) {
    return NextResponse.json({ error: 'Unexpected error' }, { status: 500 })
  }
}


