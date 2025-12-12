'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useLanguage } from '@/contexts/LanguageContext'

export default function CheckoutPage() {
  const { user } = useAuth()
  const { t } = useLanguage()

  const [step, setStep] = useState<'product' | 'email'>('product')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const effectiveEmail = user?.email || email

  const handleProceedToEmail = () => {
    // If user is logged in, skip email step and go directly to payment
    if (user?.email) {
      handlePayment(user.email)
    } else {
      setStep('email')
    }
  }

  const handlePayment = async (paymentEmail: string) => {
    if (!paymentEmail || !paymentEmail.includes('@')) {
      setError(t('checkout.emailRequired', 'Введите корректный email'))
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/payment/init', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user?.id || null,
          userEmail: paymentEmail,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Payment initialization failed')
      }

      if (data.redirectUrl) {
        window.location.href = data.redirectUrl
      } else {
        throw new Error('No redirect URL received')
      }
    } catch (err) {
      console.error('Payment error:', err)
      setError(err instanceof Error ? err.message : 'Payment failed')
      setLoading(false)
    }
  }

  const features = [
    t('checkout.feature1', '100+ видеоуроков от ФИДЕ мастера'),
    t('checkout.feature2', 'Интерактивные задания на каждом уроке'),
    t('checkout.feature3', 'Тренировочные позиции'),
    t('checkout.feature4', 'Отслеживание прогресса'),
    t('checkout.feature5', 'Сертификат о прохождении'),
    t('checkout.feature6', '4 бонусных урока с тренером'),
    t('checkout.feature7', 'Занятия на русском и казахском'),
  ]

  // Step 2: Email input page
  if (step === 'email') {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="bg-neutral-900 rounded-2xl p-8 border border-neutral-800">
            {/* Back button */}
            <button
              onClick={() => setStep('product')}
              className="flex items-center gap-2 text-neutral-400 hover:text-white mb-6 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              {t('checkout.back', 'Назад')}
            </button>

            {/* Header */}
            <h1 className="text-2xl font-semibold text-white mb-2">
              {t('checkout.emailTitle', 'Введите ваш email')}
            </h1>
            <p className="text-neutral-400 text-sm mb-8">
              {t('checkout.emailDescription', 'На этот адрес будет отправлен доступ к курсу после оплаты')}
            </p>

            {/* Email Input */}
            <div className="mb-6">
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('checkout.emailPlaceholder', 'your@email.com')}
                autoFocus
                className="w-full px-4 py-4 bg-neutral-800 border border-neutral-700 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors text-lg"
              />
            </div>

            {/* Error message */}
            {error && (
              <div className="mb-6 bg-red-900/30 border border-red-800 text-red-400 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Continue Button */}
            <button
              onClick={() => handlePayment(email)}
              disabled={loading || !email}
              className={`w-full py-4 px-6 rounded-full font-medium text-base transition-all duration-200 ${
                loading || !email
                  ? 'bg-neutral-700 text-neutral-400 cursor-not-allowed'
                  : 'bg-white text-neutral-900 hover:bg-neutral-100 active:scale-[0.98]'
              }`}
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {t('checkout.processing', 'Обработка...')}
                </span>
              ) : (
                t('checkout.continueToPayment', 'Перейти к оплате')
              )}
            </button>

            {/* Secure note */}
            <div className="mt-6 flex items-center justify-center gap-2 text-neutral-500 text-xs">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              {t('checkout.securePayment', 'Безопасная оплата через FreedomPay')}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Step 1: Product page
  return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Dark Card */}
        <div className="bg-neutral-900 rounded-2xl p-8 border border-neutral-800">
          {/* Plan Name */}
          <h1 className="text-xl font-semibold text-amber-400 mb-6">
            {t('checkout.planName', '60 шагов до 4 разряда')}
          </h1>

          {/* Price */}
          <div className="mb-2">
            <span className="text-5xl font-bold text-white">₸19 900</span>
            <span className="text-neutral-400 text-lg ml-1">{t('checkout.perMonth', '/месяц')}</span>
          </div>
          <p className="text-neutral-500 text-sm mb-8">
            {t('checkout.billedOnce', 'Единоразовый платеж')}
          </p>

          {/* CTA Button */}
          <button
            onClick={handleProceedToEmail}
            disabled={loading}
            className={`w-full py-3.5 px-6 rounded-full font-medium text-base transition-all duration-200 mb-8 ${
              loading
                ? 'bg-neutral-700 text-neutral-400 cursor-not-allowed'
                : 'bg-white text-neutral-900 hover:bg-neutral-100 active:scale-[0.98]'
            }`}
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {t('checkout.processing', 'Обработка...')}
              </span>
            ) : (
              t('checkout.payNow', 'Оплатить')
            )}
          </button>

          {/* Features List */}
          <div className="space-y-4">
            {features.map((feature, index) => (
              <div key={index} className="flex items-start gap-3">
                <svg
                  className="w-5 h-5 text-neutral-400 mt-0.5 flex-shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-neutral-300 text-sm">{feature}</span>
              </div>
            ))}
          </div>

          {/* Secure Payment Note */}
          <div className="mt-8 pt-6 border-t border-neutral-800">
            <div className="flex items-center justify-center gap-2 text-neutral-500 text-xs">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              {t('checkout.securePayment', 'Безопасная оплата через FreedomPay')}
            </div>
          </div>

          {/* Contact */}
          <div className="mt-4 text-center">
            <a
              href="https://api.whatsapp.com/send/?phone=77077872210"
              target="_blank"
              rel="noopener noreferrer"
              className="text-neutral-500 hover:text-neutral-300 text-xs transition-colors"
            >
              {t('checkout.questions', 'Есть вопросы?')} {t('checkout.contactWhatsApp', 'WhatsApp')}
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
