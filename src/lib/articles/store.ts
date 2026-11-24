import { unstable_cache } from 'next/cache'
import { getSupabaseAdmin } from '@/lib/supabaseServer'
import type { Article, Lang } from './schema'
import seed from './seed.json'

export const ARTICLES_TAG = 'articles'

/** Featured first, then sort_order, then newest. */
export async function listArticles(opts: { includeDrafts: boolean }): Promise<Article[]> {
  const db = getSupabaseAdmin()
  if (!db) throw new Error('Supabase admin client is not configured')
  let q = db.from('articles').select('*')
  if (!opts.includeDrafts) q = q.eq('status', 'published')
  const { data, error } = await q
    .order('featured', { ascending: false })
    .order('sort_order', { ascending: true })
    .order('published_at', { ascending: false, nullsFirst: false })
  if (error) throw new Error(error.message)
  return data as Article[]
}

/** Published articles, cached until revalidateTag('articles') or 60 s. */
export const getPublishedArticles = unstable_cache(() => listArticles({ includeDrafts: false }), ['articles-published'], {
  tags: [ARTICLES_TAG],
  revalidate: 60,
})

/** What the public pages need of an article (DB rows, or the seed below). */
export type ArticleContent = Omit<Article, 'id' | 'status' | 'created_at' | 'updated_at'>

/** The six launch articles (same as the migration seed): what article pages show while the DB is unreachable. */
export const SEED_ARTICLES = seed as ArticleContent[]

export interface LocalizedArticle {
  slug: string
  topic: Article['topic']
  author: string | null
  read_minutes: number | null
  cover_url: string | null
  featured: boolean
  sort_order: number
  published_at: string | null
  title: string
  teaser: string
  body: string
}

/** The article in one language, or null if it has no title/body in that language yet. */
export function localize(a: ArticleContent, lang: Lang): LocalizedArticle | null {
  const title = a[`title_${lang}`]
  const body = a[`body_${lang}`]
  if (!title || !body) return null
  const author = lang === 'ru' ? a.author : a[`author_${lang}`] || a.author
  return {
    slug: a.slug,
    topic: a.topic,
    author,
    read_minutes: a.read_minutes,
    cover_url: a.cover_url,
    featured: a.featured,
    sort_order: a.sort_order,
    published_at: a.published_at,
    title,
    teaser: a[`teaser_${lang}`],
    body,
  }
}

export const localizeAll = (list: ArticleContent[], lang: Lang) =>
  list.map((a) => localize(a, lang)).filter((a): a is LocalizedArticle => a !== null)
