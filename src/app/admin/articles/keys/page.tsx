'use client'

import { useCallback, useEffect, useState } from 'react'
import { ArticlesShell, btn, ConfirmDialog, useToast } from '@/components/articles/ui'
import { articlesApi, ApiError } from '@/lib/articles/client'

interface ApiKey {
  id: string
  name: string
  key_prefix: string
  created_at: string
  last_used_at: string | null
  revoked_at: string | null
}

const fmt = (iso: string | null) => (iso ? new Date(iso).toLocaleString('ru-RU', { dateStyle: 'short', timeStyle: 'short' }) : '—')

export default function ArticleKeysPage() {
  const [keys, setKeys] = useState<ApiKey[] | null>(null)
  const [error, setError] = useState('')
  const [name, setName] = useState('')
  const [nameError, setNameError] = useState('')
  const [created, setCreated] = useState<{ name: string; key: string } | null>(null)
  const [revoking, setRevoking] = useState<ApiKey | null>(null)
  const [busy, setBusy] = useState(false)
  const toast = useToast()

  const load = useCallback(async () => {
    try {
      setKeys((await articlesApi<{ keys: ApiKey[] }>('/keys')).keys)
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not load keys')
    }
  }, [])
  useEffect(() => { load() }, [load])

  const create = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return setNameError('Give the key a name, e.g. who or what will use it')
    setBusy(true)
    try {
      const res = await articlesApi<{ key: string }>('/keys', { method: 'POST', body: JSON.stringify({ name }) })
      setCreated({ name: name.trim(), key: res.key })
      setName('')
      load()
    } catch (err) {
      if (err instanceof ApiError && err.fields.name) setNameError(err.fields.name)
      else toast.show(err instanceof Error ? err.message : 'Failed', true)
    } finally {
      setBusy(false)
    }
  }

  const revoke = async () => {
    const k = revoking!
    setRevoking(null)
    try {
      await articlesApi(`/keys/${k.id}`, { method: 'DELETE' })
      toast.show(`Revoked “${k.name}”`)
      load()
    } catch (e) {
      toast.show(e instanceof Error ? e.message : 'Failed', true)
    }
  }

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(created!.key)
      toast.show('Key copied')
    } catch {
      toast.show('Copy failed — select the key and copy it by hand', true)
    }
  }

  return (
    <ArticlesShell title="Articles API keys" keysOnly>
      <p className="mb-4 max-w-3xl text-sm text-gray-600">
        Keys let scripts and integrations create, edit and delete articles through <code>/api/articles</code> (see docs/articles-api.md).
        Send them as <code>Authorization: Bearer cea_…</code>. Only a hash is stored, so a key is shown once, right after it is created.
      </p>

      <form onSubmit={create} noValidate className="mb-6 flex flex-col gap-3 rounded-lg bg-white p-4 shadow sm:flex-row sm:items-start">
        <label className="flex-1 text-sm font-medium text-gray-700">Key name
          <input value={name} onChange={(e) => { setName(e.target.value); setNameError('') }} maxLength={80} placeholder="e.g. Content bot"
            aria-invalid={!!nameError} className={`mt-1 block min-h-10 w-full rounded-md border px-3 text-sm text-gray-900 ${nameError ? 'border-red-500' : 'border-gray-300'}`} />
          {nameError && <span className="mt-1 block text-xs text-red-600">{nameError}</span>}
        </label>
        <button type="submit" className={btn.primary + ' sm:mt-6'} disabled={busy}>Create key</button>
      </form>

      {created && (
        <div role="alert" className="mb-6 rounded-lg border border-amber-300 bg-amber-50 p-4">
          <p className="text-sm font-semibold text-amber-900">Copy the key for “{created.name}” now — it won&apos;t be shown again.</p>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <code data-testid="new-key" className="flex-1 select-all break-all rounded bg-white px-3 py-2 font-mono text-sm text-gray-900 ring-1 ring-amber-200">{created.key}</code>
            <button type="button" className={btn.secondary} onClick={copy}>Copy</button>
            <button type="button" className={btn.secondary} onClick={() => setCreated(null)}>Done</button>
          </div>
        </div>
      )}

      {error && <p className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {!keys && !error && <p className="text-gray-500">Loading…</p>}
      {keys && !keys.length && <p className="rounded-lg bg-white p-6 text-center text-gray-500 shadow">No keys yet.</p>}
      {keys && keys.length > 0 && (
        <ul className="divide-y divide-gray-200 rounded-lg bg-white shadow">
          {keys.map((k) => (
            <li key={k.id} className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="font-medium text-gray-900">
                  {k.name} <code className="ml-1 rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-600">{k.key_prefix}…</code>
                  {k.revoked_at && <span className="ml-2 rounded-full bg-gray-200 px-2 py-0.5 text-xs text-gray-700">Revoked {fmt(k.revoked_at)}</span>}
                </div>
                <div className="mt-1 text-xs text-gray-500">Created {fmt(k.created_at)} · Last used {fmt(k.last_used_at)}</div>
              </div>
              {!k.revoked_at && <button type="button" className={btn.secondary + ' !text-red-600'} onClick={() => setRevoking(k)}>Revoke</button>}
            </li>
          ))}
        </ul>
      )}

      <ConfirmDialog open={!!revoking} title="Revoke key?" confirmLabel="Revoke"
        body={`Anything using “${revoking?.name}” will get 401 errors from now on. This can't be undone.`}
        onConfirm={revoke} onCancel={() => setRevoking(null)} />
      {toast.node}
    </ArticlesShell>
  )
}
