'use client'

import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useLanguage } from '@/contexts/LanguageContext'
import { supabase } from '@/lib/supabaseClient'
import Link from 'next/link'

interface Subscription {
  id: string
  user_id: string
  pg_payment_id: string | null
  pg_order_id: string
  amount: number
  currency: string
  status: 'pending' | 'active' | 'expired' | 'cancelled' | 'failed'
  payment_method: string | null
  card_pan: string | null
  user_email: string | null
  created_at: string
  paid_at: string | null
  expires_at: string | null
}

export default function AdminPaymentsPage() {
  const { user } = useAuth()
  const { t } = useLanguage()

  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState<string>('all')
  const [searchEmail, setSearchEmail] = useState('')
  const [stats, setStats] = useState({
    totalRevenue: 0,
    activeSubscriptions: 0,
    pendingPayments: 0,
    failedPayments: 0,
  })

  // Grant subscription modal
  const [showGrantModal, setShowGrantModal] = useState(false)
  const [grantEmail, setGrantEmail] = useState('')
  const [grantLoading, setGrantLoading] = useState(false)
  const [grantError, setGrantError] = useState('')

  const fetchSubscriptions = useCallback(async () => {
    try {
      setLoading(true)
      setError('')

      let query = supabase
        .from('subscriptions')
        .select('*')
        .order('created_at', { ascending: false })

      if (filter !== 'all') {
        query = query.eq('status', filter)
      }

      if (searchEmail) {
        query = query.ilike('user_email', `%${searchEmail}%`)
      }

      const { data, error: fetchError } = await query

      if (fetchError) {
        throw fetchError
      }

      setSubscriptions(data || [])

      // Calculate stats
      const allSubs = data || []
      const totalRevenue = allSubs
        .filter(s => s.status === 'active')
        .reduce((sum, s) => sum + (s.amount || 0), 0)
      const activeSubscriptions = allSubs.filter(s => s.status === 'active').length
      const pendingPayments = allSubs.filter(s => s.status === 'pending').length
      const failedPayments = allSubs.filter(s => s.status === 'failed').length

      setStats({
        totalRevenue,
        activeSubscriptions,
        pendingPayments,
        failedPayments,
      })
    } catch (err) {
      console.error('Error fetching subscriptions:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch subscriptions')
    } finally {
      setLoading(false)
    }
  }, [filter, searchEmail])

  useEffect(() => {
    fetchSubscriptions()
  }, [fetchSubscriptions])

  const handleGrantSubscription = async () => {
    if (!grantEmail) return

    setGrantLoading(true)
    setGrantError('')

    try {
      // Find user by email
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('email', grantEmail)
        .single()

      if (userError || !userData) {
        throw new Error('User not found with this email')
      }

      // Create active subscription
      const now = new Date()
      const expiresAt = new Date(now)
      expiresAt.setFullYear(expiresAt.getFullYear() + 1)

      const { error: insertError } = await supabase
        .from('subscriptions')
        .insert({
          user_id: userData.id,
          pg_order_id: `MANUAL-${Date.now()}`,
          amount: 0,
          currency: 'KZT',
          status: 'active',
          payment_method: 'manual',
          user_email: grantEmail,
          paid_at: now.toISOString(),
          expires_at: expiresAt.toISOString(),
        })

      if (insertError) {
        throw insertError
      }

      setShowGrantModal(false)
      setGrantEmail('')
      fetchSubscriptions()
    } catch (err) {
      console.error('Error granting subscription:', err)
      setGrantError(err instanceof Error ? err.message : 'Failed to grant subscription')
    } finally {
      setGrantLoading(false)
    }
  }

  const exportToCsv = () => {
    const headers = ['Date', 'Email', 'Amount', 'Status', 'Payment Method', 'Card', 'Order ID', 'Payment ID']
    const rows = subscriptions.map(s => [
      new Date(s.created_at).toLocaleDateString(),
      s.user_email || '',
      s.amount.toString(),
      s.status,
      s.payment_method || '',
      s.card_pan || '',
      s.pg_order_id,
      s.pg_payment_id || '',
    ])

    const csv = [headers.join(','), ...rows.map(r => r.map(c => `"${c}"`).join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `payments-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      active: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      failed: 'bg-red-100 text-red-800',
      expired: 'bg-gray-100 text-gray-800',
      cancelled: 'bg-orange-100 text-orange-800',
    }
    return styles[status] || 'bg-gray-100 text-gray-800'
  }

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div
      className="min-h-screen"
      style={{
        backgroundImage:
          'linear-gradient(107.7deg, rgba(235,230,44,0.55) 8.4%, rgba(252,152,15,1) 90.3%)'
      }}
    >
      {/* Header */}
      <div className="shadow" style={{
        backgroundImage:
          'linear-gradient(107.7deg, rgba(235,230,44,0.55) 8.4%, rgba(252,152,15,1) 90.3%)'
      }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {t('admin.payments.title', 'Payments Dashboard')}
              </h1>
              <p className="mt-1 text-sm text-gray-600">
                {t('admin.payments.subtitle', 'Manage subscriptions and payments')}
              </p>
            </div>
            <Link
              href="/admin"
              className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700 transition-colors"
            >
              {t('admin.backToAdmin', 'Back to Admin')}
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">{t('admin.payments.totalRevenue', 'Total Revenue')}</p>
                <p className="text-2xl font-bold text-gray-900">₸{stats.totalRevenue.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">{t('admin.payments.active', 'Active')}</p>
                <p className="text-2xl font-bold text-gray-900">{stats.activeSubscriptions}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">{t('admin.payments.pending', 'Pending')}</p>
                <p className="text-2xl font-bold text-gray-900">{stats.pendingPayments}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">{t('admin.payments.failed', 'Failed')}</p>
                <p className="text-2xl font-bold text-gray-900">{stats.failedPayments}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Actions */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="p-4 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex flex-col sm:flex-row gap-4">
                {/* Status Filter */}
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="all">{t('admin.payments.allStatuses', 'All Statuses')}</option>
                  <option value="active">{t('admin.payments.active', 'Active')}</option>
                  <option value="pending">{t('admin.payments.pending', 'Pending')}</option>
                  <option value="failed">{t('admin.payments.failed', 'Failed')}</option>
                  <option value="expired">{t('admin.payments.expired', 'Expired')}</option>
                  <option value="cancelled">{t('admin.payments.cancelled', 'Cancelled')}</option>
                </select>

                {/* Email Search */}
                <input
                  type="text"
                  placeholder={t('admin.payments.searchEmail', 'Search by email...')}
                  value={searchEmail}
                  onChange={(e) => setSearchEmail(e.target.value)}
                  className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-indigo-500 focus:border-indigo-500 w-full sm:w-64"
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setShowGrantModal(true)}
                  className="bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-green-700 transition-colors"
                >
                  {t('admin.payments.grantAccess', 'Grant Access')}
                </button>
                <button
                  onClick={exportToCsv}
                  className="bg-gray-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-700 transition-colors"
                >
                  {t('admin.payments.exportCsv', 'Export CSV')}
                </button>
              </div>
            </div>
          </div>

          {/* Table */}
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
            </div>
          ) : error ? (
            <div className="p-8 text-center text-red-600">{error}</div>
          ) : subscriptions.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              {t('admin.payments.noPayments', 'No payments found')}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('admin.payments.date', 'Date')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('admin.payments.user', 'User')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('admin.payments.amount', 'Amount')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('admin.payments.status', 'Status')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('admin.payments.method', 'Method')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('admin.payments.expires', 'Expires')}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {subscriptions.map((sub) => (
                    <tr key={sub.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(sub.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{sub.user_email || '-'}</div>
                        <div className="text-xs text-gray-500 font-mono">{sub.pg_order_id}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          ₸{sub.amount.toLocaleString()}
                        </div>
                        {sub.card_pan && (
                          <div className="text-xs text-gray-500">{sub.card_pan}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(sub.status)}`}>
                          {sub.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {sub.payment_method || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(sub.expires_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Grant Subscription Modal */}
      {showGrantModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {t('admin.payments.grantAccessTitle', 'Grant Subscription Access')}
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              {t('admin.payments.grantAccessDesc', 'Enter the email of the user to grant 1 year of free access.')}
            </p>
            <input
              type="email"
              placeholder="user@example.com"
              value={grantEmail}
              onChange={(e) => setGrantEmail(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 mb-4 focus:ring-indigo-500 focus:border-indigo-500"
            />
            {grantError && (
              <p className="text-sm text-red-600 mb-4">{grantError}</p>
            )}
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowGrantModal(false)
                  setGrantEmail('')
                  setGrantError('')
                }}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
              >
                {t('common.cancel', 'Cancel')}
              </button>
              <button
                onClick={handleGrantSubscription}
                disabled={grantLoading || !grantEmail}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                {grantLoading ? t('common.loading', 'Loading...') : t('admin.payments.grant', 'Grant Access')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
