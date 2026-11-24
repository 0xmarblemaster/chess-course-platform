import { revalidateTag } from 'next/cache'
import { NextRequest, NextResponse } from 'next/server'
import { getArticlesDb } from '@/lib/articles/db'
import { authorize, jsonError } from '@/lib/articles/auth'
import { sanitizeBodies } from '@/lib/articles/sanitize'
import { estimateReadMinutes, LANGS, TOPICS, validateArticleInput, type Lang, type Topic } from '@/lib/articles/schema'
import { ARTICLES_TAG, getPublishedArticles, listArticles, localizeAll } from '@/lib/articles/store'

export const runtime = 'nodejs'

// GET /api/articles?lang=ru|en|kk&limit=&topic=  — published articles (public)
// GET /api/articles?all=1                         — every article incl. drafts (API key or admin)
export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams
  if (p.get('all') === '1') {
    const auth = await authorize(req)
    if (!auth.ok) return auth.response
    try {
      return NextResponse.json({ articles: await listArticles({ includeDrafts: true }) }, { headers: { 'Cache-Control': 'no-store' } })
    } catch {
      return jsonError(503, 'Could not load articles')
    }
  }

  const lang = p.get('lang'), topic = p.get('topic'), limit = p.get('limit')
  if (lang && !LANGS.includes(lang as Lang)) return jsonError(400, `lang must be one of ${LANGS.join(', ')}`)
  if (topic && !TOPICS.includes(topic as Topic)) return jsonError(400, `topic must be one of ${TOPICS.join(', ')}`)
  const max = limit === null ? 50 : Number(limit)
  if (!Number.isInteger(max) || max < 1 || max > 50) return jsonError(400, 'limit must be 1–50')

  let list
  try {
    list = await getPublishedArticles()
  } catch {
    return jsonError(503, 'Could not load articles')
  }
  if (topic) list = list.filter((a) => a.topic === topic)
  const articles = (lang ? localizeAll(list, lang as Lang) : list).slice(0, max)
  return NextResponse.json({ articles }, { headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' } })
}

// POST /api/articles — create
export async function POST(req: NextRequest) {
  const auth = await authorize(req)
  if (!auth.ok) return auth.response
  const body = await req.json().catch(() => undefined)
  const { data, errors } = validateArticleInput(body, false)
  if (Object.keys(errors).length) return jsonError(400, 'Validation failed', { fields: errors })

  sanitizeBodies(data)
  data.read_minutes ??= estimateReadMinutes(data.body_ru || data.body_en || data.body_kk || '')
  const row = { ...data, published_at: data.status === 'published' ? new Date().toISOString() : null }
  const { data: article, error } = await getArticlesDb()!.from('articles').insert(row).select().single()
  if (error) return error.code === '23505' ? jsonError(409, 'An article with this slug already exists') : jsonError(500, error.message)
  revalidateTag(ARTICLES_TAG)
  return NextResponse.json({ article }, { status: 201 })
}
