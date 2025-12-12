import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { getSupabaseAdmin } from '@/lib/supabaseServer'

function b64url(bytes: Buffer) {
  return bytes.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ code: string }> }
) {
  const { code } = await context.params
  if (!code) {
    return NextResponse.redirect(new URL('/invite-invalid', process.env.NEXT_PUBLIC_SITE_URL || 'https://www.chessempire.kz'))
  }

  const supabaseAdmin = getSupabaseAdmin()
  if (!supabaseAdmin) {
    return NextResponse.redirect(new URL('/invite-error', process.env.NEXT_PUBLIC_SITE_URL || 'https://www.chessempire.kz'))
  }

  // Validate link
  const { data: link } = await supabaseAdmin
    .from('trial_links')
    .select('*')
    .eq('code', code)
    .eq('enabled', true)
    .lte('created_at', new Date().toISOString())
    .single()

  if (!link) {
    return NextResponse.redirect(new URL('/invite-expired', process.env.NEXT_PUBLIC_SITE_URL || 'https://www.chessempire.kz'))
  }

  const now = new Date()
  // If link hasn't been used yet, shift expiration to start counting from first use
  let expiresAt = new Date(link.expires_at)
  if ((link.use_count ?? 0) === 0) {
    const intendedDurationMs = Math.max(0, new Date(link.expires_at).getTime() - new Date(link.created_at).getTime())
    const newExpires = new Date(now.getTime() + intendedDurationMs)
    // Persist the shifted expiration; ignore errors silently to avoid blocking
    try {
      await supabaseAdmin
        .from('trial_links')
        .update({ expires_at: newExpires.toISOString() })
        .eq('id', link.id)
    } catch (e) {
      // noop
    }
    expiresAt = newExpires
  }

  const limitReached = link.max_uses !== null && link.max_uses !== undefined && link.use_count >= link.max_uses
  if (expiresAt <= now || limitReached) {
    return NextResponse.redirect(new URL('/invite-expired', process.env.NEXT_PUBLIC_SITE_URL || 'https://www.chessempire.kz'))
  }

  // Create a session token and atomically increment use_count only if needed
  const sessionToken = b64url(crypto.randomBytes(32))

  // Insert session
  const { error: sessionErr } = await supabaseAdmin.from('trial_sessions').insert({
    link_id: link.id,
    session_token: sessionToken
  })
  if (sessionErr) {
    return NextResponse.redirect(new URL('/invite-error', process.env.NEXT_PUBLIC_SITE_URL || 'https://www.chessempire.kz'))
  }

  // Increment use_count atomically when a limit exists
  if (link.max_uses !== null && link.max_uses !== undefined) {
    await supabaseAdmin
      .from('trial_links')
      .update({ use_count: (link.use_count ?? 0) + 1 })
      .eq('id', link.id)
      .lt('use_count', link.max_uses)
  }

  // Redirect to the current request's origin (works for custom domains in production)
  const origin = req.nextUrl?.origin || process.env.NEXT_PUBLIC_SITE_URL || 'https://www.chessempire.kz'
  const res = NextResponse.redirect(new URL('/dashboard', origin))
  // HttpOnly cookie
  res.cookies.set('trial_session', sessionToken, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    expires: expiresAt
  })
  return res
}


