// Articles API (/api/articles…) and the DB-rendered /articles pages against a running app.
// Local stack (nothing touches the real DB):
//   bash tests/support/articles-stack.sh start && set -a && . /tmp/articles-stack/env && set +a
//   node tests/articles-api.test.mjs
// Env: ARTICLES_BASE (app URL, default http://127.0.0.1:3917), ARTICLES_SUPABASE_URL,
// ARTICLES_SUPABASE_SECRET_KEY, NEXT_PUBLIC_ARTICLES_SUPABASE_ANON_KEY (each falls back to
// NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY / NEXT_PUBLIC_SUPABASE_ANON_KEY, like the app);
// optional ARTICLES_ADMIN_EMAIL/PASSWORD and ARTICLES_USER_EMAIL/PASSWORD (default to the stub's test
// users when the Supabase URL is local); ARTICLES_STACK_PG (the local stack's Postgres) for the
// user_roles → users fallback check.
// Every row it creates uses the slug/name prefix "test-" and is deleted at the end.
import { execFileSync } from 'child_process'
import { createClient } from '@supabase/supabase-js'

let failures = 0
const ok = (cond, msg) => { if (cond) { console.log(`  ✓ ${msg}`) } else { failures++; console.error(`  ✗ ${msg}`) } }

const BASE = process.env.ARTICLES_BASE || 'http://127.0.0.1:3917'
const SB_URL = process.env.ARTICLES_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE = process.env.ARTICLES_SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
const ANON = process.env.NEXT_PUBLIC_ARTICLES_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
if (!SB_URL || !SERVICE) { console.error('Set ARTICLES_SUPABASE_URL and ARTICLES_SUPABASE_SECRET_KEY (or the NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY fallbacks)'); process.exit(1) }
const local = /127\.0\.0\.1|localhost/.test(SB_URL)
const ADMIN = [process.env.ARTICLES_ADMIN_EMAIL || (local && 'admin@articles.test'), process.env.ARTICLES_ADMIN_PASSWORD || (local && 'admin-pass-123')]
const USER = [process.env.ARTICLES_USER_EMAIL || (local && 'student@articles.test'), process.env.ARTICLES_USER_PASSWORD || (local && 'student-pass-123')]
// The stub's user with users.role = 'admin' but no user_roles row.
const LEGACY_ADMIN = [local && 'legacy-admin@articles.test', local && 'legacy-pass-123']
// user_roles 'coach' with can_manage_articles, and user_roles 'admin' without it.
const COACH = [local && 'coach@articles.test', local && 'coach-pass-123']
const NOFLAG_ADMIN = [local && 'noflag-admin@articles.test', local && 'noflag-pass-123']
const STACK_PG = process.env.ARTICLES_STACK_PG

const db = createClient(SB_URL, SERVICE, { auth: { persistSession: false } })
const RUN = Date.now().toString(36)
const SLUG = `test-api-${RUN}`
const KEY_NAME = `test-key-${RUN}`

async function call(method, path, { token, json, form } = {}) {
  const headers = {}
  if (token) headers.Authorization = `Bearer ${token}`
  if (json !== undefined) headers['Content-Type'] = 'application/json'
  const res = await fetch(BASE + path, { method, headers, body: json !== undefined ? JSON.stringify(json) : form })
  const text = await res.text()
  let body
  try { body = JSON.parse(text) } catch { body = text }
  return { status: res.status, body }
}

async function signIn([email, password]) {
  if (!email || !password) return null
  const c = createClient(SB_URL, ANON || SERVICE, { auth: { persistSession: false } })
  const { data, error } = await c.auth.signInWithPassword({ email, password })
  return error ? null : data.session.access_token
}

// The page is rebuilt after revalidateTag; allow a moment for that in dev.
async function pageHas(path, needle, want) {
  for (let i = 0; i < 10; i++) {
    const html = await (await fetch(BASE + path)).text()
    if (html.includes(needle) === want) return true
    await new Promise((r) => setTimeout(r, 500))
  }
  return false
}

async function pageStatus(path, want) {
  for (let i = 0; i < 10; i++) {
    if ((await fetch(BASE + path)).status === want) return true
    await new Promise((r) => setTimeout(r, 500))
  }
  return false
}

const png = () => new Blob([Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.alloc(64)])], { type: 'image/png' })
const fileForm = (blob, name) => { const f = new FormData(); f.append('file', blob, name); return f }

async function main() {
  console.log('API key minted by scripts/create-article-api-key.mjs')
  const key = execFileSync('node', ['scripts/create-article-api-key.mjs', KEY_NAME], { env: process.env, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim()
  ok(/^cea_[A-Za-z0-9_-]{43}$/.test(key), 'key format is cea_ + 32 random bytes base64url')
  const { data: stored } = await db.from('article_api_keys').select('key_prefix, key_hash').eq('name', KEY_NAME).single()
  ok(stored.key_prefix === key.slice(0, 8) && stored.key_hash.length === 64 && !JSON.stringify(stored).includes(key), 'only the prefix and sha256 are stored')

  console.log('auth')
  const draft = { slug: SLUG, topic: 'parents', title_ru: 'Тестовая статья', title_en: 'Test article', title_kk: 'Сынақ мақала',
    teaser_ru: 'Тизер', teaser_en: 'Teaser', teaser_kk: 'Тизер', author: 'Тест Тестов, тренер', author_en: 'Test Testov, coach',
    body_ru: '<p>Первый абзац.</p><script>alert(1)</script><img src="x" onerror="alert(1)"><p onclick="x()">Второй <a href="javascript:alert(1)">абзац</a>.</p>',
    body_en: '<p>Body <strong>bold</strong> <a href="https://example.com">link</a></p><img src="https://example.com/a.png" onerror="alert(1)">',
    body_kk: '<p>Мәтін</p>' }
  ok((await call('POST', '/api/articles', { json: draft })).status === 401, 'POST without a key → 401')
  ok((await call('POST', '/api/articles', { json: draft, token: 'cea_wrong' + key.slice(9) })).status === 401, 'POST with a wrong key → 401')
  ok((await call('POST', '/api/articles', { json: draft, token: 'not-a-jwt' })).status === 401, 'POST with a garbage token → 401')
  ok((await call('GET', '/api/articles?all=1')).status === 401, 'GET ?all=1 without a key → 401')
  ok((await call('PATCH', '/api/articles/age-to-start', { json: { featured: true } })).status === 401, 'PATCH without a key → 401')
  ok((await call('DELETE', '/api/articles/age-to-start')).status === 401, 'DELETE without a key → 401')
  ok((await call('POST', '/api/articles/upload', { form: fileForm(png(), 'a.png') })).status === 401, 'upload without a key → 401')
  ok((await call('GET', '/api/articles/keys', { token: key })).status === 403, 'API key cannot manage keys → 403')

  const userToken = await signIn(USER)
  const adminToken = await signIn(ADMIN)
  if (userToken) {
    ok((await call('POST', '/api/articles', { json: draft, token: userToken })).status === 403, 'non-admin session → 403')
    ok((await call('GET', '/api/articles/keys', { token: userToken })).status === 403, 'non-admin session cannot list keys → 403')
  } else console.log('  - skipped: no non-admin test user')

  console.log('GET /api/articles/me and can_manage_articles')
  ok((await call('GET', '/api/articles/me')).status === 401, '/me without a token → 401')
  ok((await call('GET', '/api/articles/me', { token: 'not-a-jwt' })).status === 401, '/me with a garbage token → 401')
  ok((await call('GET', '/api/articles/me', { token: key })).status === 403, '/me with an API key → 403')
  if (userToken) ok((await call('GET', '/api/articles/me', { token: userToken })).status === 403, '/me as a non-admin → 403')
  if (adminToken) {
    const me = await call('GET', '/api/articles/me', { token: adminToken })
    ok(me.status === 200 && me.body.admin === true && me.body.email === ADMIN[0], '/me as an admin → 200 { admin: true, email }')
    ok(me.body.canManage === true && me.body.canManageKeys === true, '/me as an admin → canManage and canManageKeys')
  }
  const noflagToken = await signIn(NOFLAG_ADMIN)
  if (noflagToken) {
    const me = await call('GET', '/api/articles/me', { token: noflagToken })
    ok(me.status === 403 && me.body.error === 'Article management permission required', "user_roles admin without can_manage_articles: /me → 403 'Article management permission required'")
    ok((await call('POST', '/api/articles', { json: draft, token: noflagToken })).status === 403, 'and cannot create')
    ok((await call('GET', '/api/articles?all=1', { token: noflagToken })).status === 403, 'nor list drafts')
    ok((await call('GET', '/api/articles/keys', { token: noflagToken })).status === 403, 'nor list keys')
  } else console.log('  - skipped: no admin-without-flag test user')
  const coachToken = await signIn(COACH)
  if (coachToken) {
    const me = await call('GET', '/api/articles/me', { token: coachToken })
    ok(me.status === 200 && me.body.canManage === true && me.body.canManageKeys === false && me.body.email === COACH[0], '/me as a coach with the flag → 200 { canManage: true, canManageKeys: false }')
    const slug = `${SLUG}-coach`
    const made = await call('POST', '/api/articles', { token: coachToken, json: { ...draft, slug } })
    ok(made.status === 201, 'coach with the flag creates an article')
    const edited = await call('PATCH', `/api/articles/${slug}`, { token: coachToken, json: { title_en: 'Coach edit', status: 'published' } })
    ok(edited.status === 200 && edited.body.article.title_en === 'Coach edit', 'and edits it')
    ok((await call('GET', '/api/articles?all=1', { token: coachToken })).body.articles?.some((x) => x.slug === slug), 'and lists drafts')
    ok((await call('POST', '/api/articles/upload', { token: coachToken, form: fileForm(new Blob(['GIF89a'], { type: 'image/gif' }), 'a.gif') })).status === 415, 'and may upload (past auth)')
    ok((await call('DELETE', `/api/articles/${slug}`, { token: coachToken })).status === 200, 'and deletes it')
    ok((await call('GET', '/api/articles/keys', { token: coachToken })).status === 403, 'coach cannot list keys → 403')
    ok((await call('POST', '/api/articles/keys', { token: coachToken, json: { name: `${KEY_NAME}-coach` } })).status === 403, 'coach cannot create keys → 403')
    ok((await call('DELETE', '/api/articles/keys/00000000-0000-4000-8000-000000000000', { token: coachToken })).status === 403, 'coach cannot revoke keys → 403')
  } else console.log('  - skipped: no coach test user')
  const legacyToken = await signIn(LEGACY_ADMIN)
  if (legacyToken) {
    ok((await call('GET', '/api/articles/me', { token: legacyToken })).status === 403, 'users.role = admin without a user_roles row → 403 (user_roles decides)')
    ok((await call('POST', '/api/articles', { json: draft, token: legacyToken })).status === 403, 'and cannot write')
  }
  if (STACK_PG && legacyToken) {
    // Without a user_roles table (the old schema) the check falls back to users.role.
    await setUserRoles(false)
    ok(await meStatus(legacyToken, 200), 'no user_roles table: users.role = admin → 200')
    if (userToken) ok((await call('GET', '/api/articles/me', { token: userToken })).status === 403, 'no user_roles table: users.role = student → 403')
    if (coachToken) {
      const me = await call('GET', '/api/articles/me', { token: coachToken })
      ok(me.status === 200 && me.body.canManageKeys === false, 'no user_roles table: users.can_manage_articles → 200, no keys')
      ok((await call('GET', '/api/articles/keys', { token: coachToken })).status === 403, 'no user_roles table: and keys → 403')
    }
    if (noflagToken) ok((await call('GET', '/api/articles/me', { token: noflagToken })).status === 403, 'no user_roles table: neither admin nor flag → 403')
    await setUserRoles(true)
    ok(await meStatus(legacyToken, 403), 'user_roles back: users.role alone → 403 again')
    if (adminToken) ok((await call('GET', '/api/articles/me', { token: adminToken })).status === 200, 'user_roles admin → 200')
  } else console.log('  - skipped: user_roles fallback (needs ARTICLES_STACK_PG and the stub users)')

  console.log('validation')
  ok((await call('POST', '/api/articles', { token: key, json: { ...draft, slug: 'Bad Slug' } })).body.fields?.slug, 'bad slug → 400 with a field error')
  ok((await call('POST', '/api/articles', { token: key, json: { ...draft, slug: 'upload' } })).status === 400, 'reserved slug → 400')
  ok((await call('POST', '/api/articles', { token: key, json: { ...draft, topic: 'chess' } })).body.fields?.topic, 'unknown topic → 400')
  ok((await call('POST', '/api/articles', { token: key, json: { ...draft, status: 'live' } })).body.fields?.status, 'unknown status → 400')
  ok((await call('POST', '/api/articles', { token: key, json: { ...draft, title_ru: 'x'.repeat(201) } })).body.fields?.title_ru, 'title over 200 chars → 400')
  ok((await call('POST', '/api/articles', { token: key, json: { ...draft, hacker: 1 } })).body.fields?.hacker, 'unknown field → 400')
  ok((await call('POST', '/api/articles', { token: key, json: { ...draft, cover_url: 'javascript:alert(1)' } })).body.fields?.cover_url, 'non-https cover → 400')
  ok((await call('GET', '/api/articles?lang=de')).status === 400, 'unknown lang → 400')

  console.log('create → publish → edit → upload → delete')
  const created = await call('POST', '/api/articles', { token: key, json: draft })
  ok(created.status === 201 && created.body.article.status === 'draft', 'create → 201, draft by default')
  const a = created.body.article
  ok(a.read_minutes >= 1, 'read minutes estimated when not given')
  ok(!/script|onerror|onclick|javascript:|<img/i.test(a.body_ru) && a.body_ru.includes('<p>Первый абзац.</p>'), 'sanitizer strips <script>, onerror=, onclick=, javascript: and non-https <img>')
  ok(a.body_en.includes('<strong>bold</strong>') && a.body_en.includes('href="https://example.com"') && /<img src="https:\/\/example.com\/a.png" ?\/?>/.test(a.body_en) && !a.body_en.includes('onerror'), 'sanitizer keeps allowed markup (strong, https link, https img)')
  ok((await call('POST', '/api/articles', { token: key, json: draft })).status === 409, 'duplicate slug → 409')

  ok((await call('GET', `/api/articles/${SLUG}`)).status === 404, 'draft is hidden from GET /api/articles/[slug]')
  ok(!(await call('GET', '/api/articles?lang=ru')).body.articles.some((x) => x.slug === SLUG), 'draft is hidden from the public list')
  ok((await call('GET', `/api/articles/${SLUG}`, { token: key })).status === 200, 'draft is visible with a key')
  ok((await call('GET', '/api/articles?all=1', { token: key })).body.articles.some((x) => x.slug === SLUG), '?all=1 with a key includes drafts')
  ok(await pageHas('/articles', `href="/articles/${SLUG}"`, false), 'draft is not on /articles')
  ok(await pageStatus(`/articles/${SLUG}`, 404), 'draft article page → 404')

  const pub = await call('PATCH', `/api/articles/${SLUG}`, { token: key, json: { status: 'published' } })
  ok(pub.status === 200 && pub.body.article.status === 'published' && pub.body.article.published_at, 'publish → published_at set')
  const one = await call('GET', `/api/articles/${SLUG}?lang=en`)
  ok(one.status === 200 && one.body.article.title === 'Test article' && one.body.article.author === 'Test Testov, coach', 'GET [slug]?lang=en is localized')
  const list = await call('GET', '/api/articles?lang=ru&topic=parents&limit=50')
  ok(list.body.articles.some((x) => x.slug === SLUG && x.title === 'Тестовая статья'), 'published article in the public list')
  ok(list.body.articles.every((x) => x.topic === 'parents'), 'topic filter')
  ok((await call('GET', '/api/articles?lang=ru&limit=4')).body.articles.length === 4, 'limit')
  ok(await pageHas('/articles', `<a class="pa-card" href="/articles/${SLUG}">`, true), 'published article has a card on /articles')
  ok(await pageHas('/en/articles', `href="/en/articles/${SLUG}"`, true), 'and on /en/articles')
  ok(await pageHas(`/articles/${SLUG}`, '<h1>Тестовая статья</h1>', true), `its own page /articles/${SLUG}`)
  ok(await pageHas(`/kz/articles/${SLUG}`, '<p>Мәтін</p>', true), `and /kz/articles/${SLUG}`)

  const patched = await call('PATCH', `/api/articles/${SLUG}`, { token: key, json: { title_ru: 'Изменённый заголовок', featured: false, body_kk: '<p>Жаңа</p><script>x</script>' } })
  ok(patched.status === 200 && patched.body.article.title_ru === 'Изменённый заголовок' && patched.body.article.title_en === 'Test article', 'PATCH changes only the given fields')
  ok(patched.body.article.body_kk === '<p>Жаңа</p>', 'PATCH sanitizes too')
  ok(patched.body.article.updated_at > a.updated_at, 'updated_at bumped by the trigger')
  ok(await pageHas('/articles', 'Изменённый заголовок', true), 'edit shows up on /articles')
  ok(await pageHas(`/articles/${SLUG}`, '<h1>Изменённый заголовок</h1>', true), 'and on the article page')
  ok((await call('PATCH', `/api/articles/${SLUG}`, { token: key, json: { slug: 'age-to-start' } })).status === 409, 'PATCH to a taken slug → 409')
  ok((await call('PATCH', `/api/articles/${SLUG}`, { token: key, json: {} })).status === 400, 'empty PATCH → 400')
  ok((await call('PATCH', '/api/articles/test-does-not-exist', { token: key, json: { featured: true } })).status === 404, 'PATCH unknown slug → 404')

  const up = await call('POST', '/api/articles/upload', { token: key, form: fileForm(png(), 'cover.png') })
  ok(up.status === 201 && /\/article-covers\/.+\.png$/.test(up.body.url), 'upload png → 201 + public URL')
  if (up.status === 201) {
    ok((await fetch(up.body.url)).ok, 'uploaded cover is publicly readable')
    const withCover = await call('PATCH', `/api/articles/${SLUG}`, { token: key, json: { cover_url: up.body.url } })
    ok(withCover.body.article?.cover_url === up.body.url, 'cover_url saved')
    ok(await pageHas('/articles', `src="${up.body.url}"`, true), 'cover rendered on /articles')
    ok(await pageHas(`/articles/${SLUG}`, `<meta property="og:image" content="${up.body.url}">`, true), 'cover is the og:image of the article page')
    await db.storage.from('article-covers').remove([up.body.path])
  }
  ok((await call('POST', '/api/articles/upload', { token: key, form: fileForm(new Blob(['GIF89a'], { type: 'image/gif' }), 'a.gif') })).status === 415, 'gif → 415')
  ok((await call('POST', '/api/articles/upload', { token: key, form: fileForm(new Blob(['<svg/>'], { type: 'image/png' }), 'fake.png') })).status === 415, 'non-image renamed to .png → 415')
  ok((await call('POST', '/api/articles/upload', { token: key, form: fileForm(new Blob([Buffer.alloc(5 * 1024 * 1024 + 1)], { type: 'image/png' }), 'big.png') })).status === 413, 'over 5 MB → 413')

  const del = await call('DELETE', `/api/articles/${SLUG}`, { token: key })
  ok(del.status === 200, 'DELETE → 200')
  ok((await call('GET', `/api/articles/${SLUG}`)).status === 404, 'deleted article → 404')
  ok((await call('DELETE', `/api/articles/${SLUG}`, { token: key })).status === 404, 'second DELETE → 404')
  ok(await pageHas('/articles', `href="/articles/${SLUG}"`, false), 'deleted article gone from /articles')
  ok(await pageStatus(`/articles/${SLUG}`, 404), 'deleted article page → 404')

  console.log('keys')
  const { data: used } = await db.from('article_api_keys').select('id, last_used_at').eq('name', KEY_NAME).single()
  ok(!!used.last_used_at, 'last_used_at updated')
  if (adminToken) {
    const listed = await call('GET', '/api/articles/keys', { token: adminToken })
    ok(listed.status === 200 && listed.body.keys.some((k) => k.id === used.id) && !JSON.stringify(listed.body).includes('key_hash'), 'admin lists keys without hashes')
    const made = await call('POST', '/api/articles/keys', { token: adminToken, json: { name: `${KEY_NAME}-ui` } })
    ok(made.status === 201 && /^cea_/.test(made.body.key), 'admin creates a key; plain key returned once')
    ok((await call('GET', '/api/articles?all=1', { token: made.body.key })).status === 200, 'the new key works')
    ok((await call('POST', '/api/articles/keys', { token: adminToken, json: { name: '' } })).status === 400, 'empty key name → 400')
    ok((await call('DELETE', `/api/articles/keys/${used.id}`, { token: adminToken })).status === 200, 'admin revokes the script key')
    await call('DELETE', `/api/articles/keys/${made.body.apiKey.id}`, { token: adminToken })
    ok((await call('DELETE', '/api/articles/keys/00000000-0000-4000-8000-000000000000', { token: adminToken })).status === 404, 'revoking an unknown key → 404')
    ok((await call('GET', '/api/articles?all=1', { token: made.body.key })).status === 401, 'revoked admin-made key → 401')
  } else {
    console.log('  - no admin test user: revoking through the service role')
    await db.from('article_api_keys').update({ revoked_at: new Date().toISOString() }).eq('id', used.id)
  }
  ok((await call('POST', '/api/articles', { token: key, json: draft })).status === 401, 'revoked key → 401')
}

// Hides/restores public.user_roles in the local stack's Postgres and reloads PostgREST's schema cache.
async function setUserRoles(on) {
  const [from, to] = on ? ['user_roles_off', 'user_roles'] : ['user_roles', 'user_roles_off']
  execFileSync('psql', ['-q', STACK_PG, '-c', `set client_min_messages = warning; alter table if exists public.${from} rename to ${to}; notify pgrst, 'reload schema'`])
}

async function meStatus(token, want) {
  for (let i = 0; i < 20; i++) {
    if ((await call('GET', '/api/articles/me', { token })).status === want) return true
    await new Promise((r) => setTimeout(r, 250))
  }
  return false
}

async function cleanup() {
  if (STACK_PG) await setUserRoles(true)
  await db.from('articles').delete().like('slug', 'test-%')
  await db.from('article_api_keys').delete().like('name', 'test-key-%')
  const { count } = await db.from('articles').select('id', { count: 'exact', head: true }).like('slug', 'test-%')
  ok(count === 0, 'cleanup: no test- articles left')
}

try {
  await main()
} catch (e) {
  failures++
  console.error('  ✗ crashed:', e)
} finally {
  await cleanup()
}
if (failures) { console.error(`\n${failures} failure(s)`); process.exit(1) }
console.log('\nall passed')
