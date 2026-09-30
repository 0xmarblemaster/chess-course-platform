// Dependency-free tests for the /v1 night landing mobile responsiveness work.
// Run: node tests/v1-mobile.test.mjs
import { readFileSync } from 'fs'

let failures = 0
const ok = (cond, msg) => { if (cond) { console.log(`  ✓ ${msg}`) } else { failures++; console.error(`  ✗ ${msg}`) } }

const styles = readFileSync('public/v1/styles.css', 'utf8')
const board = readFileSync('public/shared/board3d.js', 'utf8')
const pages = {
  ru: readFileSync('public/v1/index.html', 'utf8'),
  en: readFileSync('public/v1/en/index.html', 'utf8'),
  kk: readFileSync('public/v1/kk/index.html', 'utf8'),
}

// 1. Empty-menu fix: header backdrop-filter is dropped while the mobile nav is open,
//    otherwise it becomes the containing block for the fixed nav and collapses it to 0 height.
console.log('mobile nav drawer')
ok(/body\.nav-open\s+\.site-header\s*\{[^}]*backdrop-filter:\s*none/s.test(styles),
  'header backdrop-filter is disabled when body.nav-open (drawer fills viewport)')

// 2. Header fits on phones so the burger stays on-screen (no sideways scroll).
console.log('header fits small screens')
ok(/@media\s*\(max-width:560px\)[\s\S]*?\.site-header \.wrap\{[^}]*padding-inline/s.test(styles),
  'header wrap padding is reduced on mobile')
ok(/@media\s*\(max-width:560px\)[\s\S]*?\.lang-switch a\{[^}]*min-width/s.test(styles),
  'lang-switch buttons shrink on mobile')
ok(/\.lang-switch a\{[^}]*min-height:44px/s.test(styles),
  'lang-switch keeps a >=44px tap target on mobile')

// 3. Contacts stacks on mobile (desktop 2-col grid cramps the map + contact list).
console.log('contacts stacks')
ok(/@media\s*\(max-width:820px\)[\s\S]*?#contacts \.contacts-grid\{[^}]*grid-template-columns:\s*minmax\(0,1fr\)/s.test(styles),
  '#contacts.contacts-grid collapses to a single column <=820px')

// 4. Display type scales down on phones (also lets long Kazakh words wrap).
console.log('type scale')
ok(/@media\s*\(max-width:480px\)[\s\S]*?h1\{font-size:clamp\(/s.test(styles), 'h1 scales down <=480px')
ok(/@media\s*\(max-width:480px\)[\s\S]*?h2\{font-size:clamp\(/s.test(styles), 'h2 scales down <=480px')

// 5. Map placeholder label stays inside the viewport at 320px.
console.log('map placeholder')
ok(/\.map-placeholder p\{[^}]*font-size:18px/s.test(styles), 'map placeholder text is reduced on mobile')

// 6. 3D board pauses its render loop when the tab is backgrounded (mobile battery/GPU).
console.log('3D board perf')
ok(/visibilitychange/.test(board), 'board3d pauses/resumes on visibilitychange')
ok(/document\.hidden[^]*cancelAnimationFrame/s.test(board), 'render loop is cancelled while the tab is hidden')

// 7. The three language pages stay structurally in sync (same sections, burger, viewport meta).
console.log('language pages in sync')
const SECTION_IDS = ['top', 'about', 'features', 'path', 'branches', 'tournaments', 'trainers',
  'programs', 'adults', 'prices', 'trial', 'blog', 'reviews', 'faq', 'contacts']
for (const [lang, html] of Object.entries(pages)) {
  ok(/name="viewport"[^>]*width=device-width/.test(html), `${lang}: has responsive viewport meta`)
  ok(/<button class="burger"/.test(html), `${lang}: has burger button`)
  ok(/id="main-nav"/.test(html), `${lang}: has #main-nav drawer`)
  const missing = SECTION_IDS.filter((id) => !new RegExp(`id="${id}"`).test(html))
  ok(missing.length === 0, `${lang}: all ${SECTION_IDS.length} sections present${missing.length ? ' (missing: ' + missing.join(',') + ')' : ''}`)
}

console.log(`\n${failures === 0 ? 'PASS' : 'FAIL'}: ${failures} failure(s)`)
process.exit(failures === 0 ? 0 : 1)
