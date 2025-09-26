'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface LanguageContextType {
  locale: string
  setLocale: (locale: string) => void
  t: (key: string, fallback?: string) => string
  loading: boolean
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

interface LanguageProviderProps {
  children: ReactNode
}

export function LanguageProvider({ children }: LanguageProviderProps) {
  const [locale, setLocale] = useState('ru')
  const [translations, setTranslations] = useState<Record<string, string | Record<string, string>>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadTranslations = async () => {
      try {
        const response = await fetch(`/locales/${locale}/common.json`)
        const data = await response.json()
        setTranslations(data)
      } catch (error) {
        console.error('Error loading translations:', error)
        // Fallback to Russian if loading fails
        try {
          const response = await fetch('/locales/ru/common.json')
          const data = await response.json()
          setTranslations(data)
        } catch (fallbackError) {
          console.error('Error loading fallback translations:', fallbackError)
        }
      } finally {
        setLoading(false)
      }
    }

    loadTranslations()
  }, [locale])

  const t = (key: string, fallback?: string): string => {
    const keys = key.split('.')
    let value = translations
    
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k]
      } else {
        return fallback || key
      }
    }
    
    return typeof value === 'string' ? value : (fallback || key)
  }

  const handleSetLocale = (newLocale: string) => {
    setLocale(newLocale)
    // Store in localStorage for persistence
    localStorage.setItem('preferred-locale', newLocale)
  }

  // Load saved locale on mount
  useEffect(() => {
    const savedLocale = localStorage.getItem('preferred-locale')
    if (savedLocale && ['ru', 'en', 'kk'].includes(savedLocale)) {
      setLocale(savedLocale)
    }
  }, [])

  return (
    <LanguageContext.Provider value={{ locale, setLocale: handleSetLocale, t, loading }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}