'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabaseClient'

import { useLanguage } from '@/contexts/LanguageContext'
import LanguageSwitcher from './LanguageSwitcher'
import { WHATSAPP_LEAD_URL } from '@/lib/whatsapp'

// Anchor links for the Classic homepage header (scroll to sections in page.tsx).
const HOME_NAV_LINKS = [
  { href: '#about', key: 'landing.nav_about' },
  { href: '#trainers', key: 'landing.nav_trainers' },
  { href: '#programs', key: 'landing.nav_programs' },
  { href: '#branches', key: 'landing.nav_branches' },
  { href: '#prices', key: 'landing.nav_prices' },
  { href: '#faq', key: 'landing.nav_faq' },
  { href: '#contacts', key: 'landing.nav_contacts' },
]

const Navigation = () => {
  const { user, signOut } = useAuth()
  const { t } = useLanguage()
  const pathname = usePathname()
  const isHome = pathname === '/'
  const [userRole, setUserRole] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const logoSrc = '/brand/chess-empire-logo.png'

  // Lock body scroll while the Classic mobile menu is open.
  useEffect(() => {
    if (!isHome) return
    document.body.classList.toggle('nav-open', mobileMenuOpen)
    return () => document.body.classList.remove('nav-open')
  }, [isHome, mobileMenuOpen])

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
    setMobileMenuOpen(!mobileMenuOpen)
  }

  // Classic homepage header: reuses the shared Navigation (auth + LanguageSwitcher)
  // but restyles it to the Chess (Classic) palette instead of adding a second header.
  if (isHome) {
    const closeMenu = () => setMobileMenuOpen(false)
    return (
      <div className="chess-classic">
        <a className="skip-link" href="#main">{t('landing.skip', 'Перейти к содержанию')}</a>
        <header className="site-header">
          <div className="wrap header-inner">
            <Link className="logo" href="/" onClick={closeMenu}>
              <Image src={logoSrc} alt="Chess Empire logo" width={22} height={36} priority className="object-contain logo-gradient logo-mark-img" />
              Chess Empire
            </Link>
            <nav className={`main-nav${mobileMenuOpen ? ' is-open' : ''}`} id="main-nav" aria-label={t('landing.menu', 'Меню')}>
              <ul>
                {HOME_NAV_LINKS.map((l) => (
                  <li key={l.href}><a href={l.href} onClick={closeMenu}>{t(l.key)}</a></li>
                ))}
              </ul>
            </nav>
            <div className="header-actions">
              {user && (
                <Link href="/dashboard" className="header-auth" onClick={closeMenu}>
                  {t('navigation.dashboard', 'Dashboard')}
                </Link>
              )}
              <LanguageSwitcher />
              <a className="btn btn-primary header-cta" href={WHATSAPP_LEAD_URL} target="_blank" rel="noopener noreferrer">
                {t('landing.header_cta')}
              </a>
              <button
                className="burger"
                type="button"
                aria-expanded={mobileMenuOpen}
                aria-controls="main-nav"
                aria-label={t('landing.menu', 'Меню')}
                onClick={toggleMobileMenu}
              >
                <span></span>
              </button>
            </div>
          </div>
        </header>
      </div>
    )
  }

  if (loading) {
    return (
      <nav
        className="shadow-sm border-b"
        style={{
          backgroundColor: '#ffffff'
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center min-h-16 py-2">
            <div className="flex items-center">
              <Link href="/" className="flex items-end space-x-3 hover:opacity-90 transition-opacity">
                <Image src={logoSrc} alt="Chess Empire logo" width={22} height={36} priority className="object-contain logo-gradient" />
                <span className="text-xl tracking-wide logo-text-gradient" style={{ fontFamily: 'Clear Sans, sans-serif' }}>
                  Chess Empire
                </span>
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
    <nav
      className="shadow-sm border-b"
      style={{
        backgroundColor: '#ffffff'
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center min-h-16 py-2">
          {/* Logo */}
          <div className="flex items-center">
              <Link href="/" className="flex items-end space-x-3 hover:opacity-90 transition-opacity">
                <Image src={logoSrc} alt="Chess Empire logo" width={22} height={36} priority className="object-contain logo-gradient" />
                <span className="text-xl tracking-wide logo-text-gradient" style={{ fontFamily: 'Clear Sans, sans-serif' }}>
                  Chess Empire
                </span>
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
                {/* Test users: show Dashboard button instead of Login/Register */}
                <Link
                  href="/dashboard"
                  className="bg-indigo-600 text-white hover:bg-indigo-700 px-3 py-2 rounded-md text-sm font-medium"
                >
                  {t('navigation.dashboard', 'Dashboard')}
                </Link>
                <LanguageSwitcher />
              </>
            )}
          </div>

          {/* Mobile Menu Button - Only visible on mobile */}
          <div className="mobile-menu-button items-center" data-testid="mobile-menu-button">
            <button
              onClick={toggleMobileMenu}
              className="text-gray-700 hover:text-indigo-600 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500 rounded-lg p-2 transition-colors duration-200 hover:bg-gray-100"
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
          <div className="mobile-menu bg-white border-t border-gray-200 py-3 space-y-1 shadow-lg">
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