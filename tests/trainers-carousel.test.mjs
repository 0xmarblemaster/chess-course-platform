// Trainers section: 5-card slider with click-to-play coach videos (.ralph-trainers-video-spec.md).
// Run: node --test tests/trainers-carousel.test.mjs
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, existsSync } from 'node:fs'

const css = readFileSync('public/main/v2.css', 'utf8')
const js = readFileSync('public/main/v2.js', 'utf8')
const asset = (src) => existsSync('public' + src)

const PAGES = {
  'public/main/index.html': {
    names: ['Асылхан Агбаевич', 'Чингис Нургалимов', 'Наиль Ильдусович', 'Василий Михайлович', 'Александр Олегович'],
    tags: ['Дебют', 'Основатель', 'Дебют'], play: 'Смотреть видео: ', back: 'Назад', next: 'Далее',
  },
  'public/main/en/index.html': {
    names: ['Assylkhan Agbaevich', 'Chingis Nurgalimov', 'Nail Ildusovich', 'Vasily Mikhaylovich', 'Aleksandr Olegovich'],
    tags: ['Debut', 'Founder', 'Debut'], play: 'Watch video: ', back: 'Back', next: 'Next',
  },
  'public/main/kk/index.html': {
    names: ['Асылхан Агбаевич', 'Чингис Нургалимов', 'Наиль Ильдусович', 'Василий Михайлович', 'Александр Олегович'],
    tags: ['Дебют', 'Негізін қалаушы', 'Дебют'], play: 'Бейнені көру: ', back: 'Артқа', next: 'Келесі',
  },
}

for (const [file, L] of Object.entries(PAGES)) {
  const html = readFileSync(file, 'utf8')
  const section = html.match(/<section class="section" id="trainers">[\s\S]*?<\/section>/)[0]
  const cards = [...section.matchAll(/<li class="trainer">([\s\S]*?)<\/li>/g)].map((m) => m[1])

  test(`${file}: 5 trainer cards in order`, () => {
    assert.equal(cards.length, 5)
    assert.deepEqual(cards.map((c) => c.match(/<h3>(.*?)<\/h3>/)[1]), L.names)
    assert.deepEqual(cards.slice(0, 3).map((c) => c.match(/<span class="tag">(.*?)<\/span>/)[1]), L.tags)
    assert.match(section, /<ul class="trainers">/)
  })

  test(`${file}: Chingis card reuses the founder-block sentence`, () => {
    const sign = html.match(/<figure class="v2-sign">[\s\S]*?<figcaption><b>[^<]*<\/b><span>([^<]*)<\/span>/)[1]
    assert.equal(cards[1].match(/<p>(.*?)<\/p>/)[1], sign)
  })

  test(`${file}: cards 1–3 and 5 are click-to-play videos`, () => {
    for (const i of [0, 1, 2, 4]) {
      const c = cards[i]
      const video = c.match(/<video\b[^>]*>/)?.[0]
      assert.ok(video, `card ${i + 1} has a video`)
      assert.match(video, /class="avatar trainer-video"/)
      assert.match(video, /preload="none"/)
      assert.match(video, /\splaysinline\b/)
      assert.match(video, /webkit-playsinline/)
      assert.doesNotMatch(video, /autoplay|controls|muted/)
      const poster = video.match(/poster="([^"]+\.jpg)"/)[1]
      const mp4 = c.match(/<source src="([^"]+\.mp4)" type="video\/mp4">/)[1]
      assert.ok(asset(poster), `${poster} exists`)
      assert.ok(asset(mp4), `${mp4} exists`)
      assert.match(c, new RegExp(`<button type="button" class="trainer-play" aria-label="${L.play}${L.names[i]}"><svg`))
    }
  })

  test(`${file}: card 4 is a lazy photo card`, () => {
    for (const c of [cards[3]]) {
      assert.doesNotMatch(c, /<video/)
      const img = c.match(/<img class="avatar" src="([^"]+)"[^>]*>/)
      assert.ok(img && asset(img[1]), 'photo exists')
      assert.match(img[0], /loading="lazy"/)
    }
  })

  test(`${file}: slider region, Back/Next and live counter`, () => {
    assert.match(section, /class="tr-slider" role="region" aria-roledescription="carousel" aria-label="[^"]+" tabindex="0"/)
    assert.match(section, new RegExp(`<button type="button" class="tr-btn" data-tr="prev" disabled>.*?${L.back}</button>`))
    assert.match(section, new RegExp(`<button type="button" class="tr-btn" data-tr="next">${L.next} `))
    assert.match(section, /<span class="tr-count" aria-live="polite">/)
  })
}

test('v2.css: 4:5 media, snap scroller, 3 up on desktop, peek on mobile', () => {
  assert.match(css, /#trainers \.avatar\{[^}]*aspect-ratio:4\/5;object-fit:cover/)
  assert.match(css, /#trainers \.trainers\{[^}]*grid-auto-columns:calc\(\(100% - 2\*var\(--grid-gap\)\)\/3\)[^}]*scroll-snap-type:x mandatory[^}]*scroll-behavior:smooth[^}]*scrollbar-width:none/)
  assert.match(css, /@media \(max-width:820px\)\{#trainers \.trainers\{grid-auto-columns:85%\}/)
  assert.match(css, /prefers-reduced-motion:reduce\)\{#trainers \.trainers\{scroll-behavior:auto\}/)
  assert.match(css, /\.tr-btn:disabled\{opacity:\.35;cursor:default\}/)
  assert.doesNotMatch(css, /#trainers \.trainers\{grid-template-columns:repeat/)
})

test('v2.js: guarded block with nav, pause-others, ended reset and IntersectionObserver', () => {
  assert.match(js, /var slider = d\.querySelectorAll\("#trainers \.tr-slider"\)\[0\];\s*if \(slider\) \{/)
  assert.match(js, /function pauseOthers\(keep\) \{ videos\.forEach\(function \(v\) \{ if \(v !== keep && !v\.paused\) v\.pause\(\); \}\); \}/)
  assert.match(js, /v\.addEventListener\("play", function \(\) \{ pauseOthers\(v\); \}\)/)
  assert.match(js, /v\.addEventListener\("ended", function \(\) \{ v\.controls = false; v\.load\(\); play\.hidden = false; \}\)/)
  assert.match(js, /new IntersectionObserver\([\s\S]*?e\.target\.pause\(\)[\s\S]*?threshold: 0\.5/)
  assert.match(js, /pauseOthers\(v\); v\.controls = true; play\.hidden = true;/)
  assert.match(js, /ArrowLeft[\s\S]*ArrowRight/)
  assert.match(js, /x >= max - 2/)
})
