// Dependency-free tests for the daylight 3D board render loop (/ru, /en, /kz, /v2).
// The board is a fixed canvas behind the page; drawing it every frame made scrolling lag.
// Run: node tests/board3d-day.test.mjs
import { readFileSync } from 'fs'

let failures = 0
const ok = (cond, msg) => { if (cond) { console.log(`  ✓ ${msg}`) } else { failures++; console.error(`  ✗ ${msg}`) } }

const board = readFileSync('public/home/shared/board3d-day.js', 'utf8')
const frame = board.match(/const frame = \(now\) => \{[^]*?\n  \};/)?.[0] || ''

console.log('render on demand')
ok(frame, 'frame() is defined')
ok(!/^\s*raf = requestAnimationFrame\(frame\);/m.test(frame), 'frame() does not reschedule itself unconditionally')
ok(/if \(moving \|\| drifting\) raf = requestAnimationFrame\(frame\)/.test(frame), 'frame() only reschedules while the camera is moving or drifting')
ok(/addEventListener\('scroll'[^)]*\)/.test(board) && /function wake\(\)/.test(board), 'scroll wakes the loop')

console.log('pause when not visible')
ok(/document\.hidden \|\| !shown\) return/.test(frame), 'nothing is drawn while the tab is hidden or the canvas is covered')
ok(/visibilitychange/.test(board), 'loop resumes on visibilitychange')
ok(/elementsFromPoint/.test(board) && /backgroundColor/.test(board), 'coverage is detected from opaque sections over the viewport')

ok(!/shown = exposed\(\); step\(true\)/.test(board) && /step\(true\); onScroll\(\);/.test(board), 'first coverage check waits a frame, after .has-3d changes the layout')
ok(/addEventListener\('resize', onScroll\)/.test(board), 'coverage is re-checked on resize')

ok(/Math\.pow\(\.88, dt\)/.test(board), 'scroll easing is time-based, so slow devices settle in fewer frames')

console.log('cheaper frames')
ok(/shadowMap\.autoUpdate = false/.test(board), 'shadow map is not redrawn every frame')
ok(/shadowMap\.needsUpdate = true/.test(board), 'shadow map is redrawn when the pieces move')
ok(/setPixelRatio\(Math\.min\(devicePixelRatio, 2\)\)/.test(board), 'pixel ratio capped at 2 on every device, so phones are not upscaled from 1x')

console.log('sharp on phones')
ok(/WebGLRenderer\(\{[^}]*antialias: true/.test(board), 'antialiasing is on for phones too')
ok(!/small \? 1 :/.test(board), 'no 1x pixel ratio branch for small screens')
ok(/shadowMap\.type = THREE\.PCFSoftShadowMap;/.test(board), 'soft shadows on every device')

if (failures) { console.error(`\n${failures} failure(s)`); process.exit(1) }
console.log('\nall board3d-day checks passed')
