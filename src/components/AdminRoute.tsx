'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabaseClient'


interface AdminRouteProps {
  children: React.ReactNode
}

const AdminRoute: React.FC<AdminRouteProps> = ({ children }) => {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [userRole, setUserRole] = useState<string | null>(null)
  const [checkingRole, setCheckingRole] = useState(true)

  useEffect(() => {
    const checkUserRole = async () => {
      if (!user) {
        setCheckingRole(false)
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
          setUserRole(null)
        } else {
          setUserRole(data?.role || null)
        }
      } catch (error) {
        console.error('Error checking user role:', error)
        setUserRole(null)
      } finally {
        setCheckingRole(false)
      }
    }

    checkUserRole()
  }, [user])

  // Show loading while checking authentication and role
  if (loading || checkingRole) {
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
  if (userRole !== 'admin') {
    router.push('/dashboard')
    return null
  }

  // Render admin content if user is admin
  return <>{children}</>
}

export default AdminRoute