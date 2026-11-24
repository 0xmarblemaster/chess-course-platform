import { randomUUID } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabaseServer'
import { authorize, jsonError } from '@/lib/articles/auth'

export const runtime = 'nodejs'

const BUCKET = 'article-covers'
const MAX_BYTES = 5 * 1024 * 1024
// Checked against the file's first bytes too, so a renamed file can't pass as an image.
const TYPES: Record<string, { ext: string; magic: (b: Buffer) => boolean }> = {
  'image/jpeg': { ext: 'jpg', magic: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  'image/png': { ext: 'png', magic: (b) => b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) },
  'image/webp': { ext: 'webp', magic: (b) => b.toString('latin1', 0, 4) === 'RIFF' && b.toString('latin1', 8, 12) === 'WEBP' },
}

// POST /api/articles/upload — multipart field "file" (jpeg/png/webp, ≤ 5 MB) → { url }
export async function POST(req: NextRequest) {
  const auth = await authorize(req)
  if (!auth.ok) return auth.response
  const form = await req.formData().catch(() => null)
  const file = form?.get('file')
  if (!(file instanceof File)) return jsonError(400, 'Send the image as multipart form field "file"')
  if (file.size > MAX_BYTES) return jsonError(413, 'Image must be at most 5 MB')
  const type = TYPES[file.type]
  const buf = Buffer.from(await file.arrayBuffer())
  if (!type || !type.magic(buf)) return jsonError(415, 'Only JPEG, PNG or WebP images are allowed')

  const path = `${new Date().getFullYear()}/${randomUUID()}.${type.ext}`
  const storage = getSupabaseAdmin()!.storage.from(BUCKET)
  const { error } = await storage.upload(path, buf, { contentType: file.type, upsert: false })
  if (error) return jsonError(500, error.message)
  return NextResponse.json({ url: storage.getPublicUrl(path).data.publicUrl, path }, { status: 201 })
}
