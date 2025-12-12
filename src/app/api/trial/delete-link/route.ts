import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabaseServer'

export async function POST(req: NextRequest) {
  try {
    const { linkId } = await req.json()
    if (!linkId) return NextResponse.json({ error: 'linkId is required' }, { status: 400 })

    // Accept id, code, or full URL; normalize to a candidate string
    const raw = String(linkId).trim()
    const candidate = raw.includes('/') ? raw.split('/').filter(Boolean).pop()! : raw
    const isUuid = /^[0-9a-fA-F-]{36}$/.test(candidate)

    const admin = getSupabaseAdmin()
    if (!admin) return NextResponse.json({ error: 'Server not configured' }, { status: 500 })

    // Resolve link id (accept either id or code for resilience)
    let resolvedId = candidate
    if (isUuid) {
      const { data, error } = await admin.from('trial_links').select('id').eq('id', candidate).maybeSingle()
      if (error) {
        console.error('Lookup by id failed:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
      if (!data) {
        return NextResponse.json({ error: 'Link not found' }, { status: 404 })
      }
      resolvedId = data.id
    } else {
      const { data, error } = await admin.from('trial_links').select('id').eq('code', candidate).maybeSingle()
      if (error) {
        console.error('Lookup by code failed:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
      if (!data) {
        return NextResponse.json({ error: 'Link not found' }, { status: 404 })
      }
      resolvedId = data.id
    }

    // Best-effort cascade: delete sessions and targets first in case FKs lack ON DELETE CASCADE
    const { error: sessErr } = await admin.from('trial_sessions').delete().eq('link_id', resolvedId)
    if (sessErr) {
      console.error('Error deleting sessions for link:', sessErr)
      return NextResponse.json({ error: sessErr.message }, { status: 500 })
    }

    // Some setups use link targets to scope access; remove them if they exist
    try {
      await admin.from('trial_link_targets').delete().eq('link_id', resolvedId)
    } catch (e) {
      // table may not exist; ignore
    }

    const { error } = await admin.from('trial_links').delete().eq('id', resolvedId)
    if (error) {
      console.error('Error deleting link:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unexpected error'
    console.error('Exception in delete-link route:', err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}


