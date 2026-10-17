// Founder letter (#about), option A: click-to-play reel beside a shortened letter, "ЧН" monogram kept.
// Run: node --test tests/founder-letter.test.mjs
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, existsSync } from 'node:fs'

const css = readFileSync('public/main/v2.css', 'utf8')
const js = readFileSync('public/main/v2.js', 'utf8')

const PAGES = {
  'public/main/index.html': { mono: 'ЧН', play: 'Смотреть обращение основателя' },
  'public/main/en/index.html': { mono: 'CN', play: 'Watch the founder’s message' },
  'public/main/kk/index.html': { mono: 'ЧН', play: 'Негізін қалаушының үндеуін көру' },
}

for (const [file, L] of Object.entries(PAGES)) {
  const html = readFileSync(file, 'utf8')
  const about = html.match(/<section class="section" id="about">[\s\S]*?<\/section>/)[0]

  test(`${file}: reel comes first, then the letter body`, () => {
    assert.ok(about.indexOf('class="v2-reel"') < about.indexOf('class="v2-letter-body"'))
    assert.ok(about.indexOf('class="v2-letter-body"') < about.indexOf('<h2>'))
  })

  test(`${file}: reel is a lazy click-to-play video with an accessible button`, () => {
    const video = about.match(/<video\b[^>]*>/)[0]
    assert.match(video, /class="v2-reel-video"/)
    assert.match(video, /preload="none"/)
    assert.match(video, /\splaysinline\b/)
    const poster = video.match(/poster="([^"]+)"/)[1]
    const src = about.match(/<source src="([^"]+\.mp4)" type="video\/mp4">/)[1]
    assert.ok(existsSync('public' + poster), poster)
    assert.ok(existsSync('public' + src), src)
    assert.match(about, new RegExp(`<button type="button" class="v2-reel-play" aria-label="${L.play}"><svg`))
  })

  test(`${file}: letter is 3 paragraphs + pledge, signature keeps the monogram (no photo)`, () => {
    const prose = about.match(/<div class="prose">([\s\S]*?)<figure/)[1]
    assert.equal((prose.match(/<p>/g) || []).length, 3)
    assert.equal((prose.match(/<p class="v2-pledge">/g) || []).length, 1)
    const sign = about.match(/<figure class="v2-sign">[\s\S]*?<\/figure>/)[0]
    assert.ok(sign.includes(`<span class="v2-monogram" aria-hidden="true">${L.mono}</span>`))
    assert.doesNotMatch(sign, /<img|background-image/)
  })
}

test('CSS: two-column letter with the reel beside it, stacks on mobile', () => {
  assert.match(css, /\.v2-letter\{max-width:1100px;display:grid;grid-template-columns:340px minmax\(0,1fr\)/)
  assert.match(css, /\.v2-reel\{position:relative;aspect-ratio:9\/16/)
  assert.match(css, /@media \(max-width:820px\)\{\s*\.v2-letter\{grid-template-columns:minmax\(0,1fr\)/)
})

test('JS: reel wiring + page-wide one-video-at-a-time', () => {
  assert.match(js, /d\.addEventListener\("play", function \(e\) \{/)
  assert.match(js, /var reel = d\.querySelectorAll\("#about \.v2-reel-video"\)\[0\];/)
  assert.match(js, /reel\.addEventListener\("ended"/)
})
