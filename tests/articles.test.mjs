// "Parents ask — coaches answer" block on the landing, the /articles index and the per-article pages
// /articles/<slug> (.ralph-articles-spec.md, .ralph-articles-admin-spec.md §7).
// Run: node tests/articles.test.mjs                 — static files only
//      ARTICLES_BASE=http://127.0.0.1:3917 node tests/articles.test.mjs
//        + the running app rendered from the DB (tests/support/articles-stack.sh)
//      ARTICLES_FALLBACK_BASE=http://127.0.0.1:3918 …
//        + an app whose DB is unreachable (static index, seed articles)
import { readFileSync, existsSync } from 'fs'

let failures = 0
const ok = (cond, msg) => { if (cond) { console.log(`  ✓ ${msg}`) } else { failures++; console.error(`  ✗ ${msg}`) } }

const B = 'https://www.chessempire.kz'
const LANGS = [
  { lang: 'ru', landing: 'public/main/index.html', page: 'public/main/articles/index.html', url: '/articles', home: '/ru' },
  { lang: 'en', landing: 'public/main/en/index.html', page: 'public/main/articles/en/index.html', url: '/en/articles', home: '/en' },
  { lang: 'kk', landing: 'public/main/kk/index.html', page: 'public/main/articles/kk/index.html', url: '/kz/articles', home: '/kz' },
]
const SEED = JSON.parse(readFileSync('src/lib/articles/seed.json', 'utf8'))
const SLUGS = SEED.map((a) => a.slug)
const LANDING_IDS = ['age-to-start', 'focus', 'first-tournament', 'fide-rating']
const CARD_HREF = /^(\/en|\/kz)?\/articles\/[a-z0-9-]+$/
const hrefs = (s) => [...s.matchAll(/href="([^"]*)"/g)].map((m) => m[1])
const cardHrefs = (s) => [...s.matchAll(/<a class="(?:pa-feat|pa-card|qb)" href="([^"]*)"/g)].map((m) => m[1])
const jsonLd = (s) => JSON.parse(s.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1])
const between = (s, a, b) => s.slice(s.indexOf(a), s.indexOf(b, s.indexOf(a)))

function landingChecks(s, p) {
  const sections = [...s.matchAll(/<section\b[^>]*\bid="([^"]+)"/g)].map((m) => m[1])
  const i = sections.indexOf('articles')
  ok(i > 0 && sections[i - 1] === 'trainers' && sections[i + 1] === 'branches', '#articles sits right after #trainers and before #branches')
  const sec = between(s, 'id="articles"', 'id="branches"')
  ok((sec.match(/<li><a class="qb"/g) || []).length === 4, '4 question cards')
  const cards = cardHrefs(sec)
  ok(cards.length === 4 && cards.every((h) => CARD_HREF.test(h) && h.startsWith(`${p.url}/`)), `every card links to ${p.url}/<slug>`)
  ok(LANDING_IDS.every((id) => cards.includes(`${p.url}/${id}`)), 'cards link to the four article pages')
  ok(hrefs(sec).filter((h) => !cards.includes(h)).join() === p.url, `"all articles" links to ${p.url}`)
  ok(!/pa-article|pa-text|pa-full/.test(s), 'landing has only the teaser block, no article text')
  return sec
}

for (const p of LANGS) {
  console.log(p.landing)
  const s = readFileSync(p.landing, 'utf8')
  const sec = landingChecks(s, p)
  ok(!sec.includes('<style') && !/style="/.test(sec), 'no inline styles')
  const nav = hrefs(s.match(/<nav class="main-nav"[\s\S]*?<\/nav>/)[0])
  ok(nav.indexOf('#articles') === nav.indexOf('#trainers') + 1, 'menu: #articles right after #trainers')
  const foot = hrefs(s.slice(s.indexOf('<footer')).match(/<ul>(?:(?!<\/ul>)[\s\S])*href="#signup"[\s\S]*?<\/ul>/)[0])
  ok(foot.indexOf('#articles') === foot.indexOf('#trainers') + 1, 'footer sections: #articles right after #trainers')

  console.log(`${p.page} (static fallback of ${p.url})`)
  ok(existsSync(p.page), 'page exists')
  const a = readFileSync(p.page, 'utf8')
  ok(a.includes(`<html lang="${p.lang}">`), `html lang is ${p.lang}`)
  ok(a.includes(`<link rel="canonical" href="${B}${p.url}">`), `canonical is ${B}${p.url}`)
  for (const q of LANGS) ok(a.includes(`<link rel="alternate" hreflang="${q.lang}" href="${B}${q.url}">`), `hreflang ${q.lang} → ${q.url}`)
  ok(a.includes(`<link rel="alternate" hreflang="x-default" href="${B}/articles">`), 'x-default → /articles')
  ok((a.match(/<title>[^<]+<\/title>/g) || []).length === 1 && /<meta name="description" content="[^"]{60,}">/.test(a), 'title + description')
  ok(a.includes(`<meta property="og:url" content="${B}${p.url}">`), 'og:url')
  ok(!a.includes('pa-article') && !a.includes('pa-full') && !a.includes('pa-text'), 'index only: no full articles')
  const cards = cardHrefs(a)
  ok(cards.length === SLUGS.length && cards.every((h) => CARD_HREF.test(h) && h.startsWith(`${p.url}/`)), `${cards.length} cards, each links to ${p.url}/<slug>`)
  ok(SLUGS.every((slug) => cards.includes(`${p.url}/${slug}`)), 'every seed article has a card')
  const all = new Set([...a.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]))
  ok(hrefs(a).filter((h) => h.startsWith('#')).every((h) => all.has(h.slice(1))), 'in-page anchors resolve')
  const ld = jsonLd(a)
  ok(ld['@type'] === 'Blog' && ld.inLanguage === p.lang && ld.blogPost.length === SLUGS.length
    && ld.blogPost.every((b, i) => b['@type'] === 'BlogPosting' && b.inLanguage === p.lang && b.url === `${B}${p.url}/${SLUGS[i]}`), 'Blog JSON-LD: a BlogPosting per article, url = its own page')
  const main = hrefs(a.match(/<nav class="main-nav"[\s\S]*?<\/nav>/)[0])
  ok(main.length === 7 && main.every((h) => h === p.url || h.startsWith(`${p.home}#`)), 'menu links point back to the landing')
  ok(new RegExp(`<a href="${p.url}" aria-current="page">`).test(a), 'articles menu item is current')
  const sw = hrefs(a.match(/<nav class="lang-switch"[\s\S]*?<\/nav>/)[0])
  ok(sw.join() === '/articles,/en/articles,/kz/articles', 'language switcher links to the articles pages')
  ok(a.includes(`<a class="btn btn-primary header-cta" href="${p.home}#signup">`), 'header CTA goes to the landing signup')
  const chips = [...a.matchAll(/<button type="button" class="pa-chip" data-filter="(\w+)" aria-pressed="(true|false)">/g)]
  ok(chips.length === 4 && chips[0][1] === 'all' && chips[0][2] === 'true', '4 chips, "all" pressed')
  const mainImgs = [...between(a, '<main', '</main>').matchAll(/<img [^>]*>/g)]
  ok(mainImgs.length >= 2 && mainImgs.every((m) => /width="\d+" height="\d+"/.test(m[0]) && /loading="lazy"|fetchpriority="high"/.test(m[0])), 'card images have size and loading hints')
  for (const m of a.matchAll(/src="(\/home\/assets\/[^"]+)"/g)) ok(existsSync('public' + m[1]), `${m[1]} exists`)
  ok(!a.includes('<style') && !a.includes('/main/v2.js'), 'no inline <style>; v2.js (landing form) not loaded')
  ok(a.includes('<script src="/main/articles.js" defer>'), 'articles.js loaded')
  if (p.lang === 'en') {
    const t = a.replace(/<script[\s\S]*?<\/script>/g, ' ').replace(/<[^>]+>/g, ' ')
    ok(!/[А-Яа-яЁё]/.test(t.replace(/\bRU\b/g, '')), 'no Cyrillic in the EN page')
  }
}

console.log('seed (article pages while the DB is unreachable)')
ok(SEED.length === 6 && SEED.every((a) => ['ru', 'en', 'kk'].every((l) => a[`title_${l}`] && a[`teaser_${l}`] && a[`body_${l}`])), '6 seed articles, all in RU/EN/KZ')
const migration = readFileSync('supabase/migrations/20261124_articles.sql', 'utf8')
ok(SLUGS.every((slug) => migration.includes(`('${slug}',`)), 'same slugs as the migration seed')

console.log('routing')
const cfg = readFileSync('next.config.ts', 'utf8')
ok(!/source: "(\/en|\/kz)?\/articles"/.test(cfg), 'no rewrites for /articles (route handlers render them)')
for (const r of ['/articles', '/en/articles', '/kz/articles', '/articles/[slug]', '/en/articles/[slug]', '/kz/articles/[slug]']) {
  ok(existsSync(`src/app${r}/route.ts`), `${r} route handler`)
  ok(cfg.includes(`"${r}": articlesTemplates`), `${r} bundles the template files`)
}
for (const [from, to] of [['/main/articles', '/articles'], ['/main/articles/en', '/en/articles'], ['/main/articles/kk', '/kz/articles']])
  ok(cfg.includes(`{ source: "${from}", destination: "${to}", permanent: true }`), `${from} → ${to} (permanent)`)
// Vercel serves public/<dir>/index.html before routes, so no folder may sit at an articles URL.
ok(!existsSync('public/articles'), 'no public/articles folder shadows the route')

console.log('assets')
const css = readFileSync('public/main/v2.css', 'utf8')
ok(/@media \(hover:hover\)\{[^@]*\.qb:hover\{transform/.test(css), 'card lift only on hover-capable devices')
ok(/@media \(prefers-reduced-motion:reduce\)\{\.qb\{transition:none\}/.test(css), 'no card transition with reduced motion')
ok(/@media \(max-width:900px\)\{[\s\S]*?\.qb-rail\{display:flex;[^}]*scroll-snap-type:x mandatory[\s\S]*?\.qb-rail>li\{flex:0 0 82%/.test(css), 'phones: scroll-snap rail, next card peeks')
ok(existsSync('public/main/articles.css') && existsSync('public/main/articles.js'), 'articles.css + articles.js exist')
ok(/location\.replace\(/.test(readFileSync('public/main/articles.js', 'utf8')), 'articles.js redirects old /articles#<slug> links')
ok(/replace\(\/\[\^\/\]\+\$\/, a\.slug\)/.test(readFileSync('public/main/v2.js', 'utf8')), 'v2.js swaps landing cards to /articles/<slug>')

async function get(base, path) {
  const res = await fetch(base + path, { redirect: 'manual' })
  return { status: res.status, html: await res.text() }
}

/** The running app: index pages, every article page in every language, 404s, landing links. */
async function appChecks(base, label) {
  console.log(`\n--- ${label}: ${base} ---`)
  const titles = {}
  for (const p of LANGS) {
    console.log(`${p.url}`)
    const { status, html } = await get(base, p.url)
    ok(status === 200, `${p.url} → 200`)
    ok(!html.includes('pa-article') && !html.includes('pa-full') && !html.includes('pa-text'), 'index only: no .pa-article / pa-full')
    const cards = cardHrefs(html)
    ok(cards.length >= SLUGS.length && cards.every((h) => CARD_HREF.test(h) && h.startsWith(`${p.url}/`)), `${cards.length} cards (featured + grid), each links to ${p.url}/<slug>`)
    const posts = jsonLd(html).blogPost.map((b) => b.url)
    ok(posts.length === cards.length && cards.every((h) => posts.includes(B + h)), 'JSON-LD urls = card urls')

    const landing = await get(base, p.home)
    ok(landing.status === 200, `${p.home} → 200`)
    landingChecks(landing.html, p)

    for (const slug of SLUGS) {
      const url = `${p.url}/${slug}`
      const { status: st, html: a } = await get(base, url)
      const title = SEED.find((x) => x.slug === slug)[`title_${p.lang}`]
      const t = a.match(/<title>([^<]*)<\/title>/)?.[1]
      titles[t] = (titles[t] || 0) + 1
      const ld = st === 200 && jsonLd(a)
      const sw = st === 200 ? hrefs(a.match(/<nav class="lang-switch"[\s\S]*?<\/nav>/)[0]) : []
      const more = st === 200 ? cardHrefs(between(a, '<section class="pa-more"', '</section>')) : []
      ok(st === 200
        && t.startsWith(title.replace(/&/g, '&amp;'))
        && a.includes(`<link rel="canonical" href="${B}${url}">`)
        && LANGS.every((q) => a.includes(`<link rel="alternate" hreflang="${q.lang}" href="${B}${q.url}/${slug}">`))
        && a.includes(`<link rel="alternate" hreflang="x-default" href="${B}/articles/${slug}">`)
        && a.includes(`<meta property="og:url" content="${B}${url}">`) && a.includes('<meta property="og:type" content="article">')
        && /<meta name="description" content="[^"]{10,}">/.test(a)
        && ld['@type'] === 'BlogPosting' && ld.url === B + url && ld.inLanguage === p.lang
        && (a.match(/<article class="pa-article"/g) || []).length === 1 && a.includes(`<h1>${title}</h1>`)
        && between(a, '<nav class="pa-crumbs', '</nav>').includes(`href="${p.home}"`) && between(a, '<nav class="pa-crumbs', '</nav>').includes(`href="${p.url}"`)
        && a.includes(`href="${p.home}#signup"`) && /class="pa-box-wa" href="https:\/\/wa\.me\/77077872210\?text=/.test(a)
        && more.length >= 2 && more.length <= 3 && more.every((h) => CARD_HREF.test(h) && h.startsWith(`${p.url}/`) && h !== url)
        && a.includes(`<a class="pa-back" href="${p.url}">`)
        && sw.join() === LANGS.map((q) => `${q.url}/${slug}`).join(),
      `${url} → 200: own title, canonical, hreflang ×4, OG, BlogPosting, CTA, ${more.length} more, back link, switcher keeps the slug`)
    }
    for (const bad of ['does-not-exist', 'upload']) {
      const r = await get(base, `${p.url}/${bad}`)
      ok(r.status === 404 && r.html.includes('noindex'), `${p.url}/${bad} → 404`)
    }
  }
  ok(Object.values(titles).every((n) => n === 1), 'every article page has its own <title>')
}

if (process.env.ARTICLES_BASE) await appChecks(process.env.ARTICLES_BASE, 'app (DB)')
else console.log('\n- ARTICLES_BASE not set: app checks skipped')
if (process.env.ARTICLES_FALLBACK_BASE) await appChecks(process.env.ARTICLES_FALLBACK_BASE, 'app without DB (fallback)')

if (failures) { console.error(`\n${failures} failure(s)`); process.exit(1) }
console.log('\nall passed')
