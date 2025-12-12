'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'

interface ProtectedRouteProps {
  children: React.ReactNode
  redirectTo?: string
}

export default function ProtectedRoute({ 
  children, 
  redirectTo = '/login' 
}: ProtectedRouteProps) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const authSuccess = searchParams.get('auth')
  const [authLoading, setAuthLoading] = useState(false)
  const [trialActive, setTrialActive] = useState<boolean | null>(null)
  const [lastHeartbeat, setLastHeartbeat] = useState<number>(0)

  useEffect(() => {
    // Check for trial session entitlements so trial users can see content without login
    const checkTrial = async () => {
      try {
        const res = await fetch('/api/trial/entitlements', { cache: 'no-store' })
        const data = await res.json()
        setTrialActive(!!data?.active)
      } catch {
        setTrialActive(false)
      }
    }
    checkTrial()
  }, [])

  // Heartbeat for trial sessions
  useEffect(() => {
    if (!trialActive) return
    const sendHeartbeat = async () => {
      try {
        await fetch('/api/trial/heartbeat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ route: typeof window !== 'undefined' ? window.location.pathname : null })
        })
        setLastHeartbeat(Date.now())
      } catch {
        // ignore
      }
    }
    // initial
    sendHeartbeat()
    const id = setInterval(sendHeartbeat, 60000)
    return () => clearInterval(id)
  }, [trialActive])

  useEffect(() => {
    // If we have an auth success parameter, give extra time for session to establish
    if (authSuccess === 'success' && loading) {
      setAuthLoading(true)
      const timer = setTimeout(() => {
        setAuthLoading(false)
      }, 2000) // Wait 2 seconds for auth state to settle
      
      return () => clearTimeout(timer)
    }
    
    if (!loading && !user && !authLoading && trialActive === false) {
      router.push(redirectTo)
    }
  }, [user, loading, router, redirectTo, authSuccess, authLoading, trialActive])

  // Show loading spinner while checking authentication
  if (loading || authLoading || trialActive === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">
            {authSuccess === 'success' ? 'Completing authentication...' : 'Loading...'}
          </p>
        </div>
      </div>
    )
  }

  // Don't render children if user is not authenticated
  if (!user && !trialActive) {
    return null
  }

  return <>{children}</>
}