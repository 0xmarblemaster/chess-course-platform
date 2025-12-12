'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useLanguage } from '@/contexts/LanguageContext'
import Link from 'next/link'

export default function PaymentSuccessPage() {
  const { user } = useAuth()
  const { t } = useLanguage()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [countdown, setCountdown] = useState(10)

  const orderId = searchParams.get('pg_order_id')
  const paymentId = searchParams.get('pg_payment_id')

  // Auto-redirect to dashboard after 10 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          router.push('/dashboard')
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        {/* Success Icon */}
        <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
          <svg
            className="w-12 h-12 text-green-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>

        {/* Success Message */}
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
          {t('payment.success.title', 'Оплата прошла успешно!')}
        </h1>
        <p className="text-gray-600 mb-6">
          {t('payment.success.message', 'Добро пожаловать в Chess Empire! Ваш доступ к курсу активирован.')}
        </p>

        {/* Order Details */}
        {orderId && (
          <div className="bg-gray-50 rounded-lg p-4 mb-6 text-sm text-gray-600">
            <p>
              {t('payment.success.orderId', 'Номер заказа')}: <span className="font-mono">{orderId}</span>
            </p>
            {paymentId && (
              <p className="mt-1">
                {t('payment.success.paymentId', 'ID платежа')}: <span className="font-mono">{paymentId}</span>
              </p>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          <Link
            href="/dashboard"
            className="block w-full py-3 px-6 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold rounded-xl hover:from-green-600 hover:to-emerald-600 transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            {t('payment.success.goToDashboard', 'Перейти к обучению')}
          </Link>
          <p className="text-sm text-gray-500">
            {t('payment.success.autoRedirect', 'Автоматический переход через')} {countdown} {t('payment.success.seconds', 'сек.')}
          </p>
        </div>

        {/* Support Link */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-gray-500 text-sm">
            {t('payment.success.questions', 'Нужна помощь?')}{' '}
            <a
              href="https://api.whatsapp.com/send/?phone=77077872210"
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-600 hover:text-indigo-800"
            >
              {t('payment.success.contact', 'Напишите нам')}
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
