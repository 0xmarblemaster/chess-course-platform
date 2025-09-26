'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabaseClient'
import { useLanguage } from '@/contexts/LanguageContext'
import LanguageSwitcher from './LanguageSwitcher'

const Navigation = () => {
  const { user, signOut } = useAuth()
  const { t } = useLanguage()
  const [userRole, setUserRole] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

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
          console.log('Navigation - User role data:', data)
          console.log('Navigation - User role value:', data?.role)
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
    setMobileMenuOpen(false)
  }

  const toggleMobileMenu = () => {
    console.log('Mobile menu toggled, current state:', mobileMenuOpen)
    console.log('Window width:', window.innerWidth)
    setMobileMenuOpen(!mobileMenuOpen)
  }

  console.log('Navigation component rendering, mobileMenuOpen:', mobileMenuOpen)

  if (loading) {
    return (
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center min-h-16 py-2">
            <div className="flex items-center">
              <Link href="/" className="text-lg sm:text-xl font-bold text-indigo-600 whitespace-nowrap">
                {t('nav.chessEmpire', '♔ Chess Empire')}
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
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="text-lg sm:text-xl font-bold text-indigo-600 whitespace-nowrap">
              {t('nav.chessEmpire', '♔ Chess Empire')}
            </Link>
          </div>

          {/* Desktop Navigation - Hidden on mobile */}
          <div className="desktop-nav items-center space-x-4" data-testid="desktop-nav">
            {user ? (
              <>
                <Link
                  href="/dashboard"
                  className="text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium"
                >
                  {t('navigation.dashboard', 'Dashboard')}
                </Link>
                
                {userRole === 'admin' && (
                  <Link
                    href="/admin"
                    className="bg-indigo-600 text-white hover:bg-indigo-700 px-3 py-2 rounded-md text-sm font-medium"
                  >
                    {t('navigation.admin', 'Admin')}
                  </Link>
                )}
                
                <LanguageSwitcher />
                
                <div className="relative group">
                  <button className="flex items-center text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium">
                    <span>{user.email}</span>
                    <svg className="ml-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                    <div className="px-4 py-2 text-xs text-gray-500 border-b">
                      {user.email || 'User'}
                    </div>
                    <button
                      onClick={handleSignOut}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      {t('navigation.logout', 'Sign Out')}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium"
                >
                  {t('navigation.login', 'Login')}
                </Link>
                <Link
                  href="/signup"
                  className="bg-indigo-600 text-white hover:bg-indigo-700 px-3 py-2 rounded-md text-sm font-medium"
                >
                  {t('navigation.signup', 'Sign Up')}
                </Link>
                <LanguageSwitcher />
              </>
            )}
          </div>

          {/* Mobile Menu Button - Only visible on mobile */}
          <div className="mobile-menu-button items-center" data-testid="mobile-menu-button" style={{ backgroundColor: 'red', minWidth: '50px', minHeight: '50px' }}>
            <button
              onClick={toggleMobileMenu}
              className="text-gray-700 hover:text-indigo-600 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500 rounded-md p-2"
              aria-label="Toggle menu"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="mobile-menu bg-white border-t border-gray-200 py-2 space-y-1">
            <div className="space-y-1">
              {user ? (
                <>
                  <Link
                    href="/dashboard"
                    className="block px-4 py-2 text-gray-700 hover:text-indigo-600 hover:bg-gray-50 rounded-md text-sm font-medium"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {t('navigation.dashboard', 'Dashboard')}
                  </Link>
                  
                  {userRole === 'admin' && (
                    <Link
                      href="/admin"
                      className="block px-4 py-2 bg-indigo-600 text-white hover:bg-indigo-700 rounded-md text-sm font-medium"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {t('navigation.admin', 'Admin')}
                    </Link>
                  )}
                  
                  <div className="px-4 py-2">
                    <LanguageSwitcher />
                  </div>
                  
                  <div className="px-4 py-2 border-t border-gray-200">
                    <div className="text-xs text-gray-500 mb-2">
                      {user.email || 'User'}
                    </div>
                    <button
                      onClick={handleSignOut}
                      className="block w-full text-left px-2 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md"
                    >
                      {t('navigation.logout', 'Sign Out')}
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="block px-4 py-2 text-gray-700 hover:text-indigo-600 hover:bg-gray-50 rounded-md text-sm font-medium"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {t('navigation.login', 'Login')}
                  </Link>
                  <Link
                    href="/signup"
                    className="block px-4 py-2 bg-indigo-600 text-white hover:bg-indigo-700 rounded-md text-sm font-medium"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {t('navigation.signup', 'Sign Up')}
                  </Link>
                  <div className="px-4 py-2">
                    <LanguageSwitcher />
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}

export default Navigation