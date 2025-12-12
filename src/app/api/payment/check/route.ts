import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { verifySignature, buildXmlResponse, FREEDOMPAY_CONFIG } from '@/lib/freedompay'

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
 * Check URL - Called by FreedomPay before processing payment
 * Verifies that the order exists and amount matches
 */
export async function POST(request: NextRequest) {
  const scriptName = 'check'

  try {
    // Parse form data from FreedomPay
    const formData = await request.formData()
    const params: Record<string, string> = {}

    formData.forEach((value, key) => {
      if (typeof value === 'string') {
        params[key] = value
      }
    })

    console.log('Payment check received:', {
      pg_order_id: params.pg_order_id,
      pg_payment_id: params.pg_payment_id,
      pg_amount: params.pg_amount,
    })

    // Verify signature
    const signature = params.pg_sig
    if (!signature || !verifySignature(scriptName, params, signature)) {
      console.error('Invalid signature in check callback')
      const xml = buildXmlResponse('error', 'Invalid signature', scriptName)
      return new NextResponse(xml, {
        status: 200,
        headers: { 'Content-Type': 'application/xml; charset=utf-8' }
      })
    }

    const orderId = params.pg_order_id
    const amount = parseFloat(params.pg_amount || '0')

    if (!orderId) {
      const xml = buildXmlResponse('error', 'Missing order ID', scriptName)
      return new NextResponse(xml, {
        status: 200,
        headers: { 'Content-Type': 'application/xml; charset=utf-8' }
      })
    }

    const supabase = getSupabaseAdmin()

    // Find the subscription record
    const { data: subscription, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('pg_order_id', orderId)
      .single()

    if (error || !subscription) {
      console.error('Subscription not found:', orderId)
      const xml = buildXmlResponse('rejected', 'Order not found', scriptName)
      return new NextResponse(xml, {
        status: 200,
        headers: { 'Content-Type': 'application/xml; charset=utf-8' }
      })
    }

    // Verify amount matches
    if (Math.abs(subscription.amount - amount) > 0.01) {
      console.error('Amount mismatch:', { expected: subscription.amount, received: amount })
      const xml = buildXmlResponse('rejected', 'Amount mismatch', scriptName)
      return new NextResponse(xml, {
        status: 200,
        headers: { 'Content-Type': 'application/xml; charset=utf-8' }
      })
    }

    // Check subscription is in pending state
    if (subscription.status !== 'pending') {
      console.warn('Subscription not in pending state:', subscription.status)
      // Still allow - might be a retry
    }

    // Update subscription with payment ID if provided
    if (params.pg_payment_id && !subscription.pg_payment_id) {
      await supabase
        .from('subscriptions')
        .update({ pg_payment_id: params.pg_payment_id })
        .eq('id', subscription.id)
    }

    // Return OK - payment can proceed
    const xml = buildXmlResponse('ok', 'Order verified', scriptName)
    return new NextResponse(xml, {
      status: 200,
      headers: { 'Content-Type': 'application/xml; charset=utf-8' }
    })

  } catch (error) {
    console.error('Check callback error:', error)
    const xml = buildXmlResponse('error', 'Internal server error', scriptName)
    return new NextResponse(xml, {
      status: 200,
      headers: { 'Content-Type': 'application/xml; charset=utf-8' }
    })
  }
}

// Also handle GET requests (some payment systems use GET for callbacks)
export async function GET(request: NextRequest) {
  const scriptName = 'check'
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
