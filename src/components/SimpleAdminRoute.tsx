'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabaseClient'

interface SimpleAdminRouteProps {
  children: React.ReactNode
}

const SimpleAdminRoute: React.FC<SimpleAdminRouteProps> = ({ children }) => {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null)

  console.log('SimpleAdminRoute - Render. user:', user?.id, 'loading:', loading, 'isAdmin:', isAdmin)

  useEffect(() => {
    const checkAdmin = async () => {
      if (!user) {
        setIsAdmin(false)
        return
      }

      try {
        const { data, error } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single()

        if (error) {
          console.error('Error fetching user role:', error)
          setIsAdmin(false)
        } else {
          const isUserAdmin = data?.role === 'admin'
          console.log('SimpleAdminRoute - User role:', data?.role, 'isAdmin:', isUserAdmin)
          setIsAdmin(isUserAdmin)
        }
      } catch (error) {
        console.error('Error checking user role:', error)
        setIsAdmin(false)
      }
    }

    checkAdmin()
  }, [user])

  // Show loading while checking authentication
  if (loading || isAdmin === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Checking admin access...</p>
        </div>
      </div>
    )
  }

  // Redirect to login if not authenticated
  if (!user) {
    router.push('/login')
    return null
  }

  // Redirect to dashboard if not admin
  if (!isAdmin) {
    console.log('SimpleAdminRoute - Redirecting to dashboard. isAdmin:', isAdmin)
    router.push('/dashboard')
    return null
  }

  // Render admin content if user is admin
  console.log('SimpleAdminRoute - Rendering admin content. isAdmin:', isAdmin, 'user:', user?.id)
  return <>{children}</>
}

export default SimpleAdminRoute