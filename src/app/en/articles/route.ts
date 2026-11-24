import { articlesPage } from '@/lib/articles/page'

// Rebuilt at most every 60 s, and right after any article write (revalidateTag('articles')).
export const revalidate = 60

export const GET = () => articlesPage('en')
