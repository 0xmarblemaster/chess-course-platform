import sanitizeHtml from 'sanitize-html'

// The only markup an article body may contain; everything else is stripped (text kept,
// except inside script/style which sanitize-html drops entirely).
const OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: ['p', 'h2', 'h3', 'ul', 'ol', 'li', 'strong', 'em', 'a', 'blockquote', 'img'],
  allowedAttributes: { a: ['href'], img: ['src', 'alt'] },
  // a[href]: http, https or relative; img[src]: https only (relative srcs are dropped below)
  allowedSchemes: ['http', 'https'],
  allowedSchemesByTag: { img: ['https'] },
  allowProtocolRelative: false,
  transformTags: { b: 'strong', i: 'em', div: 'p' },
  exclusiveFilter: (frame) => frame.tag === 'img' && !/^https:\/\//i.test(frame.attribs.src || ''),
}

export function sanitizeArticleHtml(html: string): string {
  return sanitizeHtml(html, OPTIONS).trim()
}

/** Sanitizes whichever body_* fields an article write contains, in place. */
export function sanitizeBodies(data: Partial<Record<'body_ru' | 'body_en' | 'body_kk', string>>) {
  for (const k of ['body_ru', 'body_en', 'body_kk'] as const) {
    if (typeof data[k] === 'string') data[k] = sanitizeArticleHtml(data[k])
  }
  return data
}
