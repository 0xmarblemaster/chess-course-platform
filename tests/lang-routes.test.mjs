// Language routing for the landing: /ru (default), /en, /kz serve the v2 design;
// the previous landing lives at /v2, /v2/en, /v2/kz with noindex.
// Run: node tests/lang-routes.test.mjs
import { readFileSync, existsSync } from 'fs'

let failures = 0
const ok = (cond, msg) => { if (cond) { console.log(`  ✓ ${msg}`) } else { failures++; console.error(`  ✗ ${msg}`) } }

const B = 'https://www.chessempire.kz'
const pages = [
  { lang: 'ru', file: 'public/main/index.html', path: '/ru' },
  { lang: 'en', file: 'public/main/en/index.html', path: '/en' },
  { lang: 'kk', file: 'public/main/kk/index.html', path: '/kz' },
]
const old = ['public/home/index.html', 'public/home/en/index.html', 'public/home/kk/index.html']

for (const p of pages) {
  console.log(p.file)
  const s = readFileSync(p.file, 'utf8')
  ok(s.includes(`<html lang="${p.lang}"`), `html lang is ${p.lang}`)
  ok(s.includes(`<link rel="canonical" href="${B}${p.path}">`), `canonical is ${B}${p.path}`)
  for (const q of pages) ok(s.includes(`<link rel="alternate" hreflang="${q.lang}" href="${B}${q.path}">`), `hreflang ${q.lang} → ${q.path}`)
  ok(s.includes(`<link rel="alternate" hreflang="x-default" href="${B}/ru">`), 'x-default → /ru')
  const nav = s.match(/<nav class="lang-switch"[^>]*>(.*?)<\/nav>/)?.[1] || ''
  const links = [...nav.matchAll(/<a href="([^"]+)" hreflang="(\w+)"[^>]*?( aria-current="page")?>/g)]
  ok(links.map((m) => m[1]).join(',') === '/ru,/en,/kz', 'switcher links are /ru, /en, /kz')
  ok(links.filter((m) => m[3]).map((m) => m[2]).join() === p.lang, `only ${p.lang} is marked current`)
  ok(!s.includes('https://chessempire.kz'), 'no bare-domain URLs left')
  ok(!s.includes('noindex'), 'indexable')
}

for (const f of old) {
  console.log(f)
  ok(readFileSync(f, 'utf8').includes('<meta name="robots" content="noindex">'), 'old landing is noindex')
}

console.log('next.config.ts')
const cfg = readFileSync('next.config.ts', 'utf8')
ok(/source: "\/", destination: "\/ru", permanent: false/.test(cfg), '/ redirects to /ru')
for (const [from, to] of [['/ru', '/main/index.html'], ['/en', '/main/en/index.html'], ['/kz', '/main/kk/index.html'],
  ['/v2', '/home/index.html'], ['/v2/en', '/home/en/index.html'], ['/v2/kz', '/home/kk/index.html']])
  ok(cfg.includes(`{ source: "${from}", destination: "${to}" }`), `${from} serves ${to}`)
ok(!cfg.includes('destination: "/v2/index.html",'), 'no /v2 → /v2/index.html redirect left')
for (const [from, to] of [['/home', '/ru'], ['/home/en', '/en'], ['/home/kk', '/kz'], ['/kk', '/kz'], ['/main', '/ru'], ['/main/en', '/en'], ['/main/kk', '/kz']])
  ok(cfg.includes(`{ source: "${from}", destination: "${to}", permanent: true }`), `${from} → ${to} (permanent)`)

// Vercel serves public/<dir>/index.html before rewrites, so no folder may sit at a rewritten URL.
for (const d of ['ru', 'en', 'kz', 'v2']) ok(!existsSync(`public/${d}`), `no public/${d} folder shadows the /${d} rewrite`)

if (failures) { console.error(`\n${failures} failure(s)`); process.exit(1) }
console.log('\nall passed')
