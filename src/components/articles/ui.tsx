'use client'

import Link from 'next/link'
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { ApiError, articlesApi } from '@/lib/articles/client'
import { articlesSupabase } from '@/lib/articles/browser'

const signOut = () => articlesSupabase.auth.signOut()

type Access = { email: string | null; canManageKeys: boolean }
const AccessContext = createContext<Access>({ email: null, canManageKeys: false })

/** Link to the API keys page, only for users who may manage keys. */
export function KeysLink() {
  return useContext(AccessContext).canManageKeys ? <Link href="/admin/articles/keys" className={btn.secondary}>API keys</Link> : null
}

/**
 * Page frame shared by the /admin/articles pages, for users with the article permission
 * (keysOnly: also the admin role, for the API keys page).
 */
export function ArticlesShell({ title, actions, keysOnly, children }: { title: string; actions?: React.ReactNode; keysOnly?: boolean; children: React.ReactNode }) {
  return (
    <ArticlesGate keysOnly={keysOnly}>
      {({ email }) => (
        <div className="min-h-screen bg-gray-50">
          <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <nav className="text-sm text-gray-500" aria-label="Breadcrumb">
                <Link href="/admin" className="hover:underline">Admin</Link> <span aria-hidden="true">/</span>{' '}
                <Link href="/admin/articles" className="hover:underline">Articles</Link>
              </nav>
              <div className="flex items-center gap-3 text-sm text-gray-500">
                {email && <span className="hidden sm:inline">{email}</span>}
                <button type="button" className="font-medium text-indigo-600 hover:underline" onClick={signOut}>Выйти</button>
              </div>
            </div>
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
              <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
              {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
            </div>
            {children}
          </div>
        </div>
      )}
    </ArticlesGate>
  )
}

type GateState = { kind: 'loading' } | { kind: 'signed-out' } | { kind: 'forbidden'; message: string } | { kind: 'error'; message: string } | { kind: 'allowed'; access: Access }

/**
 * Sign-in for the articles project (its own session, apart from the main app's): no session →
 * email + password form; a session is then checked with GET /api/articles/me.
 */
function ArticlesGate({ keysOnly, children }: { keysOnly?: boolean; children: (access: Access) => React.ReactNode }) {
  const [state, setState] = useState<GateState>({ kind: 'loading' })

  useEffect(() => {
    let current = 0
    const check = async (signedIn: boolean) => {
      const run = ++current
      if (!signedIn) return setState({ kind: 'signed-out' })
      setState({ kind: 'loading' })
      let next: GateState
      try {
        const me = await articlesApi<Access>('/me')
        next = keysOnly && !me.canManageKeys ? { kind: 'forbidden', message: 'Ключами API управляют только администраторы' } : { kind: 'allowed', access: me }
      } catch (e) {
        const status = e instanceof ApiError ? e.status : 0
        if (status === 401) await signOut()
        next = status === 401 ? { kind: 'signed-out' } : status === 403 ? { kind: 'forbidden', message: 'Нет прав на управление статьями' } : { kind: 'error', message: (e as Error).message }
      }
      if (run === current) setState(next)
    }
    articlesSupabase.auth.getSession().then(({ data }) => check(!!data.session))
    const { data } = articlesSupabase.auth.onAuthStateChange((event, session) => {
      // Deferred: supabase-js holds its auth lock during this callback, and check() reads the session.
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') setTimeout(() => check(!!session))
    })
    return () => data.subscription.unsubscribe()
  }, [keysOnly])

  if (state.kind === 'allowed') return <AccessContext.Provider value={state.access}>{children(state.access)}</AccessContext.Provider>
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        {state.kind === 'loading' && <p className="text-center text-sm text-gray-500" role="status">Загрузка…</p>}
        {state.kind === 'signed-out' && <SignInForm />}
        {(state.kind === 'forbidden' || state.kind === 'error') && (
          <div className="text-center">
            <p className="mb-4 font-medium text-gray-900" role="alert">{state.message}</p>
            <button type="button" className={btn.secondary} onClick={signOut}>Выйти</button>
          </div>
        )}
      </div>
    </div>
  )
}

function SignInForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError('')
    const { error } = await articlesSupabase.auth.signInWithPassword({ email: email.trim(), password })
    setBusy(false)
    if (error) setError(error.message)
  }
  const input = 'mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500'
  return (
    <form onSubmit={submit} className="space-y-4">
      <h1 className="text-lg font-semibold text-gray-900">Вход для администраторов</h1>
      <label className="block text-sm font-medium text-gray-700">
        Email
        <input type="email" required autoComplete="username" className={input} value={email} onChange={(e) => setEmail(e.target.value)} />
      </label>
      <label className="block text-sm font-medium text-gray-700">
        Пароль
        <input type="password" required autoComplete="current-password" className={input} value={password} onChange={(e) => setPassword(e.target.value)} />
      </label>
      {error && <p className="text-sm text-red-600" role="alert">{error}</p>}
      <button type="submit" className={`${btn.primary} w-full`} disabled={busy}>Войти</button>
    </form>
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
