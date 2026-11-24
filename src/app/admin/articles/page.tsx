'use client'

import Link from 'next/link'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { ArticlesShell, btn, ConfirmDialog, StatusBadge, useToast } from '@/components/articles/ui'
import { articlesApi, ApiError } from '@/lib/articles/client'
import { TOPICS, type Article } from '@/lib/articles/schema'

const TOPIC_LABELS: Record<string, string> = { parents: 'Parents', beginners: 'Beginners', tournaments: 'Tournaments' }
const fmt = (iso: string) => new Date(iso).toLocaleString('ru-RU', { dateStyle: 'short', timeStyle: 'short' })

export default function AdminArticlesPage() {
  const [articles, setArticles] = useState<Article[] | null>(null)
  const [error, setError] = useState('')
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('')
  const [topic, setTopic] = useState('')
  const [deleting, setDeleting] = useState<Article | null>(null)
  const toast = useToast()

  const load = useCallback(async () => {
    try {
      setArticles((await articlesApi<{ articles: Article[] }>('?all=1')).articles)
      setError('')
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not load articles')
    }
  }, [])
  useEffect(() => { load() }, [load])

  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase()
    return (articles || []).filter((a) =>
      (!status || a.status === status) && (!topic || a.topic === topic) &&
      (!needle || [a.slug, a.title_ru, a.title_en, a.title_kk].some((s) => s.toLowerCase().includes(needle))))
  }, [articles, q, status, topic])

  const setPublished = async (a: Article, publish: boolean) => {
    try {
      await articlesApi(`/${a.slug}`, { method: 'PATCH', body: JSON.stringify({ status: publish ? 'published' : 'draft' }) })
      toast.show(publish ? `Published “${a.title_ru}”` : `Moved “${a.title_ru}” to drafts`)
      load()
    } catch (e) {
      toast.show(e instanceof Error ? e.message : 'Failed', true)
    }
  }
  const remove = async () => {
    const a = deleting!
    setDeleting(null)
    try {
      await articlesApi(`/${a.slug}`, { method: 'DELETE' })
      toast.show(`Deleted “${a.title_ru}”`)
      load()
    } catch (e) {
      toast.show(e instanceof Error ? e.message : 'Failed', true)
    }
  }

  const actions = (a: Article) => (
    <div className="flex flex-wrap gap-2">
      <Link href={`/admin/articles/${a.slug}`} className={btn.secondary}>Edit</Link>
      <button type="button" className={btn.secondary} onClick={() => setPublished(a, a.status !== 'published')}>
        {a.status === 'published' ? 'Unpublish' : 'Publish'}
      </button>
      {a.status === 'published' && (
        <a href={`/articles/${a.slug}`} target="_blank" rel="noopener" className={btn.secondary}>View on site</a>
      )}
      <button type="button" className={btn.secondary + ' !text-red-600'} onClick={() => setDeleting(a)}>Delete</button>
    </div>
  )

  return (
    <ArticlesShell
      title="Articles"
      actions={<>
        <Link href="/admin/articles/keys" className={btn.secondary}>API keys</Link>
        <Link href="/admin/articles/new" className={btn.primary}>New article</Link>
      </>}
    >
      <div className="mb-4 grid gap-3 rounded-lg bg-white p-4 shadow sm:grid-cols-[1fr_auto_auto]">
        <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by title or slug" aria-label="Search"
          className="min-h-10 rounded-md border border-gray-300 px-3 text-sm text-gray-900" />
        <select value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Status" className="min-h-10 rounded-md border border-gray-300 px-3 text-sm text-gray-900">
          <option value="">All statuses</option><option value="published">Published</option><option value="draft">Draft</option>
        </select>
        <select value={topic} onChange={(e) => setTopic(e.target.value)} aria-label="Topic" className="min-h-10 rounded-md border border-gray-300 px-3 text-sm text-gray-900">
          <option value="">All topics</option>
          {TOPICS.map((t) => <option key={t} value={t}>{TOPIC_LABELS[t]}</option>)}
        </select>
      </div>

      {error && <p className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {!articles && !error && <p className="text-gray-500">Loading…</p>}
      {articles && !shown.length && <p className="rounded-lg bg-white p-6 text-center text-gray-500 shadow">No articles match.</p>}

      {shown.length > 0 && (
        <>
          <div className="hidden overflow-hidden rounded-lg bg-white shadow md:block">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                <tr><th className="px-4 py-3">Title (RU)</th><th className="px-4 py-3">Topic</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Featured</th><th className="px-4 py-3">Updated</th><th className="px-4 py-3">Actions</th></tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {shown.map((a) => (
                  <tr key={a.id} data-slug={a.slug}>
                    <td className="px-4 py-3"><div className="font-medium text-gray-900">{a.title_ru}</div><div className="text-xs text-gray-500">{a.slug}</div></td>
                    <td className="px-4 py-3 text-gray-700">{TOPIC_LABELS[a.topic]}</td>
                    <td className="px-4 py-3"><StatusBadge status={a.status} /></td>
                    <td className="px-4 py-3 text-gray-700">{a.featured ? '★ Yes' : '—'}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-gray-700">{fmt(a.updated_at)}</td>
                    <td className="px-4 py-3">{actions(a)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <ul className="space-y-3 md:hidden">
            {shown.map((a) => (
              <li key={a.id} data-slug={a.slug} className="rounded-lg bg-white p-4 shadow">
                <div className="flex items-start justify-between gap-2">
                  <div className="font-medium text-gray-900">{a.title_ru}</div>
                  <StatusBadge status={a.status} />
                </div>
                <div className="mt-1 text-xs text-gray-500">{TOPIC_LABELS[a.topic]}{a.featured ? ' · ★ Featured' : ''} · {fmt(a.updated_at)}</div>
                <div className="mt-3">{actions(a)}</div>
              </li>
            ))}
          </ul>
        </>
      )}

      <ConfirmDialog open={!!deleting} title="Delete article?" confirmLabel="Delete"
        body={`“${deleting?.title_ru}” will be removed from the site in all languages. This can't be undone.`}
        onConfirm={remove} onCancel={() => setDeleting(null)} />
      {toast.node}
    </ArticlesShell>
  )
}
