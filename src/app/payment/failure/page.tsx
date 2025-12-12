'use client'

import { useSearchParams } from 'next/navigation'
import { useLanguage } from '@/contexts/LanguageContext'
import Link from 'next/link'

export default function PaymentFailurePage() {
  const { t } = useLanguage()
  const searchParams = useSearchParams()

  const errorCode = searchParams.get('pg_error_code')
  const errorDescription = searchParams.get('pg_error_description')
  const orderId = searchParams.get('pg_order_id')

  return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="bg-neutral-900 rounded-2xl p-8 border border-neutral-800">
          {/* Error Icon */}
          <div className="mx-auto w-16 h-16 bg-red-900/30 rounded-full flex items-center justify-center mb-6">
            <svg
              className="w-8 h-8 text-red-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </div>

          {/* Error Message */}
          <h1 className="text-2xl font-semibold text-white text-center mb-2">
            {t('payment.failure.title', 'Оплата не прошла')}
          </h1>
          <p className="text-neutral-400 text-sm text-center mb-6">
            {t('payment.failure.message', 'К сожалению, не удалось обработать ваш платеж. Пожалуйста, попробуйте еще раз или выберите другой способ оплаты.')}
          </p>

          {/* Error Details */}
          {(errorCode || errorDescription) && (
            <div className="bg-red-900/20 border border-red-800/50 rounded-xl p-4 mb-6 text-sm text-red-400">
              {errorDescription && <p>{errorDescription}</p>}
              {errorCode && (
                <p className="mt-1 text-xs text-red-500">
                  {t('payment.failure.errorCode', 'Код ошибки')}: {errorCode}
                </p>
              )}
            </div>
          )}

          {/* Common reasons */}
          <div className="bg-neutral-800/50 rounded-xl p-4 mb-6">
            <p className="text-sm font-medium text-neutral-300 mb-3">
              {t('payment.failure.possibleReasons', 'Возможные причины:')}
            </p>
            <ul className="text-sm text-neutral-400 space-y-2">
              <li className="flex items-start">
                <span className="mr-2 text-neutral-500">•</span>
                {t('payment.failure.reason1', 'Недостаточно средств на карте')}
              </li>
              <li className="flex items-start">
                <span className="mr-2 text-neutral-500">•</span>
                {t('payment.failure.reason2', 'Карта заблокирована или истек срок действия')}
              </li>
              <li className="flex items-start">
                <span className="mr-2 text-neutral-500">•</span>
                {t('payment.failure.reason3', 'Превышен лимит онлайн-платежей')}
              </li>
              <li className="flex items-start">
                <span className="mr-2 text-neutral-500">•</span>
                {t('payment.failure.reason4', 'Неверный код 3D Secure')}
              </li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Link
              href="/checkout"
              className="block w-full py-3.5 px-6 bg-white text-neutral-900 font-medium rounded-full text-center hover:bg-neutral-100 active:scale-[0.98] transition-all duration-200"
            >
              {t('payment.failure.tryAgain', 'Попробовать снова')}
            </Link>
            <Link
              href="/"
              className="block w-full py-3.5 px-6 bg-neutral-800 text-neutral-300 font-medium rounded-full text-center hover:bg-neutral-700 transition-all duration-200"
            >
              {t('payment.failure.backToHome', 'Вернуться на главную')}
            </Link>
          </div>

          {/* Support Link */}
          <div className="mt-8 pt-6 border-t border-neutral-800">
            <p className="text-neutral-500 text-sm text-center mb-4">
              {t('payment.failure.needHelp', 'Нужна помощь с оплатой?')}
            </p>
            <a
              href="https://api.whatsapp.com/send/?phone=77077872210&text=%D0%97%D0%B4%D1%80%D0%B0%D0%B2%D1%81%D1%82%D0%B2%D1%83%D0%B9%D1%82%D0%B5!%20%D0%A3%20%D0%BC%D0%B5%D0%BD%D1%8F%20%D0%BF%D1%80%D0%BE%D0%B1%D0%BB%D0%B5%D0%BC%D0%B0%20%D1%81%20%D0%BE%D0%BF%D0%BB%D0%B0%D1%82%D0%BE%D0%B9"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-3 px-6 bg-green-600 text-white font-medium rounded-full hover:bg-green-500 transition-colors"
            >
              <svg
                className="w-5 h-5"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              {t('payment.failure.whatsapp', 'Написать в WhatsApp')}
            </a>
          </div>

          {/* Order reference */}
          {orderId && (
            <p className="mt-6 text-xs text-neutral-600 text-center">
              {t('payment.failure.reference', 'Номер заказа')}: {orderId}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
