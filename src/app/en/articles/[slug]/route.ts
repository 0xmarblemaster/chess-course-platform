import { articlePage } from '@/lib/articles/page'

// Article data is cached for at most 60 s, and refreshed right after any article write (revalidateTag('articles')).
export const revalidate = 60

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  return articlePage('en', (await params).slug)
}
