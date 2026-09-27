// Dependency-free tests for the Chess (Classic) homepage port.
// Run: node tests/landing.test.mjs
import { readFileSync } from 'fs'

let failures = 0
const ok = (cond, msg) => { if (cond) { console.log(`  ✓ ${msg}`) } else { failures++; console.error(`  ✗ ${msg}`) } }

const EXPECTED_WA =
  'https://api.whatsapp.com/send/?phone=77077872210&text=%D0%97%D0%B4%D1%80%D0%B0%D0%B2%D1%81%D1%82%D0%B2%D1%83%D0%B9%D1%82%D0%B5%21%0A%0A%D0%9F%D0%B8%D1%88%D1%83+%D0%B8%D0%B7+%D0%BF%D1%80%D0%B8%D0%BB%D0%BE%D0%B6%D0%B5%D0%BD%D0%B8%D1%8F+2%D0%93%D0%98%D0%A1.%0A%0A&type=phone_number&app_absent=0'

// 1. WhatsApp constant is exact.
console.log('WhatsApp lead URL')
const waSrc = readFileSync('src/lib/whatsapp.ts', 'utf8')
ok(waSrc.includes(EXPECTED_WA), 'WHATSAPP_LEAD_URL matches the exact required URL')
ok(/export const WHATSAPP_LEAD_URL/.test(waSrc), 'exported as a constant named WHATSAPP_LEAD_URL')

// 2. i18n: landing namespace present in all locales, existing keys preserved.
console.log('i18n locales')
const contentSrc = readFileSync(
  '/root/clawd/files/5731393254/chess-empire-landing/production/_source/content.js', 'utf8')
const T = new Function(contentSrc + '\n; return T;')()
const expectedKeys = Object.keys(T)
for (const loc of ['ru', 'en', 'kk']) {
  const j = JSON.parse(readFileSync(`public/locales/${loc}/common.json`, 'utf8'))
  ok(!!j.landing, `${loc}: landing namespace exists`)
  ok(!!j.home && !!j.navigation, `${loc}: existing home/navigation keys preserved`)
  const missing = expectedKeys.filter((k) => !(k in (j.landing || {})))
  ok(missing.length === 0, `${loc}: all ${expectedKeys.length} content keys present${missing.length ? ' (missing: ' + missing.slice(0, 5).join(',') + ')' : ''}`)
}

// 3. Every static t('landing.X') / html('X') key used in the UI exists in ru landing.
console.log('landing key references resolve')
const ru = JSON.parse(readFileSync('public/locales/ru/common.json', 'utf8')).landing
const page = readFileSync('src/app/page.tsx', 'utf8')
const nav = readFileSync('src/components/Navigation.tsx', 'utf8')
const src = page + nav
const refs = new Set()
for (const m of src.matchAll(/t\(['"`]landing\.([a-z0-9_]+)['"`]/g)) refs.add(m[1])
for (const m of src.matchAll(/html\(['"`]([a-z0-9_]+)['"`]\)/g)) refs.add(m[1])
const unresolved = [...refs].filter((k) => !(k in ru))
ok(unresolved.length === 0, `all ${refs.size} static landing keys resolve${unresolved.length ? ' (missing: ' + unresolved.join(',') + ')' : ''}`)

// 4. CTAs go to WhatsApp, not /checkout or /login, on the homepage.
console.log('CTA wiring')
ok(page.includes("from '@/lib/whatsapp'"), 'page imports the WhatsApp constant')
ok(!/href=["']\/checkout["']/.test(page), 'no /checkout CTA on homepage')
ok(!/href=["']\/login["']/.test(page), 'no /login CTA on homepage')
const waLinkCount = (page.match(/\{\.\.\.WA_LINK\}/g) || []).length
ok(waLinkCount >= 5, `homepage has ${waLinkCount} WhatsApp CTAs (hero/branch/trainers/adults/contacts/cta)`)
ok(page.includes('openWhatsAppLead()'), 'trial form submit opens WhatsApp')

// 5. Fonts mapped via next/font in layout.
console.log('fonts')
const layout = readFileSync('src/app/layout.tsx', 'utf8')
for (const f of ['Cormorant_Garamond', 'IBM_Plex_Sans', 'JetBrains_Mono']) {
  ok(layout.includes(f), `layout loads ${f} via next/font`)
}
for (const v of ['--font-cormorant', '--font-ibm-plex', '--font-jetbrains']) {
  ok(layout.includes(v), `layout exposes ${v}`)
}
const css = readFileSync('src/app/landing-chess.css', 'utf8')
ok(/\.chess-classic\s*\{[^}]*--font-display:\s*var\(--font-cormorant\)/s.test(css), 'CSS maps --font-display → --font-cormorant')
ok(css.includes('.chess-classic .logo-gradient'), 'CSS recolors the logo under .chess-classic')

console.log(`\n${failures === 0 ? 'PASS' : 'FAIL'}: ${failures} failure(s)`)
process.exit(failures === 0 ? 0 : 1)
