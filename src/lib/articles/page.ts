import { readFile } from 'fs/promises'
import path from 'path'
import { renderArticlePage, renderArticlesPage, renderNotFoundPage } from './render'
import { LANGS, type Lang } from './schema'
import { getPublishedArticles, localize, localizeAll, SEED_ARTICLES, type ArticleContent } from './store'

const FILES: Record<Lang, string> = { ru: 'index.html', en: 'en/index.html', kk: 'kk/index.html' }
const HTML = { 'Content-Type': 'text/html; charset=utf-8' }

const template = (lang: Lang) => readFile(path.join(process.cwd(), 'public/main/articles', FILES[lang]), 'utf8')

/** /articles in one language: the static page with DB articles, or the static page as is if the DB fails. */
export async function articlesPage(lang: Lang): Promise<Response> {
  const tpl = await template(lang)
  let html = tpl
  try {
    html = renderArticlesPage(tpl, localizeAll(await getPublishedArticles(), lang), lang)
  } catch (e) {
    console.error(`articles page (${lang}): serving the static fallback`, e)
  }
  return new Response(html, { headers: HTML })
}

/** /articles/<slug> in one language; 404 for unknown, draft or untranslated slugs. Without the DB: the seed articles. */
export async function articlePage(lang: Lang, slug: string): Promise<Response> {
  const tpl = await template(lang)
  let list: ArticleContent[]
  try {
    list = await getPublishedArticles()
  } catch (e) {
    console.error(`article page ${slug} (${lang}): DB unavailable, using the seed articles`, e)
    list = SEED_ARTICLES
  }
  const row = list.find((a) => a.slug === slug)
  const article = row && localize(row, lang)
  if (!row || !article) return new Response(renderNotFoundPage(tpl, lang), { status: 404, headers: HTML })
  const others = localizeAll(list, lang).filter((a) => a.slug !== slug)
  const langs = LANGS.filter((l) => localize(row, l))
  return new Response(renderArticlePage(tpl, article, others, lang, langs), { headers: HTML })
}
