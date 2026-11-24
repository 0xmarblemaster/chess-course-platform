'use client'

import { useParams } from 'next/navigation'
import ArticleEditor from '@/components/articles/ArticleEditor'

export default function EditArticlePage() {
  const { slug } = useParams<{ slug: string }>()
  return <ArticleEditor key={slug} slug={slug} />
}
