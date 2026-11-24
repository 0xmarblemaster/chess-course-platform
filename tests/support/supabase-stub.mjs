// Minimal Supabase stand-in for the articles tests: /rest/v1 is proxied to a local PostgREST,
// /auth/v1 issues and checks HS256 JWTs for the test users, /storage/v1 keeps files in a folder.
// Started by tests/support/articles-stack.sh; `node supabase-stub.mjs --env` prints the env vars.
import { createHmac, timingSafeEqual } from 'crypto'
import { createServer, request } from 'http'
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'fs'
import { dirname, join } from 'path'

const PORT = +(process.env.STUB_PORT || 54390)
const PGRST_PORT = +(process.env.PGRST_PORT || 54391)
const SECRET = process.env.STUB_JWT_SECRET || 'articles-test-secret-articles-test-secret'
const STORAGE_DIR = process.env.STUB_STORAGE_DIR || '/tmp/articles-stack/storage'
export const USERS = {
  'admin@articles.test': { id: '00000000-0000-4000-8000-00000000a001', password: 'admin-pass-123', role: 'admin' },
  'student@articles.test': { id: '00000000-0000-4000-8000-00000000a002', password: 'student-pass-123', role: 'student' },
}

const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url')
export function sign(payload) {
  const head = b64({ alg: 'HS256', typ: 'JWT' }) + '.' + b64(payload)
  return head + '.' + createHmac('sha256', SECRET).update(head).digest('base64url')
}
function verify(token) {
  const [h, p, s] = (token || '').split('.')
  if (!s) return null
  const want = createHmac('sha256', SECRET).update(`${h}.${p}`).digest()
  const got = Buffer.from(s, 'base64url')
  if (got.length !== want.length || !timingSafeEqual(got, want)) return null
  const claims = JSON.parse(Buffer.from(p, 'base64url').toString())
  return claims.exp && claims.exp < Date.now() / 1000 ? null : claims
}

const far = Math.floor(Date.now() / 1000) + 10 * 365 * 86400
const ANON_KEY = sign({ role: 'anon', iss: 'stub', exp: far })
const SERVICE_KEY = sign({ role: 'service_role', iss: 'stub', exp: far })

if (process.argv.includes('--env')) {
  console.log(`NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:${PORT}`)
  console.log(`NEXT_PUBLIC_SUPABASE_ANON_KEY=${ANON_KEY}`)
  console.log(`SUPABASE_SERVICE_ROLE_KEY=${SERVICE_KEY}`)
  console.log(`PGRST_JWT_SECRET=${SECRET}`)
  process.exit(0)
}

const userJson = (email, u) => ({ id: u.id, aud: 'authenticated', role: 'authenticated', email, app_metadata: {}, user_metadata: {}, created_at: '2026-01-01T00:00:00Z' })
function session(email, u) {
  const exp = Math.floor(Date.now() / 1000) + 3600
  return { access_token: sign({ sub: u.id, email, role: 'authenticated', aud: 'authenticated', exp }), token_type: 'bearer',
    expires_in: 3600, expires_at: exp, refresh_token: `refresh-${email}`, user: userJson(email, u) }
}
const send = (res, status, body, headers = {}) => {
  res.writeHead(status, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', ...headers })
  res.end(body === undefined ? '' : JSON.stringify(body))
}
const readBody = (req) => new Promise((ok) => { const c = []; req.on('data', (d) => c.push(d)); req.on('end', () => ok(Buffer.concat(c))) })
const bearer = (req) => (req.headers.authorization || '').replace(/^Bearer\s+/i, '')

createServer(async (req, res) => {
  const url = new URL(req.url, `http://127.0.0.1:${PORT}`)
  if (req.method === 'OPTIONS') {
    return send(res, 204, undefined, { 'Access-Control-Allow-Headers': '*', 'Access-Control-Allow-Methods': '*' })
  }
  if (url.pathname.startsWith('/rest/v1/')) {
    const up = request({ host: '127.0.0.1', port: PGRST_PORT, method: req.method, path: url.pathname.slice(8) + url.search,
      headers: { ...req.headers, host: `127.0.0.1:${PGRST_PORT}` } }, (r) => {
      res.writeHead(r.statusCode, { ...r.headers, 'access-control-allow-origin': '*' })
      r.pipe(res)
    })
    up.on('error', (e) => send(res, 502, { message: e.message }))
    return req.pipe(up)
  }
  if (url.pathname === '/auth/v1/token') {
    const body = JSON.parse((await readBody(req)).toString() || '{}')
    const email = url.searchParams.get('grant_type') === 'refresh_token' ? String(body.refresh_token).replace(/^refresh-/, '') : body.email
    const u = USERS[email]
    if (!u || (body.password !== undefined && body.password !== u.password)) return send(res, 400, { error: 'invalid_grant', error_description: 'Invalid login credentials' })
    return send(res, 200, session(email, u))
  }
  if (url.pathname === '/auth/v1/user') {
    const c = verify(bearer(req))
    const email = c && Object.keys(USERS).find((e) => USERS[e].id === c.sub)
    return email ? send(res, 200, userJson(email, USERS[email])) : send(res, 401, { code: 401, msg: 'invalid JWT' })
  }
  if (url.pathname === '/auth/v1/logout') return send(res, 204)
  const pub = url.pathname.match(/^\/storage\/v1\/object\/public\/(.+)$/)
  if (pub && req.method === 'GET') {
    const f = join(STORAGE_DIR, pub[1])
    if (!existsSync(f)) return send(res, 404, { message: 'not found' })
    res.writeHead(200, { 'Content-Type': readFileSync(f + '.type', 'utf8') })
    return res.end(readFileSync(f))
  }
  const obj = url.pathname.match(/^\/storage\/v1\/object\/(.+)$/)
  if (obj && (req.method === 'POST' || req.method === 'PUT')) {
    if (verify(bearer(req))?.role !== 'service_role') return send(res, 403, { message: 'service role required' })
    const f = join(STORAGE_DIR, obj[1])
    mkdirSync(dirname(f), { recursive: true })
    writeFileSync(f, await readBody(req))
    writeFileSync(f + '.type', req.headers['content-type'] || 'application/octet-stream')
    return send(res, 200, { Key: obj[1] })
  }
  send(res, 404, { message: `stub: no route for ${req.method} ${url.pathname}` })
}).listen(PORT, '127.0.0.1', () => console.log(`supabase stub on :${PORT}`))
