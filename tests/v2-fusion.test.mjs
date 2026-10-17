// Tests for the /v2 "Fusion" landing (docs/PRD-v2-fusion.md §8).
// Run: node --test tests/v2-fusion.test.mjs
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, existsSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { spawnSync } from 'node:child_process'
import vm from 'node:vm'

const html = readFileSync('public/main/index.html', 'utf8')
const css = readFileSync('public/main/v2.css', 'utf8')
const js = readFileSync('public/main/v2.js', 'utf8')
const branchesSrc = readFileSync('public/home/shared/branches.js', 'utf8')
const text = html.replace(/<script[\s\S]*?<\/script>/g, ' ').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ')

// sha256 of the old /ru, /en, /kz (now /v2, /v2/en, /v2/kz) and /v1 HTML taken before the v2 work (2026-10-17).
// The old landing only gained a noindex line when it moved to /v2.
const BASELINE = {
  'public/home/index.html': '6243738fdfe0139abe44eb101a5086a6826857c757f2ba7dfdf5d85488aa02f0',
  'public/home/en/index.html': '41d110b6c5cb4c41999e9687afda78f306185eefa077b52fb7411862747e86f2',
  'public/home/kk/index.html': 'bb2f459efef152b617f0ef15693726fb20a8ac0b0f8b5160f86fe3ecc48ce09a',
  'public/v1/index.html': '3ab9d7685ea3b4380ada003609d899df457342b9711d8099cb54c0d685f62e87',
}

test('1. section ids are present in PRD §5 order', () => {
  const order = ['top', 'about', 'skills', 'approach', 'trainers', 'club', 'path', 'fide', 'reviews', 'branches', 'faq', 'signup']
  const found = [...html.matchAll(/<section\b[^>]*\bid="([^"]+)"/g)].map((m) => m[1])
  assert.deepEqual(found, order)
  const pos = (s) => html.indexOf(s)
  assert.ok(pos('class="site-header"') < pos('id="top"'), 'header comes first')
  assert.ok(pos('id="signup"') < pos('class="cta-band"') && pos('class="cta-band"') < pos('class="site-footer"'), 'CTA band and footer close the page')
})

test('2. forbidden strings are absent', () => {
  const forbidden = ['Демо', 'Временный', '[Текст', 'Фото:', 'Статья 1', 'чемпион', '2016', '2018', '12 учеников', 'Анна К.']
  for (const [name, src] of [['index.html', html], ['v2.css', css], ['v2.js', js]]) {
    for (const s of forbidden) assert.ok(!src.toLowerCase().includes(s.toLowerCase()), `${name} contains "${s}"`)
  }
  assert.ok(!/placeholder text|lorem|TODO/i.test(html), 'no placeholder markers')
  assert.ok(!/<blockquote|class="review"/.test(html), 'no review quotes')
})

test('3. every wa.me link uses 77077872210', () => {
  const links = [...html.matchAll(/wa\.me\/([^?"'\s]*)/g)].map((m) => m[1])
  assert.ok(links.length >= 3, `found ${links.length} wa.me links`)
  for (const l of links) assert.equal(l, '77077872210')
  assert.ok(!/wa\.me\/(?!" \+ WHATSAPP)/.test(js), 'v2.js builds wa.me links only from WHATSAPP')
  assert.match(js, /var WHATSAPP = "77077872210"/)
  assert.ok(!/api\.whatsapp\.com/.test(html + js))
  assert.ok(!/tel:\+?7(?!7077872210)/.test(html), 'phone links use the same number')
})

test('4. every href="#x" points to an existing id', () => {
  const ids = new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]))
  const refs = [...html.matchAll(/href="#([^"]*)"/g)].map((m) => m[1])
  assert.ok(refs.length > 10)
  for (const r of refs) assert.ok(ids.has(r), `#${r} has no target`)
})

test('5. group size is always 10', () => {
  const nums = [
    ...[...text.matchAll(/(\d+)\s+(?:учеников\s+)?в\s+групп/g)],
    ...[...text.matchAll(/(\d+)\s+человек/g)],
    ...[...text.matchAll(/не более\s+(\d+)\s+учеников/g)],
  ].map((m) => m[1])
  assert.ok(nums.length >= 3, `found ${nums.length} group-size mentions`)
  for (const n of nums) assert.equal(n, '10')
})

test('6. FAQ JSON-LD matches the 7 visible questions', () => {
  const ld = JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1])
  assert.equal(ld['@type'], 'FAQPage')
  const faq = html.slice(html.indexOf('id="faq"'), html.indexOf('id="signup"'))
  const visible = [...faq.matchAll(/<summary><span>([^<]+)<\/span><\/summary><div class="faq-a"><p>([^<]+)<\/p>/g)]
  assert.equal(visible.length, 7)
  assert.equal(ld.mainEntity.length, visible.length)
  ld.mainEntity.forEach((q, i) => {
    assert.equal(q.name, visible[i][1])
    assert.equal(q.acceptedAnswer.text, visible[i][2])
  })
})

// Minimal DOM stub: enough for branches.js to build tabs and the branch card.
function runBranches(showPrice, lang = 'ru') {
  const el = (attrs = {}) => {
    const kids = []
    return {
      attrs, hidden: false, id: attrs.id || '', innerHTML: '', textContent: '', children: kids,
      setAttribute(k, v) { this.attrs[k] = String(v) }, hasAttribute(k) { return k in this.attrs },
      addEventListener() {}, focus() {}, appendChild(c) { kids.push(c) },
      querySelectorAll() { return kids }, querySelector(sel) { return (this.parts || {})[sel] || el() },
    }
  }
  const panel = el({ id: 'br-panel' })
  const root = el(showPrice ? { 'data-branch-picker': '', 'data-show-price': '' } : { 'data-branch-picker': '' })
  root.parts = { '.br-tabs': el(), '.bd': panel, '.bmap': el() }
  const document = {
    documentElement: { lang }, querySelector: (s) => (s === '[data-branch-picker]' ? root : null),
    createElement: () => el(), getElementById: () => el(),
  }
  vm.runInNewContext(branchesSrc, { document, setTimeout, clearTimeout })
  return panel.innerHTML
}

const NOINDEX = '<meta name="robots" content="noindex">\n'
test('7. old landing and /v1 HTML is unchanged apart from noindex; branches.js shows price only with data-show-price', () => {
  for (const [file, hash] of Object.entries(BASELINE)) {
    const src = readFileSync(file, 'utf8')
    if (file.startsWith('public/home/')) assert.equal(src.split(NOINDEX).length, 2, `${file} has one noindex line`)
    assert.equal(createHash('sha256').update(src.replace(NOINDEX, '')).digest('hex'), hash, `${file} changed`)
    assert.ok(!readFileSync(file, 'utf8').includes('data-show-price'), `${file} must not opt into prices`)
  }
  for (const lang of ['ru', 'en', 'kk']) {
    const plain = runBranches(false, lang)
    assert.ok(plain.includes('bd-facts'), `${lang}: branch card rendered`)
    assert.ok(!/bd-price|₸/.test(plain), `${lang}: no price without data-show-price`)
  }
  const priced = runBranches(true)
  assert.ok(priced.includes('Дебют'), 'first tab is Дебют')
  assert.ok(priced.includes('<dd class="bd-price">от 35 900 ₸/мес</dd>'), 'Дебют shows from 35 900')
  assert.match(html, /data-branch-picker data-show-price/)
  for (const [id, tier] of [['70000001104248570', 'premium'], ['70000001112466521', 'premium'], ['70000001030399258', 'base'],
    ['70000001061297172', 'base'], ['70000001055873518', 'base'], ['70000001089892904', 'base']]) {
    assert.ok(branchesSrc.includes(`gisId: "${id}", price: PRICE.${tier},`), `${id} → ${tier}`)
  }
  assert.match(branchesSrc, /PRICE = \{ base: "29\\u00a0500", premium: "35\\u00a0900" \}/)
})

test('8. existing tests: lang-routes passes; landing only has its pre-existing ENOENT failure', () => {
  const run = (f) => spawnSync(process.execPath, [f], { encoding: 'utf8' })
  const routes = run('tests/lang-routes.test.mjs')
  assert.equal(routes.status, 0, routes.stdout + routes.stderr)
  const landing = run('tests/landing.test.mjs')
  if (landing.status !== 0) {
    // Known since before v2: the test reads src/app/page.tsx, which no longer exists.
    assert.match(landing.stderr, /ENOENT[\s\S]*src\/app\/page\.tsx/, landing.stderr)
  }
})

test('page setup: RU at /ru, indexable, main design via absolute paths, no old /v2 leftovers', () => {
  assert.match(html, /<html lang="ru">/)
  assert.ok(!html.includes('noindex'), 'indexable')
  assert.match(html, /<link rel="canonical" href="https:\/\/www\.chessempire\.kz\/ru">/)
  for (const href of ['/home/shared/fonts.css', '/home/shared/base.css', '/home/styles.css', '/main/v2.css']) {
    assert.ok(html.includes(`<link rel="stylesheet" href="${href}">`), href)
  }
  for (const src of ['/home/shared/main.js', '/home/shared/branches.js', '/main/v2.js', '/home/shared/board3d-day.js']) {
    assert.ok(html.includes(`src="${src}"`), src)
  }
  assert.equal((html.match(/<h1[\s>]/g) || []).length, 1, 'one h1')
  assert.ok(!html.includes('class="trial-form"'), 'form must not be wired to main.js trial handler')
  assert.ok(!/data:[a-z]+\/[a-z+]+;base64/.test(html), 'no inline base64')
  for (const p of ['public/v2/styles.css', 'public/v2-modern']) assert.ok(!existsSync(p), `${p} removed`)
  assert.ok(!readFileSync('next.config.ts', 'utf8').includes('v2-modern'))
  for (const m of html.matchAll(/src="(\/home\/assets\/[^"]+)"/g)) assert.ok(existsSync('public' + m[1]), m[1])
})

test('content facts agree with the PRD', () => {
  assert.ok(text.includes('Первые шаги в шахматах — наша специализация'))
  const chips = [...html.matchAll(/<small>(\d+)<\/small><\/a><\/li>/g)].map((m) => +m[1])
  assert.equal(chips.length, 6)
  assert.equal(chips.reduce((a, b) => a + b, 0), 745, 'branch rating counts sum to 745')
  assert.ok(text.includes('745 оценок в 6 филиалах'))
  for (const p of ['29 500', '35 900', '37 500', '43 900', '45 500', '51 900', '44 250', '53 850']) assert.ok(text.includes(p + ' ₸'), p)
  for (const d of ['10%', '20%', '25%', '50%']) assert.ok(text.includes(d), d)
  assert.ok(text.includes('Чингис Нургалимов') && text.includes('Президент Союза Шахматистов г. Алматы'))
  for (const t of ['Асылхан Агбаевич', 'Василий Михайлович', 'Александр Олегович']) assert.ok(text.includes(t), t)
  assert.ok(text.includes('Международный рейтинг ФИДЕ') && !/ФИДЕ \d{4}\+?|FIDE 1[47]00/.test(text), 'FIDE target has no number')
  const ages = [...html.matchAll(/<select id="age"[\s\S]*?<\/select>/g)][0][0]
  for (const a of ['4–5', '6–7', '8–9', '10–12', '13+', 'взрослый']) assert.ok(ages.includes(a), a)
  assert.equal((html.match(/<select id="branch"[\s\S]*?<\/select>/)[0].match(/<option/g) || []).length, 8, 'placeholder + 6 branches + help')
})

// EN and KZ versions are built from the RU page: same markup, translated text.
const LANGS = [['en', 'public/main/en/index.html'], ['kk', 'public/main/kk/index.html']]
const tags = (h) => h.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/, '')
  .replace(/>[^<]*</g, '><').replace(/\s(alt|aria-label|placeholder|content|title|lang|href|hreflang|aria-current)="[^"]*"/g, '')
for (const [lang, file] of LANGS) {
  const h = readFileSync(file, 'utf8')
  const t = h.replace(/<script[\s\S]*?<\/script>/g, ' ').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ')
  test(`${lang}: same markup as RU, translated, working form and FAQ`, () => {
    assert.equal(tags(h), tags(html), 'tag structure matches RU')
    assert.match(h, new RegExp(`<html lang="${lang}">`))
    const ld = JSON.parse(h.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1])
    const visible = [...h.matchAll(/<summary><span>([^<]+)<\/span><\/summary><div class="faq-a"><p>([^<]+)<\/p>/g)]
    assert.equal(visible.length, 7)
    ld.mainEntity.forEach((q, i) => { assert.equal(q.name, visible[i][1]); assert.equal(q.acceptedAnswer.text, visible[i][2]) })
    for (const l of [...h.matchAll(/wa\.me\/([^?"'\s]*)/g)]) assert.equal(l[1], '77077872210')
    const ids = new Set([...h.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]))
    for (const m of h.matchAll(/href="#([^"]*)"/g)) assert.ok(ids.has(m[1]), `#${m[1]} has no target`)
    for (const p of ['29 500', '35 900', '37 500', '43 900', '45 500', '51 900', '44 250', '53 850']) assert.ok(t.includes(p + ' ₸'), p)
    assert.ok(t.includes('745'), 'rating count')
    assert.ok(!/чемпион|champion|2018/i.test(t), 'no champion / founding-year claims')
    const wa = decodeURIComponent(h.match(/wa\.me\/77077872210\?text=([^"]+)"/)[1])
    assert.ok(!/Здравствуйте/.test(wa), 'no-form WhatsApp text is translated')
    if (lang === 'en') {
      const cyr = t.replace(/\bRU\b/g, '').match(/[А-Яа-яЁё]+/g)
      assert.equal(cyr, null, `Cyrillic left in EN: ${cyr}`)
    }
  })
}

test('v2.js picks its WhatsApp text from <html lang>', () => {
  for (const [lang, hi] of [['ru', 'Здравствуйте! Хочу записать ребёнка'], ['en', 'Hello! I\'d like to sign my child up'], ['kk', 'Сәлеметсіз бе! Баламды']]) {
    const els = {}
    const el = (id) => els[id] || (els[id] = { id, value: '', hidden: false, tagName: id === 'name' ? 'INPUT' : 'SELECT', href: '', textContent: '', tabIndex: 0,
      classList: { toggle() {} }, setAttribute() {}, focus() {}, click() {}, addEventListener(ev, fn) { this['on' + ev] = fn },
      querySelector() { return el(id + '-child') } })
    const document = { documentElement: { lang }, getElementById: el, querySelectorAll: () => [] }
    const window = { matchMedia: () => ({ matches: false, addEventListener() {} }) }
    vm.runInNewContext(js, { document, window })
    el('name').value = 'Aigerim'; el('age').value = '6–7'; el('branch').value = 'help'
    el('v2-form').onsubmit({ preventDefault() {} })
    const msg = el('v2-msg').textContent
    assert.ok(msg.startsWith(hi), `${lang}: ${msg}`)
    assert.ok(msg.includes('Aigerim') && msg.includes('6–7'), `${lang}: fields in message`)
  }
})

test('reviews: screenshot strip loops seamlessly in every language', () => {
  for (const path of ['public/main/index.html', 'public/main/en/index.html', 'public/main/kk/index.html']) {
    const page = readFileSync(path, 'utf8')
    const reviews = page.slice(page.indexOf('id="reviews"'), page.indexOf('id="branches"'))
    const sets = [...reviews.matchAll(/<ul class="v2-shots-set"([^>]*)>([\s\S]*?)<\/ul>/g)]
    assert.equal(sets.length, 2, `${path}: two sets`)
    const ids = (s) => [...s.matchAll(/data-shot="(\d+)"/g)].map((m) => m[1])
    assert.ok(ids(sets[0][2]).length >= 6, `${path}: enough cards`)
    assert.deepEqual(ids(sets[1][2]), ids(sets[0][2]), `${path}: copy matches the original`)
    assert.ok(!sets[0][1].includes('aria-hidden') && sets[1][1].includes('aria-hidden="true"'), `${path}: only the copy is hidden`)
    const imgs = (s) => [...s.matchAll(/<img src="\/home\/assets\/reviews\/(review-\d+\.jpg)" alt="([^"]*)"/g)]
    assert.equal(imgs(sets[0][2]).length, ids(sets[0][2]).length, `${path}: every card shows a screenshot`)
    assert.ok(imgs(sets[0][2]).every((m) => m[2].length > 0), `${path}: original screenshots have alt text`)
    assert.ok(imgs(sets[1][2]).every((m) => m[2] === ''), `${path}: copy screenshots are not announced`)
    for (const m of imgs(sets[0][2])) assert.ok(existsSync(`public/home/assets/reviews/${m[1]}`), `${path}: ${m[1]} exists`)
  }
  assert.ok(css.includes("@keyframes v2-marquee{from{transform:translate3d(0,0,0)}to{transform:translate3d(-50%,0,0)}}"), "loop ends exactly one set left")
  assert.ok(css.includes("@media (prefers-reduced-motion:reduce){.v2-shots-track{animation-duration:120s!important;animation-iteration-count:infinite!important}}"), "reduced motion slows the strip instead of stopping it")
  assert.ok(!/prefers-reduced-motion[^@]*animation:none/.test(css), "strip never stops for reduced motion")
})

const PAGES = ['public/main/index.html', 'public/main/en/index.html', 'public/main/kk/index.html']
const WA_Q = {
  'public/main/index.html': 'Здравствуйте! У меня вопрос о занятиях в Chess Empire.',
  'public/main/en/index.html': 'Hello! I have a question about classes at Chess Empire.',
  'public/main/kk/index.html': 'Сәлеметсіз бе! Chess Empire сабақтары туралы сұрағым бар.',
}

test('hero stats are the three product facts; the 2GIS rating sits under the CTA', () => {
  // 745 reviews across the six branches listed in the reviews block, weighted average 4,9
  const branches = [...html.matchAll(/<li><a href="https:\/\/2gis\.kz[^"]*"[^>]*>[^<]*<b>(?:<span class="v2-chip-star" aria-hidden="true">)?★(?:<\/span>)? (\d),(\d)<\/b> <small>(\d+)<\/small>/g)]
  assert.equal(branches.length, 6, 'six branch ratings')
  const total = branches.reduce((n, m) => n + Number(m[3]), 0)
  const avg = branches.reduce((n, m) => n + Number(`${m[1]}.${m[2]}`) * Number(m[3]), 0) / total
  assert.equal(total, 745)
  assert.equal(avg.toFixed(1), '4.9')
  for (const path of PAGES) {
    const page = readFileSync(path, 'utf8')
    const stats = page.match(/<ul class="hero-stats">(.*?)<\/ul>/)
    assert.ok(stats, `${path}: hero stats present`)
    assert.equal([...stats[1].matchAll(/<li[^>]*>/g)].length, 3, `${path}: three hero stats`)
    assert.ok(!stats[1].includes('2gis'), `${path}: no rating in the stats row`)
    const cta = page.match(/<a class="btn btn-primary btn-lg" href="#signup">[^<]*<\/a>\n<a class="hero-proof" href="#reviews" aria-label="[^"]+">(.*?)<\/a>/)
    assert.ok(cta, `${path}: rating line directly follows the hero CTA and links to #reviews`)
    assert.ok(/<b>4[,.]9<\/b>/.test(cta[1]) && cta[1].includes('745'), `${path}: rating line says 4,9 and 745 reviews`)
  }
  assert.ok(!css.includes('hero-stat-2gis'), 'old stat styles removed')
  assert.ok(css.includes('.hero-proof{'), 'rating line is styled')
})

test('move HUD is replaced by a WhatsApp question button (desktop) and a sticky-bar icon (mobile)', () => {
  for (const path of PAGES) {
    const page = readFileSync(path, 'utf8')
    const href = `https://wa.me/77077872210?text=${encodeURIComponent(WA_Q[path])}`
    assert.ok(!page.includes('move-hud'), `${path}: move HUD gone`)
    const fab = page.match(/<a class="wa-fab" id="wa-fab" href="([^"]+)" target="_blank" rel="noopener" aria-label="[^"]+" data-wa="fab"><svg[^>]*aria-hidden="true"[\s\S]*?<\/svg><span class="wa-fab-label">[^<]+<\/span><\/a>/)
    assert.ok(fab, `${path}: labelled desktop WhatsApp button`)
    assert.equal(fab[1], href, `${path}: fab opens a question message`)
    const sticky = page.match(/<div class="v2-sticky" id="v2-sticky" aria-hidden="true">(.*?)<\/div>/)
    assert.ok(sticky[1].startsWith('<a class="btn btn-primary btn-block" href="#signup" tabindex="-1">'), `${path}: signup stays the main sticky action`)
    assert.ok(sticky[1].includes(`<a class="v2-sticky-wa" href="${href}" target="_blank" rel="noopener" tabindex="-1" aria-label="`), `${path}: WhatsApp icon in the sticky bar`)
  }
  assert.ok(/@media \(max-width:820px\)\{[\s\S]*?\.wa-fab\{display:none!important\}\n\}/.test(css), 'fab hidden where the sticky bar exists')
  assert.ok(css.includes('.wa-fab.is-compact .wa-fab-label{max-width:0;opacity:0}'), 'fab collapses to the icon')
  assert.ok(css.includes('.wa-fab.is-hidden{'), 'fab can hide over the signup form')
  assert.ok(js.includes('fab.classList.toggle("is-compact", heroOut)') && js.includes('fab.classList.toggle("is-hidden", signupIn)'), 'fab reacts to hero and signup visibility')
  assert.ok(js.includes('sticky.querySelectorAll("a").forEach'), 'both sticky links get tab focus toggled')
  // board3d-day.js tolerates the missing HUD element
  assert.ok(readFileSync('public/home/shared/board3d-day.js', 'utf8').includes('if (hud && label !== lastLabel)'), 'board script guards a null HUD')
})
