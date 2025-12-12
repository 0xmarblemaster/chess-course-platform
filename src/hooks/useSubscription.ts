'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabaseClient'

export interface Subscription {
  id: string
  user_id: string
  pg_payment_id: string | null
  pg_order_id: string
  amount: number
  currency: string
  status: 'pending' | 'active' | 'expired' | 'cancelled' | 'failed'
  payment_method: string | null
  card_pan: string | null
  created_at: string
  paid_at: string | null
  expires_at: string | null
}

export interface UseSubscriptionResult {
  hasAccess: boolean
  subscription: Subscription | null
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
}

/**
 * Hook to check if the current user has an active subscription
 */
export function useSubscription(): UseSubscriptionResult {
  const { user } = useAuth()
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchSubscription = useCallback(async () => {
    if (!user) {
      setSubscription(null)
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const { data, error: fetchError } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (fetchError) {
        // No subscription found is not an error
        if (fetchError.code === 'PGRST116') {
          setSubscription(null)
        } else {
          console.error('Error fetching subscription:', fetchError)
          setError(fetchError.message)
        }
      } else {
        // Check if subscription is still valid (not expired)
        if (data.expires_at) {
          const expiresAt = new Date(data.expires_at)
          if (expiresAt < new Date()) {
            // Subscription expired
            setSubscription(null)
          } else {
            setSubscription(data as Subscription)
          }
        } else {
          // No expiry date = lifetime access
          setSubscription(data as Subscription)
        }
      }
    } catch (err) {
      console.error('Error in useSubscription:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    fetchSubscription()
  }, [fetchSubscription])

  // Calculate if user has access
  const hasAccess = subscription !== null && subscription.status === 'active'

  return {
    hasAccess,
    subscription,
    loading,
    error,
    refresh: fetchSubscription,
  }
}

/**
 * Check if a user has access (can be used server-side or in API routes)
 */
export async function checkUserAccess(userId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('id, status, expires_at')
      .eq('user_id', userId)
      .eq('status', 'active')
      .limit(1)
      .single()

    if (error || !data) {
      return false
    }

    // Check expiry
    if (data.expires_at) {
      const expiresAt = new Date(data.expires_at)
      if (expiresAt < new Date()) {
        return false
      }
    }

    return true
  } catch {
    return false
  }
}
