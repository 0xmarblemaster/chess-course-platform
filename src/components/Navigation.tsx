'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabaseClient'

const Navigation = () => {
  const { user, signOut } = useAuth()
  const [userRole, setUserRole] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkUserRole = async () => {
      if (!user) {
        setUserRole(null)
        setLoading(false)
        return
      }

      try {
        console.log('Checking user role for:', user.id)
        
        const { data, error } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single()

        console.log('User role query result:', { data, error })

        if (error) {
          console.error('Error fetching user role:', error)
          // If user doesn't exist in public.users, create them
          if (error.code === 'PGRST116') {
            console.log('User not found in public.users, creating record...')
            const { error: insertError } = await supabase
              .from('users')
              .insert({ id: user.id, email: user.email, role: 'student' })
            
            if (insertError) {
              console.error('Error creating user record:', insertError)
              setUserRole(null)
            } else {
              setUserRole('student')
            }
          } else {
            setUserRole(null)
          }
        } else {
          setUserRole(data?.role || null)
        }
      } catch (error) {
        console.error('Error checking user role:', error)
        setUserRole(null)
      } finally {
        setLoading(false)
      }
    }

    checkUserRole()
  }, [user])

  const handleSignOut = async () => {
    await signOut()
  }

  if (loading) {
    return (
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center min-h-16 py-2">
            <div className="flex items-center">
              <Link href="/" className="text-lg sm:text-xl font-bold text-indigo-600 whitespace-nowrap">
                ♔ Chess Course
              </Link>
            </div>
            <div className="flex items-center">
              <div className="animate-pulse bg-gray-200 h-6 w-16 sm:h-8 sm:w-20 rounded"></div>
            </div>
          </div>
        </div>
      </nav>
    )
  }

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center min-h-16 py-2">
          <div className="flex items-center">
            <Link href="/" className="text-lg sm:text-xl font-bold text-indigo-600 whitespace-nowrap">
              ♔ Chess Course
            </Link>
          </div>

          <div className="flex items-center space-x-1 sm:space-x-4">
            {user ? (
              <>
                <Link
                  href="/dashboard"
                  className="text-gray-700 hover:text-indigo-600 px-2 sm:px-3 py-2 rounded-md text-xs sm:text-sm font-medium"
                >
                  Dashboard
                </Link>
                
                {userRole === 'admin' && (
                  <Link
                    href="/admin"
                    className="bg-indigo-600 text-white hover:bg-indigo-700 px-2 sm:px-3 py-2 rounded-md text-xs sm:text-sm font-medium"
                  >
                    Admin
                  </Link>
                )}
                
                <div className="relative group">
                  <button className="flex items-center text-gray-700 hover:text-indigo-600 px-1 sm:px-3 py-2 rounded-md text-xs sm:text-sm font-medium max-w-32 sm:max-w-none">
                    <span className="hidden sm:inline">{user.email}</span>
                    <span className="sm:hidden truncate">{user.email.split('@')[0]}</span>
                    <svg className="ml-1 h-3 w-3 sm:h-4 sm:w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                    <div className="px-4 py-2 text-xs text-gray-500 border-b">
                      {user.email}
                    </div>
                    <button
                      onClick={handleSignOut}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Sign Out
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-gray-700 hover:text-indigo-600 px-2 sm:px-3 py-2 rounded-md text-xs sm:text-sm font-medium"
                >
                  Login
                </Link>
                <Link
                  href="/signup"
                  className="bg-indigo-600 text-white hover:bg-indigo-700 px-2 sm:px-3 py-2 rounded-md text-xs sm:text-sm font-medium"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navigation