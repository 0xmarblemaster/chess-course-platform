// Browser-side helpers for the /admin/articles pages: API calls with the admin's Supabase access
// token, and a cleanup of contenteditable output down to the article HTML subset.
import { supabase } from '@/lib/supabaseClient'

export class ApiError extends Error {
  constructor(public status: number, message: string, public fields: Record<string, string> = {}) {
    super(message)
  }
}

export async function articlesApi<T>(path: string, init: RequestInit = {}): Promise<T> {
  const { data } = await supabase.auth.getSession()
  const headers = new Headers(init.headers)
  if (data.session) headers.set('Authorization', `Bearer ${data.session.access_token}`)
  if (typeof init.body === 'string') headers.set('Content-Type', 'application/json')
  const res = await fetch(`/api/articles${path}`, { ...init, headers, cache: 'no-store' })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) throw new ApiError(res.status, body.error || `Request failed (${res.status})`, body.fields)
  return body as T
}

const KEEP = new Set(['P', 'H2', 'H3', 'UL', 'OL', 'LI', 'STRONG', 'EM', 'A', 'BLOCKQUOTE', 'IMG'])
const RENAME: Record<string, string> = { B: 'strong', I: 'em', DIV: 'p' }
const BLOCK = new Set(['P', 'H2', 'H3', 'UL', 'OL', 'BLOCKQUOTE', 'IMG'])
const DROP = new Set(['SCRIPT', 'STYLE', 'IFRAME', 'OBJECT', 'TEMPLATE'])

/** Same allowlist as the server sanitizer (src/lib/articles/sanitize.ts), so the preview matches what gets saved. */
export function cleanEditorHtml(html: string): string {
  const src = new DOMParser().parseFromString(`<body>${html}</body>`, 'text/html').body
  const out = document.createElement('div')
  const walk = (from: Node, to: Node) => {
    from.childNodes.forEach((n) => {
      if (n.nodeType === Node.TEXT_NODE) return void to.appendChild(document.createTextNode(n.textContent || ''))
      if (!(n instanceof Element) || DROP.has(n.tagName)) return
      const tag = RENAME[n.tagName] || (KEEP.has(n.tagName) ? n.tagName.toLowerCase() : null)
      if (!tag) return walk(n, to) // unwrap, keep the text
      const el = document.createElement(tag)
      if (tag === 'a') {
        const href = n.getAttribute('href') || ''
        if (/^(https?:\/\/|\/(?!\/)|#)/i.test(href)) el.setAttribute('href', href)
      } else if (tag === 'img') {
        const src = n.getAttribute('src') || ''
        if (!/^https:\/\//i.test(src)) return
        el.setAttribute('src', src)
        el.setAttribute('alt', n.getAttribute('alt') || '')
      }
      walk(n, el)
      to.appendChild(el)
    })
  }
  walk(src, out)
  // Loose text/inline nodes at the top level (typed before any paragraph) go into a <p>.
  let p: HTMLElement | null = null
  Array.from(out.childNodes).forEach((n) => {
    if (n instanceof Element && BLOCK.has(n.tagName)) return void (p = null)
    if (!p) {
      if (!n.textContent?.trim()) return void n.remove()
      p = document.createElement('p')
      out.insertBefore(p, n)
    }
    p.appendChild(n)
  })
  return out.innerHTML.replace(/<p>(\s|<br>)*<\/p>/g, '')
}
