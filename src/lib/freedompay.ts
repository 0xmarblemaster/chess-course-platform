import crypto from 'crypto'

// FreedomPay Kazakhstan Payment Integration
// Documentation: https://docs.freedompay.kz/

const MERCHANT_ID = process.env.FREEDOMPAY_MERCHANT_ID!
const SECRET_KEY = process.env.FREEDOMPAY_SECRET_KEY!
const API_URL = process.env.FREEDOMPAY_API_URL || 'https://api.freedompay.kz'
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'

export interface PaymentParams {
  pg_order_id: string
  pg_merchant_id: string
  pg_amount: string
  pg_description: string
  pg_salt: string
  pg_currency?: string
  pg_check_url?: string
  pg_result_url?: string
  pg_success_url?: string
  pg_failure_url?: string
  pg_user_phone?: string
  pg_user_contact_email?: string
  pg_testing_mode?: string
  pg_language?: string
  [key: string]: string | undefined
}

export interface PaymentResponse {
  pg_status: 'ok' | 'error'
  pg_payment_id?: string
  pg_redirect_url?: string
  pg_redirect_url_type?: string
  pg_salt?: string
  pg_sig?: string
  pg_error_code?: string
  pg_error_description?: string
}

/**
 * Generate random salt for signature
 */
export function generateSalt(length: number = 16): string {
  return crypto.randomBytes(length).toString('hex')
}

/**
 * Generate MD5 signature for FreedomPay requests
 * Algorithm:
 * 1. Start with script name
 * 2. Add all parameters sorted alphabetically by key
 * 3. Append secret key
 * 4. Join with semicolons
 * 5. Calculate MD5 hash
 */
export function generateSignature(
  scriptName: string,
  params: Record<string, string | undefined>,
  secretKey: string = SECRET_KEY
): string {
  // Filter out undefined values and pg_sig
  const filteredParams: Record<string, string> = {}
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && key !== 'pg_sig') {
      filteredParams[key] = value
    }
  }

  // Sort keys alphabetically
  const sortedKeys = Object.keys(filteredParams).sort()

  // Build signature string: scriptName;value1;value2;...;secretKey
  const values = sortedKeys.map(key => filteredParams[key])
  const signatureString = [scriptName, ...values, secretKey].join(';')

  // Calculate MD5 hash
  return crypto.createHash('md5').update(signatureString).digest('hex')
}

/**
 * Verify signature from FreedomPay callback
 */
export function verifySignature(
  scriptName: string,
  params: Record<string, string | undefined>,
  signature: string,
  secretKey: string = SECRET_KEY
): boolean {
  const calculatedSig = generateSignature(scriptName, params, secretKey)
  return calculatedSig.toLowerCase() === signature.toLowerCase()
}

/**
 * Initialize payment and get redirect URL
 */
export async function initPayment(
  orderId: string,
  amount: number,
  description: string,
  userEmail?: string,
  userPhone?: string,
  testMode: boolean = true
): Promise<PaymentResponse> {
  const salt = generateSalt()

  const params: PaymentParams = {
    pg_order_id: orderId,
    pg_merchant_id: MERCHANT_ID,
    pg_amount: amount.toFixed(2),
    pg_description: description,
    pg_salt: salt,
    pg_currency: 'KZT',
    pg_check_url: `${BASE_URL}/api/payment/check`,
    pg_result_url: `${BASE_URL}/api/payment/result`,
    pg_success_url: `${BASE_URL}/payment/success`,
    pg_failure_url: `${BASE_URL}/payment/failure`,
    pg_language: 'ru',
  }

  if (userEmail) {
    params.pg_user_contact_email = userEmail
  }

  if (userPhone) {
    params.pg_user_phone = userPhone
  }

  if (testMode) {
    params.pg_testing_mode = '1'
  }

  // Generate signature
  const signature = generateSignature('init_payment.php', params)
  params.pg_sig = signature

  // Build form data
  const formData = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) {
      formData.append(key, value)
    }
  }

  try {
    const response = await fetch(`${API_URL}/init_payment.php`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    })

    const text = await response.text()
    return parseXmlResponse(text)
  } catch (error) {
    console.error('FreedomPay init_payment error:', error)
    return {
      pg_status: 'error',
      pg_error_description: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Parse XML response from FreedomPay
 */
export function parseXmlResponse(xml: string): PaymentResponse {
  const result: PaymentResponse = { pg_status: 'error' }

  // Simple XML parser for FreedomPay responses
  const getTagValue = (tag: string): string | undefined => {
    const match = xml.match(new RegExp(`<${tag}>([^<]*)</${tag}>`))
    return match ? match[1] : undefined
  }

  result.pg_status = (getTagValue('pg_status') as 'ok' | 'error') || 'error'
  result.pg_payment_id = getTagValue('pg_payment_id')
  result.pg_redirect_url = getTagValue('pg_redirect_url')
  result.pg_redirect_url_type = getTagValue('pg_redirect_url_type')
  result.pg_salt = getTagValue('pg_salt')
  result.pg_sig = getTagValue('pg_sig')
  result.pg_error_code = getTagValue('pg_error_code')
  result.pg_error_description = getTagValue('pg_error_description')

  return result
}

/**
 * Build XML response for FreedomPay callbacks
 */
export function buildXmlResponse(
  status: 'ok' | 'rejected' | 'error',
  description: string,
  scriptName: string
): string {
  const salt = generateSalt()

  const params = {
    pg_status: status,
    pg_description: description,
    pg_salt: salt,
  }

  const signature = generateSignature(scriptName, params)

  return `<?xml version="1.0" encoding="utf-8"?>
<response>
  <pg_status>${status}</pg_status>
  <pg_description>${description}</pg_description>
  <pg_salt>${salt}</pg_salt>
  <pg_sig>${signature}</pg_sig>
</response>`
}

/**
 * Parse form data from FreedomPay callback
 */
export function parseCallbackParams(formData: FormData): Record<string, string> {
  const params: Record<string, string> = {}
  formData.forEach((value, key) => {
    if (typeof value === 'string') {
      params[key] = value
    }
  })
  return params
}

/**
 * Parse URL search params from FreedomPay callback
 */
export function parseUrlParams(searchParams: URLSearchParams): Record<string, string> {
  const params: Record<string, string> = {}
  searchParams.forEach((value, key) => {
    params[key] = value
  })
  return params
}

// Export constants for use in other files
export const FREEDOMPAY_CONFIG = {
  MERCHANT_ID,
  API_URL,
  BASE_URL,
  PRICE_KZT: 19900,
  PRODUCT_NAME: '60 шагов до 4 разряда - Полный доступ',
  CURRENCY: 'KZT',
}
