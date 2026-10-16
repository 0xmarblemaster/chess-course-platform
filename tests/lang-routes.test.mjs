// Language routing for the landing: /ru (default), /en, /kz.
// Run: node tests/lang-routes.test.mjs
import { readFileSync } from 'fs'

let failures = 0
const ok = (cond, msg) => { if (cond) { console.log(`  ✓ ${msg}`) } else { failures++; console.error(`  ✗ ${msg}`) } }

const B = 'https://www.chessempire.kz'
const pages = [
  { lang: 'ru', file: 'public/home/index.html', path: '/ru' },
  { lang: 'en', file: 'public/home/en/index.html', path: '/en' },
  { lang: 'kk', file: 'public/home/kk/index.html', path: '/kz' },
]

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
}

console.log('next.config.ts')
const cfg = readFileSync('next.config.ts', 'utf8')
ok(/source: "\/", destination: "\/ru", permanent: false/.test(cfg), '/ redirects to /ru')
ok(cfg.includes('{ source: "/ru", destination: "/home/index.html" }'), '/ru serves RU page')
ok(cfg.includes('{ source: "/en", destination: "/home/en/index.html" }'), '/en serves EN page')
ok(cfg.includes('{ source: "/kz", destination: "/home/kk/index.html" }'), '/kz serves KK page')
for (const [from, to] of [['/home', '/ru'], ['/home/en', '/en'], ['/home/kk', '/kz'], ['/kk', '/kz']])
  ok(cfg.includes(`{ source: "${from}", destination: "${to}", permanent: true }`), `${from} → ${to} (permanent)`)

if (failures) { console.error(`\n${failures} failure(s)`); process.exit(1) }
console.log('\nall passed')
