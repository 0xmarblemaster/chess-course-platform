import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const error = requestUrl.searchParams.get('error')
  const errorDescription = requestUrl.searchParams.get('error_description')

  // Handle authentication errors
  if (error) {
    console.error('Auth callback error:', error, errorDescription)
    return NextResponse.redirect(`${requestUrl.origin}/login?error=${encodeURIComponent(errorDescription || error)}`)
  }

  if (code) {
    try {
      // Exchange code for session
      const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
      
      if (exchangeError) {
        console.error('Code exchange error:', exchangeError)
        return NextResponse.redirect(`${requestUrl.origin}/login?error=${encodeURIComponent('Authentication failed')}`)
      }

      // If we have a user, ensure they exist in our public.users table
      if (data.user) {
        const { error: insertError } = await supabase
          .from('users')
          .upsert({
            id: data.user.id,
            email: data.user.email,
            role: 'student', // Default role for new users
            created_at: new Date().toISOString()
          }, {
            onConflict: 'id'
          })

        if (insertError) {
          console.error('User creation error:', insertError)
          // Don't redirect to error page for user creation issues
          // The user is still authenticated, just missing from our table
        }
      }

      // Redirect to dashboard on success
      return NextResponse.redirect(`${requestUrl.origin}/dashboard`)
    } catch (error) {
      console.error('Auth callback exception:', error)
      return NextResponse.redirect(`${requestUrl.origin}/login?error=${encodeURIComponent('Authentication failed')}`)
    }
  }

  // No code provided, redirect to login
  return NextResponse.redirect(`${requestUrl.origin}/login`)
}