import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { verifySignature, buildXmlResponse } from '@/lib/freedompay'

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

/**
 * Result URL - Called by FreedomPay after payment completion
 * Updates subscription status based on payment result
 */
export async function POST(request: NextRequest) {
  const scriptName = 'result'

  try {
    // Parse form data from FreedomPay
    const formData = await request.formData()
    const params: Record<string, string> = {}

    formData.forEach((value, key) => {
      if (typeof value === 'string') {
        params[key] = value
      }
    })

    console.log('Payment result received:', {
      pg_order_id: params.pg_order_id,
      pg_payment_id: params.pg_payment_id,
      pg_result: params.pg_result,
      pg_amount: params.pg_amount,
      pg_payment_method: params.pg_payment_method,
      pg_card_pan: params.pg_card_pan,
    })

    // Verify signature
    const signature = params.pg_sig
    if (!signature || !verifySignature(scriptName, params, signature)) {
      console.error('Invalid signature in result callback')
      const xml = buildXmlResponse('error', 'Invalid signature', scriptName)
      return new NextResponse(xml, {
        status: 200,
        headers: { 'Content-Type': 'application/xml; charset=utf-8' }
      })
    }

    const orderId = params.pg_order_id
    const paymentResult = params.pg_result // 1 = success, 0 = failure
    const paymentId = params.pg_payment_id

    if (!orderId) {
      const xml = buildXmlResponse('error', 'Missing order ID', scriptName)
      return new NextResponse(xml, {
        status: 200,
        headers: { 'Content-Type': 'application/xml; charset=utf-8' }
      })
    }

    const supabase = getSupabaseAdmin()

    // Find the subscription record
    const { data: subscription, error: findError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('pg_order_id', orderId)
      .single()

    if (findError || !subscription) {
      console.error('Subscription not found:', orderId)
      const xml = buildXmlResponse('error', 'Order not found', scriptName)
      return new NextResponse(xml, {
        status: 200,
        headers: { 'Content-Type': 'application/xml; charset=utf-8' }
      })
    }

    // Check for duplicate callback (idempotency)
    if (subscription.status === 'active' && paymentResult === '1') {
      console.log('Duplicate success callback, already processed:', orderId)
      const xml = buildXmlResponse('ok', 'Already processed', scriptName)
      return new NextResponse(xml, {
        status: 200,
        headers: { 'Content-Type': 'application/xml; charset=utf-8' }
      })
    }

    if (paymentResult === '1') {
      // Payment successful - activate subscription
      const paidAt = new Date()
      const expiresAt = new Date(paidAt)
      expiresAt.setFullYear(expiresAt.getFullYear() + 1) // 1 year subscription

      const { error: updateError } = await supabase
        .from('subscriptions')
        .update({
          status: 'active',
          pg_payment_id: paymentId,
          payment_method: params.pg_payment_method || 'card',
          card_pan: params.pg_card_pan,
          paid_at: paidAt.toISOString(),
          expires_at: expiresAt.toISOString(),
        })
        .eq('id', subscription.id)

      if (updateError) {
        console.error('Error updating subscription:', updateError)
        const xml = buildXmlResponse('error', 'Failed to update subscription', scriptName)
        return new NextResponse(xml, {
          status: 200,
          headers: { 'Content-Type': 'application/xml; charset=utf-8' }
        })
      }

      console.log('Subscription activated:', {
        orderId,
        userId: subscription.user_id,
        expiresAt: expiresAt.toISOString(),
      })

      const xml = buildXmlResponse('ok', 'Payment processed successfully', scriptName)
      return new NextResponse(xml, {
        status: 200,
        headers: { 'Content-Type': 'application/xml; charset=utf-8' }
      })

    } else {
      // Payment failed
      const { error: updateError } = await supabase
        .from('subscriptions')
        .update({
          status: 'failed',
          pg_payment_id: paymentId,
        })
        .eq('id', subscription.id)

      if (updateError) {
        console.error('Error updating failed subscription:', updateError)
      }

      console.log('Payment failed:', {
        orderId,
        errorCode: params.pg_error_code,
        errorDescription: params.pg_error_description,
      })

      const xml = buildXmlResponse('ok', 'Payment failure recorded', scriptName)
      return new NextResponse(xml, {
        status: 200,
        headers: { 'Content-Type': 'application/xml; charset=utf-8' }
      })
    }

  } catch (error) {
    console.error('Result callback error:', error)
    const xml = buildXmlResponse('error', 'Internal server error', scriptName)
    return new NextResponse(xml, {
      status: 200,
      headers: { 'Content-Type': 'application/xml; charset=utf-8' }
    })
  }
}

// Also handle GET requests
export async function GET(request: NextRequest) {
  const scriptName = 'result'
  const searchParams = request.nextUrl.searchParams
  const params: Record<string, string> = {}

  searchParams.forEach((value, key) => {
    params[key] = value
  })

  // Convert to form data format and call POST handler
  const formData = new FormData()
  Object.entries(params).forEach(([key, value]) => {
    formData.append(key, value)
  })

  // Create a new request with form data
  const newRequest = new NextRequest(request.url, {
    method: 'POST',
    body: formData,
  })

  return POST(newRequest)
}
