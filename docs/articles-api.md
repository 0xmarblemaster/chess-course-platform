# Articles API

Articles for parents (`/articles`, `/en/articles`, `/kz/articles` and one page per article at
`/articles/<slug>`, `/en/articles/<slug>`, `/kz/articles/<slug>`) live in the table `articles` of
the Chess Empire DB Supabase project (env `ARTICLES_SUPABASE_URL` + `ARTICLES_SUPABASE_SECRET_KEY` on
the server, `NEXT_PUBLIC_ARTICLES_SUPABASE_URL` + `NEXT_PUBLIC_ARTICLES_SUPABASE_ANON_KEY` in the
browser; each falls back to the main project's `NEXT_PUBLIC_SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY`
/ `NEXT_PUBLIC_SUPABASE_ANON_KEY`). The admin editor at `/admin/articles` and any script/integration use the same API.
Every write refreshes the public pages (`revalidateTag('articles')`); otherwise they refresh at most
every 60 s.

Base URL: the site domain, e.g. `https://www.chessempire.kz`. All bodies are JSON unless noted.

## Auth

Writes, drafts and uploads need `Authorization: Bearer <token>` where the token is either

- an **article API key** (`cea_…`), or
- the **Supabase access token** (articles project) of a user with a `user_roles` row `role = 'admin'`
  (used by the editor; where `user_roles` doesn't exist, `users.role = 'admin'`).

Missing or invalid token → `401`. Valid token without the admin role → `403`.
Key management (`/api/articles/keys…`) and `GET /api/articles/me` (→ `{ admin: true, email }`)
accept the admin session only, not API keys.

### Getting a key

- In the admin: `/admin/articles/keys` → *Create key*. The plain key is shown **once**.
- First key, from a shell with the service role env:
  ```bash
  ARTICLES_SUPABASE_URL=… ARTICLES_SUPABASE_SECRET_KEY=… node scripts/create-article-api-key.mjs "Content bot"
  ```

Only the sha256 of a key and its first 8 characters are stored. Revoked keys stop working immediately.

## Fields

| field | type | notes |
|---|---|---|
| `slug` | string | required on create; 3–80 chars, `a-z0-9` and single hyphens; `upload`/`keys` reserved. The public URL is `/articles/<slug>` |
| `topic` | `parents` \| `beginners` \| `tournaments` | required on create |
| `status` | `draft` \| `published` | default `draft`; first publish sets `published_at` |
| `title_ru`, `title_en`, `title_kk` | string ≤ 200 | `title_ru` required |
| `teaser_ru`, `teaser_en`, `teaser_kk` | string ≤ 400 | card text and meta description |
| `body_ru`, `body_en`, `body_kk` | HTML ≤ 100 000 | sanitized server-side (see below) |
| `author`, `author_en`, `author_kk` | string ≤ 120 or null | byline "Name, role"; EN/KZ fall back to `author` |
| `read_minutes` | int 1–120 or null | estimated from the body when omitted on create |
| `cover_url` | string or null | an uploaded cover, any `https://` URL or a site path (`/home/assets/…`) |
| `featured` | bool | the featured card at the top of the index |
| `sort_order` | int | lower first (after the featured article) |

Read-only: `id`, `published_at`, `created_at`, `updated_at`.

An article appears in a language only once it has a title and body in that language; untranslated
languages answer 404 at `/<lang>/articles/<slug>`.

**Body HTML allowlist:** `p, h2, h3, ul, ol, li, strong, em, blockquote`, `a[href]` (http, https or
relative) and `img[src]` (https only). Everything else is removed (`<script>`, event handlers,
`javascript:` links, styles…); `b`/`i`/`div` become `strong`/`em`/`p`.

## Endpoints

| method | path | auth | description |
|---|---|---|---|
| GET | `/api/articles?lang=ru\|en\|kk&topic=&limit=1–50` | public | published articles; with `lang` localized (`title`, `teaser`, `body`, `author`) |
| GET | `/api/articles?all=1` | key / admin | every article incl. drafts, all languages |
| GET | `/api/articles/<slug>?lang=` | public if published, else key / admin | one article |
| POST | `/api/articles` | key / admin | create → `201 { article }`; `409` if the slug exists |
| PATCH | `/api/articles/<slug>` | key / admin | partial update → `{ article }` |
| DELETE | `/api/articles/<slug>` | key / admin | delete → `{ deleted }` |
| POST | `/api/articles/upload` | key / admin | multipart field `file`: JPEG/PNG/WebP ≤ 5 MB → `201 { url, path }` |
| GET | `/api/articles/keys` | admin session | list keys (no hashes) |
| POST | `/api/articles/keys` | admin session | `{ name }` → `201 { key, apiKey }` (plain key only here) |
| DELETE | `/api/articles/keys/<id>` | admin session | revoke |

Validation errors: `400 { "error": "Validation failed", "fields": { "<field>": "<message>" } }`.
Upload errors: `413` (too big), `415` (not a JPEG/PNG/WebP — the file content is checked too).

## Examples

```bash
export KEY=cea_…   # article API key
export SITE=https://www.chessempire.kz

# create a draft
curl -X POST "$SITE/api/articles" -H "Authorization: Bearer $KEY" -H "Content-Type: application/json" -d '{
  "slug": "chess-and-math", "topic": "parents",
  "title_ru": "Шахматы и математика", "teaser_ru": "Как игра помогает считать.",
  "body_ru": "<p>Первый абзац.</p><h2>Подзаголовок</h2><p>Текст.</p>",
  "author": "Чингис Нургалимов, основатель"
}'

# add the English version and publish → https://…/articles/chess-and-math is live
curl -X PATCH "$SITE/api/articles/chess-and-math" -H "Authorization: Bearer $KEY" -H "Content-Type: application/json" \
  -d '{"title_en": "Chess and maths", "teaser_en": "How the game helps with numbers.", "body_en": "<p>First paragraph.</p>", "status": "published"}'

# upload a cover and attach it
URL=$(curl -s -X POST "$SITE/api/articles/upload" -H "Authorization: Bearer $KEY" -F "file=@cover.jpg;type=image/jpeg" | jq -r .url)
curl -X PATCH "$SITE/api/articles/chess-and-math" -H "Authorization: Bearer $KEY" -H "Content-Type: application/json" \
  -d "{\"cover_url\": \"$URL\"}"

# unpublish, then delete
curl -X PATCH "$SITE/api/articles/chess-and-math" -H "Authorization: Bearer $KEY" -H "Content-Type: application/json" -d '{"status": "draft"}'
curl -X DELETE "$SITE/api/articles/chess-and-math" -H "Authorization: Bearer $KEY"

# public reads
curl "$SITE/api/articles?lang=en&limit=4"
curl "$SITE/api/articles/age-to-start?lang=kk"
```

## Pages and fallback

- `/articles` (+ `/en`, `/kz`): index only — hero, topic chips, featured card, card grid. Old links
  `/articles#<slug>` are redirected to `/articles/<slug>` by `public/main/articles.js`.
- `/articles/<slug>` (+ `/en`, `/kz`): one article with its own title, description, canonical,
  hreflang (ru/en/kk + x-default), Open Graph and BlogPosting JSON-LD. Unknown, draft or
  untranslated slugs → 404.
- If the database is unreachable the index serves the static files in `public/main/articles/` and
  article pages render the six launch articles from `src/lib/articles/seed.json`.
- The landing block `#articles` keeps 4 static cards; `public/main/v2.js` swaps their text and links
  for the latest 4 from `/api/articles` when the call succeeds.

## Database

Migration: `supabase/migrations/20261124_articles.sql` (tables `articles`, `article_api_keys`, bucket
`article-covers`, seed). RLS: anyone may read published articles; keys are service-role only.
