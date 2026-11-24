// Builds the public articles pages (RU/EN/KZ) from the static index in public/main/articles: the
// static file is the template (header, footer, CSS, SEO tags stay byte-for-byte where they apply).
// - index (/articles): only the featured card, the card grid and the JSON-LD blogPost list change;
// - article (/articles/<slug>): head tags, language switcher and <main> are rebuilt for one article;
// - not found: <main> says so, the route answers 404.
import { estimateReadMinutes, type Lang, type Topic } from './schema'
import type { LocalizedArticle } from './store'

export const SITE = 'https://www.chessempire.kz'
const PREFIX: Record<Lang, string> = { ru: '', en: '/en', kk: '/kz' }
const HOME: Record<Lang, string> = { ru: '/ru', en: '/en', kk: '/kz' }

export const indexPath = (lang: Lang) => `${PREFIX[lang]}/articles`
export const articlePath = (lang: Lang, slug: string) => `${indexPath(lang)}/${slug}`

interface Labels {
  topics: Record<Topic, string>
  featured: string
  minutes: (n: number) => string
  home: string
  articles: string
  crumbs: string
  more: string
  all: string
  ogLocale: string
  box: { title: string; text: string; signup: string; wa: string; waText: string }
  notFound: { title: string; text: string }
}

const LABELS: Record<Lang, Labels> = {
  ru: {
    topics: { parents: 'Родителям', beginners: 'Начинающим', tournaments: 'Турниры' }, featured: 'Главное', minutes: (n) => `${n} мин чтения`,
    home: 'Главная', articles: 'Статьи', crumbs: 'Навигационная цепочка', more: 'Ещё статьи', all: '← Все статьи', ogLocale: 'ru_RU',
    box: { title: 'Хотите попробовать?', text: 'Первое занятие бесплатное: тренер познакомится с ребёнком и подскажет, с какой группы начать.',
      signup: 'Записаться на бесплатный пробный урок', wa: 'Написать в WhatsApp', waText: 'Здравствуйте! У меня вопрос о занятиях в Chess Empire.' },
    notFound: { title: 'Статья не найдена', text: 'Возможно, её переименовали или сняли с публикации. Загляните в список статей.' },
  },
  en: {
    topics: { parents: 'Parents', beginners: 'Beginners', tournaments: 'Tournaments' }, featured: 'Featured', minutes: (n) => `${n} min read`,
    home: 'Home', articles: 'Articles', crumbs: 'Breadcrumb', more: 'More articles', all: '← All articles', ogLocale: 'en_US',
    box: { title: 'Want to give it a try?', text: 'The first lesson is free: the coach gets to know your child and suggests which group to start in.',
      signup: 'Book a free trial lesson', wa: 'Message us on WhatsApp', waText: 'Hello! I have a question about classes at Chess Empire.' },
    notFound: { title: 'Article not found', text: 'It may have been renamed or unpublished. Have a look at the list of articles.' },
  },
  kk: {
    topics: { parents: 'Ата-аналарға', beginners: 'Жаңадан бастағандарға', tournaments: 'Турнирлер' }, featured: 'Басты', minutes: (n) => `${n} мин оқу`,
    home: 'Басты бет', articles: 'Мақалалар', crumbs: 'Навигация тізбегі', more: 'Тағы мақалалар', all: '← Барлық мақалалар', ogLocale: 'kk_KZ',
    box: { title: 'Байқап көргіңіз келе ме?', text: 'Алғашқы сабақ тегін: жаттықтырушы баламен танысып, қай топтан бастаған дұрыс екенін айтады.',
      signup: 'Тегін сынақ сабаққа жазылу', wa: 'WhatsApp-қа жазу', waText: 'Сәлеметсіз бе! Chess Empire сабақтары туралы сұрағым бар.' },
    notFound: { title: 'Мақала табылмады', text: 'Мүмкін, оның атауы өзгерген немесе жарияланымнан алынған. Мақалалар тізімін қараңыз.' },
  },
}
// Cards without a cover show a chess glyph (text presentation selector keeps it from turning into an emoji).
const GLYPHS = ['♝︎', '♞︎', '♚︎', '♛︎']
const FEATURED_GLYPH = '♜︎'

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
const abs = (url: string) => (url.startsWith('/') ? SITE + url : url)
const minutes = (lang: Lang, a: LocalizedArticle) => LABELS[lang].minutes(a.read_minutes ?? estimateReadMinutes(a.body))
const byline = (lang: Lang, a: LocalizedArticle) => (a.author ? `${minutes(lang, a)} · ${a.author}` : minutes(lang, a))
const personName = (author: string) => author.split(',')[0].trim()

/** [start, end) offsets of the text between two markers (both kept). */
function between(html: string, open: string, close: string): [number, number] {
  const i = html.indexOf(open)
  const j = i < 0 ? -1 : html.indexOf(close, i + open.length)
  if (j < 0) throw new Error(`Template is missing ${open} … ${close}`)
  return [i + open.length, j]
}

function replaceBetween(html: string, open: string, close: string, content: string): string {
  const [s, e] = between(html, open, close)
  return html.slice(0, s) + content + html.slice(e)
}

function grab(html: string, re: RegExp): string {
  const m = html.match(re)
  if (!m) throw new Error(`Template is missing ${re}`)
  return m[0]
}

/** Replaces exactly one match of re (a template tag that must exist). */
function swap(html: string, re: RegExp, to: string): string {
  grab(html, re)
  return html.replace(re, () => to)
}

const LD_RE = /<script type="application\/ld\+json">[\s\S]*?<\/script>/
const ldScript = (data: object) => `<script type="application/ld+json">${JSON.stringify(data).replace(/</g, '\\u003c')}</script>`
const MOCK_NOTE = '<!-- MOCK ARTICLES: placeholder texts, replace with real content -->\n'

function card(lang: Lang, a: LocalizedArticle, glyph: string): string {
  const cover = a.cover_url
    ? `<div class="pa-cover"><img src="${esc(a.cover_url)}" alt="" width="800" height="500" loading="lazy"></div>`
    : `<div class="pa-cover pa-board" aria-hidden="true"><span>${glyph}</span></div>`
  return `<li data-cat="${a.topic}"><a class="pa-card" href="${articlePath(lang, a.slug)}">${cover}<div class="pa-body"><span class="a-tag">${esc(LABELS[lang].topics[a.topic])}</span><h3>${esc(a.title)}</h3><p>${esc(a.teaser)}</p><p class="a-meta">${esc(minutes(lang, a))}</p></div></a></li>\n`
}

export function renderArticlesPage(template: string, articles: LocalizedArticle[], lang: Lang): string {
  const t = LABELS[lang]
  const readBtn = grab(template, /<span class="btn btn-primary">[^<]*<\/span>/)
  const featured = articles.find((a) => a.featured) ?? articles[0]
  const rest = articles.filter((a) => a !== featured)

  let feat = ''
  if (featured) {
    const cover = featured.cover_url
      ? `<div class="pa-cover pa-feat-img"><img src="${esc(featured.cover_url)}" alt="" width="800" height="533" fetchpriority="high"></div>`
      : `<div class="pa-cover pa-feat-img pa-board" aria-hidden="true"><span>${FEATURED_GLYPH}</span></div>`
    feat = `<a class="pa-feat" href="${articlePath(lang, featured.slug)}" data-cat="${featured.topic}">${cover}<div class="pa-feat-body"><span class="a-tag">${esc(`${t.featured} · ${t.topics[featured.topic]}`)}</span><h2>${esc(featured.title)}</h2><p>${esc(featured.teaser)}</p><p class="a-meta">${esc(byline(lang, featured))}</p>${readBtn}</div></a>\n`
  }
  const cards = rest.map((a, i) => card(lang, a, GLYPHS[i % GLYPHS.length]))
  let html = replaceBetween(template, '<section class="section pa-list" id="list"><div class="wrap">\n', '<div class="pa-cta">', `${feat}<ul class="pa-grid">\n${cards.join('')}</ul>\n`)

  const ld = JSON.parse(grab(html, LD_RE).replace(/^<script[^>]*>|<\/script>$/g, ''))
  ld.blogPost = articles.map((a) => ({
    '@type': 'BlogPosting',
    headline: a.title,
    description: a.teaser,
    url: SITE + articlePath(lang, a.slug),
    inLanguage: lang,
    ...(a.published_at ? { datePublished: a.published_at } : {}),
    ...(a.author ? { author: { '@type': 'Person', name: personName(a.author) } } : {}),
  }))
  html = html.replace(LD_RE, () => ldScript(ld))
  return html.replace(MOCK_NOTE, '')
}

/** Head tags shared by the article and not-found pages. */
function setHead(html: string, title: string, description: string): string {
  html = swap(html, /<title>[^<]*<\/title>/, `<title>${esc(title)}</title>`)
  html = swap(html, /<meta name="description" content="[^"]*">/, `<meta name="description" content="${esc(description)}">`)
  html = swap(html, /<meta property="og:title" content="[^"]*">/, `<meta property="og:title" content="${esc(title)}">`)
  return swap(html, /<meta property="og:description" content="[^"]*">/, `<meta property="og:description" content="${esc(description)}">`)
}

/** The language switcher points to the same article in the other languages (or their index if it isn't translated). */
function setLangSwitch(html: string, slug: string, langs: Lang[]): string {
  const nav = grab(html, /<nav class="lang-switch"[\s\S]*?<\/nav>/)
  const next = nav.replace(/href="([^"]*)" hreflang="(ru|en|kk)"/g, (_m, _href, l: Lang) =>
    `href="${langs.includes(l) ? articlePath(l, slug) : indexPath(l)}" hreflang="${l}"`)
  return html.replace(nav, () => next)
}

/** One article page. langs = languages this article is published in (for hreflang and the switcher). */
export function renderArticlePage(template: string, a: LocalizedArticle, others: LocalizedArticle[], lang: Lang, langs: Lang[]): string {
  const t = LABELS[lang]
  const url = SITE + articlePath(lang, a.slug)
  const title = `${a.title} — Chess Empire`
  const description = a.teaser || a.title
  const image = a.cover_url ? abs(a.cover_url) : null

  let html = setHead(template, title, description)
  html = swap(html, /<link rel="canonical" href="[^"]*">/, `<link rel="canonical" href="${url}">`)
  const alternates = langs.map((l) => `<link rel="alternate" hreflang="${l}" href="${SITE + articlePath(l, a.slug)}">`)
  alternates.push(`<link rel="alternate" hreflang="x-default" href="${SITE + articlePath(langs.includes('ru') ? 'ru' : langs[0], a.slug)}">`)
  html = swap(html, /(<link rel="alternate" hreflang="[^"]+" href="[^"]*">\n?)+/, alternates.join('\n') + '\n')
  html = swap(html, /<meta property="og:type" content="[^"]*">/, '<meta property="og:type" content="article">')
  html = swap(html, /<meta property="og:url" content="[^"]*">/, `<meta property="og:url" content="${url}">`)
  if (image) html = swap(html, /<meta property="og:image" content="[^"]*">/, `<meta property="og:image" content="${esc(image)}">`)
  if (a.published_at) html = html.replace(/(<meta property="og:locale" content="[^"]*">)/, (m) => `${m}\n<meta property="article:published_time" content="${esc(a.published_at!)}">`)

  const ld = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: a.title,
    description,
    url,
    mainEntityOfPage: url,
    inLanguage: lang,
    ...(image ? { image } : {}),
    ...(a.published_at ? { datePublished: a.published_at } : {}),
    ...(a.author ? { author: { '@type': 'Person', name: personName(a.author) } } : {}),
    publisher: { '@type': 'Organization', name: 'Chess Empire', url: SITE + HOME[lang] },
    isPartOf: { '@type': 'Blog', url: SITE + indexPath(lang) },
  }
  html = html.replace(LD_RE, () => ldScript(ld))
  html = setLangSwitch(html, a.slug, langs)

  const crumbs = `<nav class="pa-crumbs eyebrow" aria-label="${t.crumbs}"><a href="${HOME[lang]}">${t.home}</a> <span aria-hidden="true">/</span> <a href="${indexPath(lang)}">${t.articles}</a> <span aria-hidden="true">/</span> <span aria-current="page">${esc(a.title)}</span></nav>`
  const cover = a.cover_url
    ? `<div class="pa-cover pa-post-cover"><img src="${esc(a.cover_url)}" alt="" width="1200" height="675" fetchpriority="high"></div>\n`
    : ''
  const wa = `https://wa.me/77077872210?text=${encodeURIComponent(t.box.waText)}`
  const box = `<aside class="pa-box"><h3>${t.box.title}</h3><p>${t.box.text}</p><div class="pa-box-actions"><a class="btn btn-light" href="${HOME[lang]}#signup">${t.box.signup}</a><a class="pa-box-wa" href="${wa}" target="_blank" rel="noopener">${t.box.wa}</a></div></aside>`
  // Same topic first, then the rest (already in site order); 3 cards.
  const more = [...others.filter((o) => o.topic === a.topic), ...others.filter((o) => o.topic !== a.topic)].slice(0, 3)
  const moreBlock = more.length
    ? `<section class="pa-more" aria-labelledby="pa-more-title"><h2 id="pa-more-title">${t.more}</h2>\n<ul class="pa-grid">\n${more.map((o, i) => card(lang, o, GLYPHS[i % GLYPHS.length])).join('')}</ul></section>\n`
    : ''

  const main = `<section class="pa-hero pa-post-hero" id="top"><div class="wrap">
${crumbs}
<span class="a-tag">${esc(t.topics[a.topic])}</span>
<h1>${esc(a.title)}</h1>
<p class="a-meta">${esc(byline(lang, a))}</p>
</div></section>
<section class="section pa-post"><div class="wrap">
<article class="pa-article" id="${a.slug}">
${cover}<div class="pa-text">${a.body}</div>
${box}
</article>
${moreBlock}<a class="pa-back" href="${indexPath(lang)}">${t.all}</a>
</div></section>
`
  html = replaceBetween(html, '<main id="main">\n', '</main>', main)
  return html.replace(MOCK_NOTE, '')
}

/** Body of the 404 answer for an unknown or unpublished slug. */
export function renderNotFoundPage(template: string, lang: Lang): string {
  const t = LABELS[lang]
  let html = setHead(template, `${t.notFound.title} — Chess Empire`, t.notFound.text)
  html = html.replace(/<link rel="(canonical|alternate)"[^>]*>\n/g, '').replace(LD_RE, '')
  html = html.replace('<meta name="viewport"', '<meta name="robots" content="noindex">\n<meta name="viewport"')
  const main = `<section class="pa-hero" id="top"><div class="wrap">
<nav class="pa-crumbs eyebrow" aria-label="${t.crumbs}"><a href="${HOME[lang]}">${t.home}</a> <span aria-hidden="true">/</span> <a href="${indexPath(lang)}">${t.articles}</a></nav>
<h1>${t.notFound.title}</h1>
<p class="lead">${t.notFound.text}</p>
<a class="btn btn-primary" href="${indexPath(lang)}">${t.all}</a>
</div></section>
`
  return replaceBetween(html, '<main id="main">\n', '</main>', main).replace(MOCK_NOTE, '')
}
