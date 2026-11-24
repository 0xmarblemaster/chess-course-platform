'use client'

import Link from 'next/link'
import { useCallback, useEffect, useRef, useState } from 'react'
import AdminRoute from '@/components/AdminRoute'

/** Admin-guarded page frame shared by the /admin/articles pages. */
export function ArticlesShell({ title, actions, children }: { title: string; actions?: React.ReactNode; children: React.ReactNode }) {
  return (
    <AdminRoute>
      <div className="min-h-screen bg-gray-50">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
          <nav className="mb-2 text-sm text-gray-500" aria-label="Breadcrumb">
            <Link href="/admin" className="hover:underline">Admin</Link> <span aria-hidden="true">/</span>{' '}
            <Link href="/admin/articles" className="hover:underline">Articles</Link>
          </nav>
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
            {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
          </div>
          {children}
        </div>
      </div>
    </AdminRoute>
  )
}

export const btn = {
  primary: 'inline-flex min-h-10 items-center justify-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50',
  secondary: 'inline-flex min-h-10 items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50',
  danger: 'inline-flex min-h-10 items-center justify-center rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50',
}

export function StatusBadge({ status }: { status: string }) {
  const cls = status === 'published' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
  return <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${cls}`}>{status === 'published' ? 'Published' : 'Draft'}</span>
}

export function useToast() {
  const [toast, setToast] = useState<{ text: string; error?: boolean } | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)
  const show = useCallback((text: string, error = false) => {
    clearTimeout(timer.current)
    setToast({ text, error })
    timer.current = setTimeout(() => setToast(null), 3500)
  }, [])
  useEffect(() => () => clearTimeout(timer.current), [])
  const node = toast && (
    <div role="status" className={`fixed bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-md px-4 py-3 text-sm font-medium text-white shadow-lg ${toast.error ? 'bg-red-600' : 'bg-gray-900'}`}>
      {toast.text}
    </div>
  )
  return { show, node }
}

export function ConfirmDialog({ open, title, body, confirmLabel, onConfirm, onCancel }: {
  open: boolean; title: string; body: string; confirmLabel: string; onConfirm: () => void; onCancel: () => void
}) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4" onClick={onCancel}>
      <div role="alertdialog" aria-modal="true" aria-labelledby="confirm-title" className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <h2 id="confirm-title" className="text-lg font-semibold text-gray-900">{title}</h2>
        <p className="mt-2 text-sm text-gray-600">{body}</p>
        <div className="mt-6 flex justify-end gap-2">
          <button type="button" className={btn.secondary} onClick={onCancel} autoFocus>Cancel</button>
          <button type="button" className={btn.danger} onClick={onConfirm}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  )
}
