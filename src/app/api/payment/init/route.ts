import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { initPayment, FREEDOMPAY_CONFIG } from '@/lib/freedompay'
import { v4 as uuidv4 } from 'uuid'

// Create admin client for server-side operations
function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, userEmail } = body

    // Email is required for payment (userId is optional)
    if (!userEmail) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseAdmin()

    // If userId provided, check for existing active subscription
    if (userId) {
      const { data: existingSubscription } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active')
        .gt('expires_at', new Date().toISOString())
        .single()

      if (existingSubscription) {
        return NextResponse.json(
          { error: 'User already has an active subscription' },
          { status: 400 }
        )
      }
    }

    // Generate unique order ID
    const orderId = `ORDER-${Date.now()}-${uuidv4().slice(0, 8)}`

    // Create pending subscription record
    // user_id can be null - will be linked after payment when user creates account
    const { data: subscription, error: insertError } = await supabase
      .from('subscriptions')
      .insert({
        user_id: userId || null,
        pg_order_id: orderId,
        amount: FREEDOMPAY_CONFIG.PRICE_KZT,
        currency: FREEDOMPAY_CONFIG.CURRENCY,
        status: 'pending',
        user_email: userEmail,
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error creating subscription:', insertError)
      return NextResponse.json(
        { error: 'Failed to create subscription record' },
        { status: 500 }
      )
    }

    // Initialize payment with FreedomPay
    const testMode = process.env.FREEDOMPAY_API_URL?.includes('test') ?? true

    const paymentResponse = await initPayment(
      orderId,
      FREEDOMPAY_CONFIG.PRICE_KZT,
      FREEDOMPAY_CONFIG.PRODUCT_NAME,
      userEmail,
      undefined,
      testMode
    )

    if (paymentResponse.pg_status !== 'ok' || !paymentResponse.pg_redirect_url) {
      // Update subscription to failed
      await supabase
        .from('subscriptions')
        .update({ status: 'failed' })
        .eq('id', subscription.id)

      console.error('FreedomPay error:', paymentResponse)
      return NextResponse.json(
        {
          error: 'Payment initialization failed',
          details: paymentResponse.pg_error_description
        },
        { status: 500 }
      )
    }

    // Update subscription with payment ID
    if (paymentResponse.pg_payment_id) {
      await supabase
        .from('subscriptions')
        .update({ pg_payment_id: paymentResponse.pg_payment_id })
        .eq('id', subscription.id)
    }

    return NextResponse.json({
      success: true,
      redirectUrl: paymentResponse.pg_redirect_url,
      orderId,
      paymentId: paymentResponse.pg_payment_id,
    })

  } catch (error) {
    console.error('Payment init error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
