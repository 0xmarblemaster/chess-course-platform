// Article fields, validation and small helpers shared by the API routes and the admin editor.

export const LANGS = ['ru', 'en', 'kk'] as const
export type Lang = (typeof LANGS)[number]

export const TOPICS = ['parents', 'beginners', 'tournaments'] as const
export type Topic = (typeof TOPICS)[number]

export const STATUSES = ['draft', 'published'] as const
export type Status = (typeof STATUSES)[number]

export interface Article {
  id: string
  slug: string
  topic: Topic
  author: string | null
  author_en: string | null
  author_kk: string | null
  read_minutes: number | null
  cover_url: string | null
  status: Status
  featured: boolean
  sort_order: number
  title_ru: string
  title_en: string
  title_kk: string
  teaser_ru: string
  teaser_en: string
  teaser_kk: string
  body_ru: string
  body_en: string
  body_kk: string
  published_at: string | null
  created_at: string
  updated_at: string
}

export type ArticleInput = Partial<Omit<Article, 'id' | 'published_at' | 'created_at' | 'updated_at'>>

// Paths under /api/articles that are routes of their own, so they can't be slugs.
const RESERVED_SLUGS = ['upload', 'keys']
export const SLUG_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/

const TEXT_LIMITS: Record<string, number> = {
  author: 120, author_en: 120, author_kk: 120,
  title_ru: 200, title_en: 200, title_kk: 200,
  teaser_ru: 400, teaser_en: 400, teaser_kk: 400,
  body_ru: 100_000, body_en: 100_000, body_kk: 100_000,
}

export type FieldErrors = Record<string, string>

export function validateSlug(slug: unknown): string | null {
  if (typeof slug !== 'string' || slug.length < 3 || slug.length > 80) return 'Slug must be 3–80 characters'
  if (!SLUG_RE.test(slug)) return 'Slug may only contain a-z, 0-9 and single hyphens'
  if (RESERVED_SLUGS.includes(slug)) return `"${slug}" is reserved`
  return null
}

// Covers uploaded through /api/articles/upload live here (http only on a local test stack).
const COVER_STORAGE = `${process.env.NEXT_PUBLIC_ARTICLES_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/article-covers/`

function validCoverUrl(v: string): boolean {
  if (v.length > 500) return false
  if ((v.startsWith('/') && !v.startsWith('//')) || v.startsWith(COVER_STORAGE)) return true
  try {
    return new URL(v).protocol === 'https:'
  } catch {
    return false
  }
}

/** Checks a create (partial=false) or PATCH (partial=true) body; returns the clean fields or errors. */
export function validateArticleInput(input: unknown, partial: boolean): { data: ArticleInput; errors: FieldErrors } {
  const errors: FieldErrors = {}
  const data: Record<string, unknown> = {}
  if (!input || typeof input !== 'object' || Array.isArray(input)) return { data, errors: { _: 'Body must be a JSON object' } }
  const src = input as Record<string, unknown>

  for (const [key, v] of Object.entries(src)) {
    if (key === 'slug') {
      const e = validateSlug(v)
      if (e) errors.slug = e
      else data.slug = v
    } else if (key === 'topic') {
      if (TOPICS.includes(v as Topic)) data.topic = v
      else errors.topic = `Topic must be one of ${TOPICS.join(', ')}`
    } else if (key === 'status') {
      if (STATUSES.includes(v as Status)) data.status = v
      else errors.status = `Status must be one of ${STATUSES.join(', ')}`
    } else if (key === 'featured') {
      if (typeof v === 'boolean') data.featured = v
      else errors.featured = 'featured must be true or false'
    } else if (key === 'read_minutes') {
      if (v === null || (Number.isInteger(v) && (v as number) >= 1 && (v as number) <= 120)) data.read_minutes = v
      else errors.read_minutes = 'Read minutes must be a whole number from 1 to 120'
    } else if (key === 'sort_order') {
      if (Number.isInteger(v) && Math.abs(v as number) <= 10_000) data.sort_order = v
      else errors.sort_order = 'Sort order must be a whole number from -10000 to 10000'
    } else if (key === 'cover_url') {
      if (v === null || v === '') data.cover_url = null
      else if (typeof v === 'string' && validCoverUrl(v)) data.cover_url = v
      else errors.cover_url = 'Cover must be an uploaded image, an https:// URL or a site path'
    } else if (key in TEXT_LIMITS) {
      if (v === null && key.startsWith('author')) data[key] = null
      else if (typeof v !== 'string') errors[key] = `${key} must be a string`
      else if (v.length > TEXT_LIMITS[key]) errors[key] = `At most ${TEXT_LIMITS[key]} characters`
      else data[key] = key.startsWith('body') ? v : v.trim()
    } else {
      errors[key] = 'Unknown field'
    }
  }

  if (!partial) {
    if (!('slug' in src)) errors.slug = 'Slug is required'
    if (!('topic' in src)) errors.topic = 'Topic is required'
    if (!data.title_ru && !errors.title_ru) errors.title_ru = 'Russian title is required'
  } else if ('title_ru' in data && !data.title_ru) {
    errors.title_ru = 'Russian title is required'
  }
  return { data: data as ArticleInput, errors }
}

/** Text content of an HTML fragment (for read-time estimates and previews). */
export function htmlToText(html: string): string {
  return html.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim()
}

/** ~180 words per minute, at least 1. */
export function estimateReadMinutes(html: string): number {
  const words = htmlToText(html).split(' ').filter(Boolean).length
  return Math.min(120, Math.max(1, Math.round(words / 180)))
}

const TRANSLIT: Record<string, string> = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e', ж: 'zh', з: 'z', и: 'i', й: 'i', к: 'k', л: 'l', м: 'm',
  н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'h', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'sch',
  ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya', ә: 'a', ғ: 'g', қ: 'k', ң: 'n', ө: 'o', ұ: 'u', ү: 'u', һ: 'h', і: 'i',
}

/** Kebab-case slug from a title (Cyrillic is transliterated). */
export function slugify(title: string): string {
  return title
    .toLowerCase()
    .split('')
    .map((c) => TRANSLIT[c] ?? c)
    .join('')
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
    .replace(/-+$/, '')
}
