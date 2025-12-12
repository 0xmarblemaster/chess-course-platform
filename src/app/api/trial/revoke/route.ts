import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabaseServer'

export async function POST(req: NextRequest) {
  try {
    const { linkId } = await req.json()
    if (!linkId) return NextResponse.json({ error: 'linkId is required' }, { status: 400 })
    const admin = getSupabaseAdmin()
    if (!admin) return NextResponse.json({ error: 'Server not configured' }, { status: 500 })
    const { error } = await admin.from('trial_sessions').delete().eq('link_id', linkId)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch (e: unknown) {
    return NextResponse.json({ error: 'Unexpected error' }, { status: 500 })
  }
}


