import { revalidateTag } from 'next/cache'
import { NextRequest, NextResponse } from 'next/server'
import { getArticlesDb } from '@/lib/articles/db'
import { authorize, jsonError } from '@/lib/articles/auth'
import { sanitizeBodies } from '@/lib/articles/sanitize'
import { LANGS, validateArticleInput, type Article, type Lang } from '@/lib/articles/schema'
import { ARTICLES_TAG, localize } from '@/lib/articles/store'

export const runtime = 'nodejs'

type Ctx = { params: Promise<{ slug: string }> }

async function findArticle(slug: string) {
  const db = getArticlesDb()
  if (!db) throw new Error('Supabase admin client is not configured')
  const { data, error } = await db.from('articles').select('*').eq('slug', slug).maybeSingle()
  if (error) throw new Error(error.message)
  return data as Article | null
}

// GET /api/articles/[slug]?lang= — public if published; drafts need an API key or admin session
export async function GET(req: NextRequest, { params }: Ctx) {
  const { slug } = await params
  const lang = req.nextUrl.searchParams.get('lang')
  if (lang && !LANGS.includes(lang as Lang)) return jsonError(400, `lang must be one of ${LANGS.join(', ')}`)
  let article
  try {
    article = await findArticle(slug)
  } catch {
    return jsonError(503, 'Could not load the article')
  }
  if (article && article.status !== 'published') {
    const auth = req.headers.has('authorization') ? await authorize(req) : null
    if (!auth?.ok) article = null
  }
  const out = article && lang ? localize(article, lang as Lang) : article
  if (!out) return jsonError(404, 'Article not found')
  return NextResponse.json({ article: out }, { headers: { 'Cache-Control': 'no-store' } })
}

// PATCH /api/articles/[slug] — partial update
export async function PATCH(req: NextRequest, { params }: Ctx) {
  const auth = await authorize(req)
  if (!auth.ok) return auth.response
  const { slug } = await params
  const body = await req.json().catch(() => undefined)
  const { data, errors } = validateArticleInput(body, true)
  if (Object.keys(errors).length) return jsonError(400, 'Validation failed', { fields: errors })
  if (!Object.keys(data).length) return jsonError(400, 'Nothing to update')

  const existing = await findArticle(slug).catch(() => undefined)
  if (existing === undefined) return jsonError(503, 'Could not load the article')
  if (!existing) return jsonError(404, 'Article not found')
  sanitizeBodies(data)
  const row = { ...data, ...(data.status === 'published' && !existing.published_at ? { published_at: new Date().toISOString() } : {}) }
  const { data: article, error } = await getArticlesDb()!.from('articles').update(row).eq('id', existing.id).select().single()
  if (error) return error.code === '23505' ? jsonError(409, 'An article with this slug already exists') : jsonError(500, error.message)
  revalidateTag(ARTICLES_TAG)
  return NextResponse.json({ article })
}

// DELETE /api/articles/[slug]
export async function DELETE(req: NextRequest, { params }: Ctx) {
  const auth = await authorize(req)
  if (!auth.ok) return auth.response
  const { slug } = await params
  const { data, error } = await getArticlesDb()!.from('articles').delete().eq('slug', slug).select('slug')
  if (error) return jsonError(500, error.message)
  if (!data.length) return jsonError(404, 'Article not found')
  revalidateTag(ARTICLES_TAG)
  return NextResponse.json({ deleted: slug })
}
