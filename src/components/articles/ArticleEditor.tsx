'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useRef, useState } from 'react'
import RichTextEditor from '@/components/articles/RichTextEditor'
import { ArticlesShell, btn, StatusBadge, useToast } from '@/components/articles/ui'
import { articlesApi, ApiError } from '@/lib/articles/client'
import {
  estimateReadMinutes, slugify, TOPICS, validateArticleInput,
  type Article, type ArticleInput, type FieldErrors, type Lang, type Status,
} from '@/lib/articles/schema'

const TABS: { lang: Lang; label: string; author: 'author' | 'author_en' | 'author_kk' }[] = [
  { lang: 'ru', label: 'RU', author: 'author' },
  { lang: 'en', label: 'EN', author: 'author_en' },
  { lang: 'kk', label: 'KZ', author: 'author_kk' },
]
const TOPIC_LABELS: Record<string, string> = { parents: 'Parents', beginners: 'Beginners', tournaments: 'Tournaments' }
const MAX_COVER = 5 * 1024 * 1024
const SAVED_TOAST: Record<Status, string> = { published: 'Published — live on the site within a minute', draft: 'Draft saved' }

type Form = Required<Omit<ArticleInput, 'read_minutes' | 'status'>> & { read_minutes: number | null }

const EMPTY: Form = {
  slug: '', topic: 'parents', author: '', author_en: '', author_kk: '', read_minutes: null, cover_url: '',
  featured: false, sort_order: 0,
  title_ru: '', title_en: '', title_kk: '', teaser_ru: '', teaser_en: '', teaser_kk: '', body_ru: '', body_en: '', body_kk: '',
}

const toForm = (a: Article): Form => {
  const f = { ...EMPTY }
  for (const k of Object.keys(EMPTY) as (keyof Form)[]) (f as Record<string, unknown>)[k] = a[k] ?? EMPTY[k]
  return f
}

const field = 'mt-1 block min-h-10 w-full rounded-md border px-3 py-2 text-sm text-gray-900'
const fieldCls = (err?: string) => `${field} ${err ? 'border-red-500' : 'border-gray-300'}`

function Err({ id, text }: { id: string; text?: string }) {
  return text ? <p id={id} className="mt-1 text-xs text-red-600">{text}</p> : null
}

export default function ArticleEditor({ slug }: { slug?: string }) {
  const router = useRouter()
  const toast = useToast()
  const showToast = toast.show
  const [form, setForm] = useState<Form>(EMPTY)
  const [saved, setSaved] = useState<Form>(EMPTY)
  const [status, setStatus] = useState<Status>('draft')
  const [loading, setLoading] = useState(!!slug)
  const [loadError, setLoadError] = useState('')
  const [errors, setErrors] = useState<FieldErrors>({})
  const [tab, setTab] = useState<Lang>('ru')
  const [busy, setBusy] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [slugTouched, setSlugTouched] = useState(!!slug)
  const [minutesTouched, setMinutesTouched] = useState(false)
  const fileInput = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!slug) return
    articlesApi<{ article: Article }>(`/${slug}`)
      .then(({ article }) => {
        const f = toForm(article)
        setForm(f)
        setSaved(f)
        setStatus(article.status)
        setMinutesTouched(article.read_minutes !== null)
        // Just created (or renamed) on the previous editor instance: say so here, then drop the flag from the URL.
        const savedAs = new URLSearchParams(window.location.search).get('saved') as Status | null
        if (savedAs && SAVED_TOAST[savedAs]) {
          showToast(SAVED_TOAST[savedAs])
          window.history.replaceState(null, '', window.location.pathname)
        }
      })
      .catch((e) => setLoadError(e instanceof ApiError && e.status === 404 ? 'Article not found' : 'Could not load the article'))
      .finally(() => setLoading(false))
  }, [slug, showToast])

  const dirty = useMemo(() => JSON.stringify(form) !== JSON.stringify(saved), [form, saved])
  useEffect(() => {
    if (!dirty) return
    const warn = (e: BeforeUnloadEvent) => e.preventDefault()
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [dirty])

  const estimate = estimateReadMinutes(form.body_ru || form.body_en || form.body_kk)
  const minutes = minutesTouched && form.read_minutes ? form.read_minutes : estimate

  const set = <K extends keyof Form>(k: K, v: Form[K]) => {
    setForm((f) => {
      const next = { ...f, [k]: v }
      if (!slugTouched && (k === 'title_en' || k === 'title_ru')) next.slug = slugify(next.title_en || next.title_ru)
      return next
    })
    setErrors((e) => {
      if (!e[k as string]) return e
      const rest = { ...e }
      delete rest[k as string]
      return rest
    })
  }

  const payload = (nextStatus: Status): ArticleInput => ({
    ...form,
    read_minutes: minutes,
    cover_url: form.cover_url || null,
    author: form.author || null, author_en: form.author_en || null, author_kk: form.author_kk || null,
    status: nextStatus,
  })

  const save = async (nextStatus: Status) => {
    const body = payload(nextStatus)
    const { errors: errs } = validateArticleInput(body, false)
    if (nextStatus === 'published') {
      for (const t of TABS) {
        if (!form[`title_${t.lang}`]) errs[`title_${t.lang}`] = `${t.label} title is required to publish`
        if (!form[`body_${t.lang}`]) errs[`body_${t.lang}`] = `${t.label} text is required to publish`
      }
    }
    if (Object.keys(errs).length) return showErrors(errs)
    setBusy(true)
    try {
      const { article } = slug
        ? await articlesApi<{ article: Article }>(`/${slug}`, { method: 'PATCH', body: JSON.stringify(body) })
        : await articlesApi<{ article: Article }>('', { method: 'POST', body: JSON.stringify(body) })
      const f = toForm(article)
      setForm(f)
      setSaved(f)
      setStatus(article.status)
      setMinutesTouched(true)
      if (article.slug !== slug) router.replace(`/admin/articles/${article.slug}?saved=${article.status}`)
      else toast.show(SAVED_TOAST[article.status])
    } catch (e) {
      if (e instanceof ApiError && Object.keys(e.fields).length) showErrors(e.fields)
      else toast.show(e instanceof Error ? e.message : 'Save failed', true)
    } finally {
      setBusy(false)
    }
  }

  const showErrors = (errs: FieldErrors) => {
    setErrors(errs)
    const bad = TABS.find((t) => Object.keys(errs).some((k) => k.endsWith(`_${t.lang}`) || (t.lang === 'ru' && k === 'author')))
    if (bad && !Object.keys(errs).some((k) => k.endsWith(`_${tab}`))) setTab(bad.lang)
    toast.show('Please fix the highlighted fields', true)
  }

  const upload = async (file: File) => {
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) return setErrors((e) => ({ ...e, cover_url: 'Only JPEG, PNG or WebP' }))
    if (file.size > MAX_COVER) return setErrors((e) => ({ ...e, cover_url: 'Image must be at most 5 MB' }))
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const { url } = await articlesApi<{ url: string }>('/upload', { method: 'POST', body: fd })
      set('cover_url', url)
    } catch (e) {
      setErrors((x) => ({ ...x, cover_url: e instanceof Error ? e.message : 'Upload failed' }))
    } finally {
      setUploading(false)
    }
  }

  const back = () => {
    if (!dirty || window.confirm('You have unsaved changes. Leave without saving?')) router.push('/admin/articles')
  }

  const preview = useMemo(() => {
    const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
    const author = form[TABS.find((t) => t.lang === tab)!.author] || form.author
    const unit = tab === 'en' ? 'min read' : tab === 'kk' ? 'мин оқу' : 'мин чтения'
    const meta = esc(author ? `${minutes} ${unit} · ${author}` : `${minutes} ${unit}`)
    const cover = form.cover_url
      ? `<div class="pa-cover"><img src="${esc(form.cover_url)}" alt=""></div>`
      : '<div class="pa-cover pa-board" aria-hidden="true"><span>♝︎</span></div>'
    return `<!DOCTYPE html><html lang="${tab}"><head><meta charset="utf-8">
<link rel="stylesheet" href="/home/shared/fonts.css"><link rel="stylesheet" href="/home/shared/base.css">
<link rel="stylesheet" href="/home/styles.css"><link rel="stylesheet" href="/main/v2.css"><link rel="stylesheet" href="/main/articles.css">
<style>body{padding:24px 0}.pa-grid{grid-template-columns:minmax(0,340px)}.pa-article{padding-block:32px}</style></head>
<body class="theme-chess"><div class="wrap">
<ul class="pa-grid"><li><div class="pa-card">${cover}<div class="pa-body"><span class="a-tag">${esc(TOPIC_LABELS[form.topic])}</span><h3>${esc(form[`title_${tab}`])}</h3><p>${esc(form[`teaser_${tab}`])}</p><p class="a-meta">${esc(`${minutes} ${unit}`)}</p></div></div></li></ul>
<article class="pa-article"><span class="a-tag">${esc(TOPIC_LABELS[form.topic])}</span><h2>${esc(form[`title_${tab}`])}</h2><p class="a-meta">${meta}</p><div class="pa-text">${form[`body_${tab}`]}</div></article>
</div></body></html>`
  }, [form, tab, minutes])

  if (loading) return <ArticlesShell title="Edit article"><p className="text-gray-500">Loading…</p></ArticlesShell>
  if (loadError) return <ArticlesShell title="Edit article"><p className="rounded-md bg-red-50 p-3 text-sm text-red-700">{loadError}</p></ArticlesShell>

  const current = TABS.find((t) => t.lang === tab)!
  const tabHasError = (l: Lang) => Object.keys(errors).some((k) => k.endsWith(`_${l}`) || (l === 'ru' && k === 'author'))

  return (
    <ArticlesShell
      title={slug ? 'Edit article' : 'New article'}
      actions={<>
        {slug && <StatusBadge status={status} />}
        {dirty && <span className="self-center text-xs text-amber-700">Unsaved changes</span>}
        <button type="button" className={btn.secondary} onClick={back}>Back to list</button>
      </>}
    >
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); save(status) }} noValidate>
          <section className="space-y-4 rounded-lg bg-white p-4 shadow sm:p-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm font-medium text-gray-700">Slug
                <input className={fieldCls(errors.slug)} value={form.slug} aria-invalid={!!errors.slug} aria-describedby="err-slug"
                  onChange={(e) => { setSlugTouched(true); set('slug', e.target.value.toLowerCase()) }} placeholder="age-to-start" />
                <Err id="err-slug" text={errors.slug} />
              </label>
              <label className="block text-sm font-medium text-gray-700">Topic
                <select className={fieldCls(errors.topic)} value={form.topic} onChange={(e) => set('topic', e.target.value as Form['topic'])}>
                  {TOPICS.map((t) => <option key={t} value={t}>{TOPIC_LABELS[t]}</option>)}
                </select>
              </label>
              <label className="block text-sm font-medium text-gray-700">Read minutes
                <input type="number" min={1} max={120} className={fieldCls(errors.read_minutes)} value={minutes}
                  onChange={(e) => { setMinutesTouched(true); set('read_minutes', e.target.value ? Number(e.target.value) : null) }} />
                <span className="mt-1 block text-xs font-normal text-gray-500">
                  Estimated from the text: {estimate}.{' '}
                  {minutesTouched && <button type="button" className="text-indigo-600 underline" onClick={() => { setMinutesTouched(false); set('read_minutes', null) }}>Use estimate</button>}
                </span>
                <Err id="err-minutes" text={errors.read_minutes} />
              </label>
              <label className="block text-sm font-medium text-gray-700">Sort order
                <input type="number" className={fieldCls(errors.sort_order)} value={form.sort_order}
                  onChange={(e) => set('sort_order', Number(e.target.value) || 0)} />
                <span className="mt-1 block text-xs font-normal text-gray-500">Lower comes first (after the featured article).</span>
                <Err id="err-sort" text={errors.sort_order} />
              </label>
            </div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <input type="checkbox" className="h-5 w-5" checked={form.featured} onChange={(e) => set('featured', e.target.checked)} />
              Featured (big card at the top of /articles)
            </label>

            <div>
              <span className="block text-sm font-medium text-gray-700">Cover image</span>
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) upload(f) }}
                className={`mt-1 flex flex-col items-center gap-3 rounded-md border-2 border-dashed p-4 text-center text-sm sm:flex-row sm:text-left ${dragOver ? 'border-indigo-500 bg-indigo-50' : errors.cover_url ? 'border-red-500' : 'border-gray-300'}`}
              >
                {form.cover_url
                  // eslint-disable-next-line @next/next/no-img-element
                  ? <img src={form.cover_url} alt="Cover preview" className="h-24 w-36 rounded object-cover" />
                  : <div className="flex h-24 w-36 items-center justify-center rounded bg-gray-100 text-3xl text-gray-400" aria-hidden="true">♝</div>}
                <div className="flex-1 text-gray-600">
                  {uploading ? 'Uploading…' : 'Drop a JPEG, PNG or WebP here (up to 5 MB), or'}
                  <div className="mt-2 flex flex-wrap justify-center gap-2 sm:justify-start">
                    <button type="button" className={btn.secondary} disabled={uploading} onClick={() => fileInput.current?.click()}>Choose file</button>
                    {form.cover_url && <button type="button" className={btn.secondary} onClick={() => set('cover_url', '')}>Remove</button>}
                  </div>
                  <input ref={fileInput} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" aria-label="Cover file"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f); e.target.value = '' }} />
                </div>
              </div>
              <input className={`${fieldCls(errors.cover_url)} text-xs`} value={form.cover_url || ''} placeholder="…or paste an https:// image URL"
                aria-label="Cover URL" onChange={(e) => set('cover_url', e.target.value)} />
              <Err id="err-cover" text={errors.cover_url} />
            </div>
          </section>

          <section className="rounded-lg bg-white shadow">
            <div className="flex border-b border-gray-200" role="tablist" aria-label="Language">
              {TABS.map((t) => (
                <button key={t.lang} type="button" role="tab" aria-selected={tab === t.lang} onClick={() => setTab(t.lang)}
                  className={`min-h-11 flex-1 px-4 text-sm font-medium ${tab === t.lang ? 'border-b-2 border-indigo-600 text-indigo-700' : 'text-gray-500 hover:text-gray-700'}`}>
                  {t.label}{tabHasError(t.lang) && <span className="ml-1 text-red-600" aria-label="has errors">●</span>}
                </button>
              ))}
            </div>
            <div className="space-y-4 p-4 sm:p-6" role="tabpanel" aria-label={`${current.label} text`}>
              <label className="block text-sm font-medium text-gray-700">Title ({current.label})
                <input className={fieldCls(errors[`title_${tab}`])} value={form[`title_${tab}`]} aria-invalid={!!errors[`title_${tab}`]}
                  onChange={(e) => set(`title_${tab}`, e.target.value)} />
                <Err id={`err-title-${tab}`} text={errors[`title_${tab}`]} />
              </label>
              <label className="block text-sm font-medium text-gray-700">Teaser ({current.label})
                <textarea rows={2} className={fieldCls(errors[`teaser_${tab}`])} value={form[`teaser_${tab}`]}
                  onChange={(e) => set(`teaser_${tab}`, e.target.value)} />
                <Err id={`err-teaser-${tab}`} text={errors[`teaser_${tab}`]} />
              </label>
              <label className="block text-sm font-medium text-gray-700">Author byline ({current.label})
                <input className={fieldCls(errors[current.author])} value={form[current.author] || ''} placeholder={tab === 'en' ? 'Name, role' : 'Имя, роль'}
                  onChange={(e) => set(current.author, e.target.value)} />
                <Err id={`err-author-${tab}`} text={errors[current.author]} />
              </label>
              <div>
                <span className="block text-sm font-medium text-gray-700">Text ({current.label})</span>
                <div className="mt-1">
                  <RichTextEditor key={tab} label={`Text (${current.label})`} value={form[`body_${tab}`]} invalid={!!errors[`body_${tab}`]}
                    onChange={(html) => set(`body_${tab}`, html)} />
                </div>
                <Err id={`err-body-${tab}`} text={errors[`body_${tab}`]} />
              </div>
            </div>
          </section>

          <div className="sticky bottom-0 -mx-4 flex flex-wrap gap-2 border-t border-gray-200 bg-gray-50/95 px-4 py-3 sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:p-0">
            <button type="button" className={btn.secondary} disabled={busy} onClick={() => save('draft')}>
              {status === 'published' ? 'Unpublish (save as draft)' : 'Save draft'}
            </button>
            <button type="button" className={btn.primary} disabled={busy} onClick={() => save('published')}>
              {status === 'published' ? 'Update published' : 'Publish'}
            </button>
          </div>
        </form>

        <aside className="lg:sticky lg:top-4 lg:self-start">
          <div className="mb-2 flex items-center justify-between text-sm text-gray-600">
            <span>Preview ({current.label}) — as on /articles</span>
          </div>
          <iframe title="Article preview" sandbox="" srcDoc={preview} className="h-[70vh] min-h-96 w-full rounded-lg border border-gray-200 bg-white shadow" />
        </aside>
      </div>
      {toast.node}
    </ArticlesShell>
  )
}
