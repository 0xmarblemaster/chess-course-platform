'use client'

import { useState, useRef, useEffect } from 'react'
import { useLanguage } from '@/contexts/LanguageContext'

const languages = [
  { code: 'ru', name: 'Русский', nativeName: 'Русский' },
  { code: 'kk', name: 'Kazakh', nativeName: 'Қазақша' },
  { code: 'en', name: 'English', nativeName: 'English' },
]

export default function LanguageSwitcher() {
  const { locale, setLocale } = useLanguage()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const currentLanguage = languages.find(lang => lang.code === locale) || languages[0]

  const handleLanguageChange = (newLocale: string) => {
    setLocale(newLocale)
    setIsOpen(false)
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Circular Planet Icon Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="language-globe-button"
        aria-label="Change language"
        title={`Current language: ${currentLanguage.name}`}
      >
        <svg
          width="36"
          height="36"
          viewBox="0 0 36 36"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="language-globe-icon"
        >
          {/* Outer circle */}
          <circle cx="18" cy="18" r="16" stroke="currentColor" strokeWidth="2" fill="none"/>

          {/* Horizontal lines (latitude) */}
          <ellipse cx="18" cy="18" rx="16" ry="5" stroke="currentColor" strokeWidth="1.5" fill="none"/>
          <line x1="2" y1="18" x2="34" y2="18" stroke="currentColor" strokeWidth="1.5"/>
          <ellipse cx="18" cy="18" rx="16" ry="11" stroke="currentColor" strokeWidth="1" fill="none" opacity="0.5"/>

          {/* Vertical line (longitude) */}
          <ellipse cx="18" cy="18" rx="6" ry="16" stroke="currentColor" strokeWidth="1.5" fill="none"/>
          <ellipse cx="18" cy="18" rx="11" ry="16" stroke="currentColor" strokeWidth="1" fill="none" opacity="0.5"/>
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="language-dropdown">
          <div className="language-dropdown-header">
            Select Language
          </div>
          {languages.map((language) => (
            <button
              key={language.code}
              onClick={() => handleLanguageChange(language.code)}
              className={`language-option ${
                locale === language.code ? 'language-option-active' : ''
              }`}
            >
              <span className="language-option-text">{language.nativeName}</span>
              {locale === language.code && (
                <svg className="language-check-icon" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}