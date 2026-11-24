// "Parents ask — coaches answer" block on the landing + the /articles pages (.ralph-articles-spec.md).
// Run: node tests/articles.test.mjs
import { readFileSync, existsSync } from 'fs'

let failures = 0
const ok = (cond, msg) => { if (cond) { console.log(`  ✓ ${msg}`) } else { failures++; console.error(`  ✗ ${msg}`) } }

const B = 'https://www.chessempire.kz'
const LANGS = [
  { lang: 'ru', landing: 'public/main/index.html', page: 'public/main/articles/index.html', url: '/articles', home: '/ru' },
  { lang: 'en', landing: 'public/main/en/index.html', page: 'public/main/articles/en/index.html', url: '/en/articles', home: '/en' },
  { lang: 'kk', landing: 'public/main/kk/index.html', page: 'public/main/articles/kk/index.html', url: '/kz/articles', home: '/kz' },
]
const LANDING_IDS = ['age-to-start', 'focus', 'first-tournament', 'fide-rating']
const hrefs = (s) => [...s.matchAll(/href="([^"]*)"/g)].map((m) => m[1])

for (const p of LANGS) {
  console.log(p.landing)
  const s = readFileSync(p.landing, 'utf8')
  const sections = [...s.matchAll(/<section\b[^>]*\bid="([^"]+)"/g)].map((m) => m[1])
  const i = sections.indexOf('articles')
  ok(i > 0 && sections[i - 1] === 'trainers' && sections[i + 1] === 'branches', '#articles sits right after #trainers and before #branches')
  const sec = s.slice(s.indexOf('id="articles"'), s.indexOf('id="branches"'))
  ok((sec.match(/<li><a class="qb"/g) || []).length === 4, '4 question cards')
  const links = hrefs(sec)
  ok(links.length === 5 && links.every((h) => h === p.url || h.startsWith(`${p.url}#`)), `every link goes to ${p.url}`)
  ok(LANDING_IDS.every((id) => links.includes(`${p.url}#${id}`)), 'cards link to the four article anchors')
  ok(links.includes(p.url), `"all articles" links to ${p.url}`)
  ok(!sec.includes('<style') && !/style="/.test(sec), 'no inline styles')
  const nav = hrefs(s.match(/<nav class="main-nav"[\s\S]*?<\/nav>/)[0])
  ok(nav.indexOf('#articles') === nav.indexOf('#trainers') + 1, 'menu: #articles right after #trainers')
  const foot = hrefs(s.slice(s.indexOf('<footer')).match(/<ul>(?:(?!<\/ul>)[\s\S])*href="#signup"[\s\S]*?<\/ul>/)[0])
  ok(foot.indexOf('#articles') === foot.indexOf('#trainers') + 1, 'footer sections: #articles right after #trainers')

  console.log(p.page)
  ok(existsSync(p.page), 'page exists')
  const a = readFileSync(p.page, 'utf8')
  ok(a.includes(`<html lang="${p.lang}">`), `html lang is ${p.lang}`)
  ok(a.includes('<!-- MOCK ARTICLES: placeholder texts, replace with real content -->'), 'marked as mock content')
  ok(a.includes(`<link rel="canonical" href="${B}${p.url}">`), `canonical is ${B}${p.url}`)
  for (const q of LANGS) ok(a.includes(`<link rel="alternate" hreflang="${q.lang}" href="${B}${q.url}">`), `hreflang ${q.lang} → ${q.url}`)
  ok(a.includes(`<link rel="alternate" hreflang="x-default" href="${B}/articles">`), 'x-default → /articles')
  ok((a.match(/<title>[^<]+<\/title>/g) || []).length === 1 && /<meta name="description" content="[^"]{60,}">/.test(a), 'title + description')
  ok(a.includes(`<meta property="og:url" content="${B}${p.url}">`), 'og:url')
  const ids = [...a.matchAll(/<article\b[^>]*\bid="([^"]+)"/g)].map((m) => m[1])
  ok(ids.length >= 6, `${ids.length} full articles`)
  ok(LANDING_IDS.every((id) => ids.includes(id)), 'every landing anchor exists on the page')
  const all = new Set([...a.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]))
  ok(hrefs(a).filter((h) => h.startsWith('#')).every((h) => all.has(h.slice(1))), 'in-page anchors resolve')
  const ld = JSON.parse(a.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1])
  ok(ld['@type'] === 'Blog' && ld.inLanguage === p.lang && ld.blogPost.length === ids.length
    && ld.blogPost.every((b) => b['@type'] === 'BlogPosting' && b.inLanguage === p.lang && b.url.startsWith(`${B}${p.url}#`)), 'Blog JSON-LD with a BlogPosting per article')
  const main = hrefs(a.match(/<nav class="main-nav"[\s\S]*?<\/nav>/)[0])
  ok(main.length === 7 && main.every((h) => h === p.url || h.startsWith(`${p.home}#`)), 'menu links point back to the landing')
  ok(new RegExp(`<a href="${p.url}" aria-current="page">`).test(a), 'articles menu item is current')
  const sw = [...a.match(/<nav class="lang-switch"[\s\S]*?<\/nav>/)[0].matchAll(/href="([^"]+)"/g)].map((m) => m[1])
  ok(sw.join() === '/articles,/en/articles,/kz/articles', 'language switcher links to the articles pages')
  ok(a.includes(`<a class="btn btn-primary header-cta" href="${p.home}#signup">`), 'header CTA goes to the landing signup')
  const chips = [...a.matchAll(/<button type="button" class="pa-chip" data-filter="(\w+)" aria-pressed="(true|false)">/g)]
  ok(chips.length === 4 && chips[0][1] === 'all' && chips[0][2] === 'true', '4 chips, "all" pressed')
  ok(ids.every((id) => a.includes(`href="#${id}"`)), 'every article has a card')
  const boxes = (a.match(/<aside class="pa-box">[\s\S]*?<\/aside>/g) || [])
  ok(boxes.length === ids.length && boxes.every((b) => b.includes(`href="${p.home}#signup"`) && b.includes('href="https://wa.me/77077872210?text=')), 'each article ends with signup + WhatsApp')
  const mainImgs = [...a.slice(a.indexOf('<main'), a.indexOf('</main>')).matchAll(/<img [^>]*>/g)]
  ok(mainImgs.length >= 2 && mainImgs.every((m) => /width="\d+" height="\d+"/.test(m[0]) && /loading="lazy"|fetchpriority="high"/.test(m[0])), 'article images have size and loading hints')
  for (const m of a.matchAll(/src="(\/home\/assets\/[^"]+)"/g)) ok(existsSync('public' + m[1]), `${m[1]} exists`)
  ok(!a.includes('<style') && !a.includes('/main/v2.js'), 'no inline <style>; v2.js (landing form) not loaded')
  ok(a.includes('<script src="/main/articles.js" defer>'), 'articles.js loaded')
  if (p.lang === 'en') {
    const t = a.replace(/<script[\s\S]*?<\/script>/g, ' ').replace(/<[^>]+>/g, ' ')
    ok(!/[А-Яа-яЁё]/.test(t.replace(/\bRU\b/g, '')), 'no Cyrillic in the EN page')
  }
}

console.log('next.config.ts')
const cfg = readFileSync('next.config.ts', 'utf8')
for (const [from, to] of [['/articles', '/main/articles/index.html'], ['/en/articles', '/main/articles/en/index.html'], ['/kz/articles', '/main/articles/kk/index.html']])
  ok(cfg.includes(`{ source: "${from}", destination: "${to}" }`), `${from} serves ${to}`)
for (const [from, to] of [['/main/articles', '/articles'], ['/main/articles/en', '/en/articles'], ['/main/articles/kk', '/kz/articles']])
  ok(cfg.includes(`{ source: "${from}", destination: "${to}", permanent: true }`), `${from} → ${to} (permanent)`)
// Vercel serves public/<dir>/index.html before rewrites, so no folder may sit at a rewritten URL.
ok(!existsSync('public/articles'), 'no public/articles folder shadows the rewrite')

console.log('assets')
const css = readFileSync('public/main/v2.css', 'utf8')
ok(/@media \(hover:hover\)\{[^@]*\.qb:hover\{transform/.test(css), 'card lift only on hover-capable devices')
ok(/@media \(prefers-reduced-motion:reduce\)\{\.qb\{transition:none\}/.test(css), 'no card transition with reduced motion')
ok(/@media \(max-width:900px\)\{[\s\S]*?\.qb-rail\{display:flex;[^}]*scroll-snap-type:x mandatory[\s\S]*?\.qb-rail>li\{flex:0 0 82%/.test(css), 'phones: scroll-snap rail, next card peeks')
ok(existsSync('public/main/articles.css') && existsSync('public/main/articles.js'), 'articles.css + articles.js exist')

if (failures) { console.error(`\n${failures} failure(s)`); process.exit(1) }
console.log('\nall passed')
