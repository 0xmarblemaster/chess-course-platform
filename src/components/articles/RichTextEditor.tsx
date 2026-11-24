'use client'

import { useEffect, useRef } from 'react'
import { cleanEditorHtml } from '@/lib/articles/client'

interface Props {
  value: string
  onChange: (html: string) => void
  label: string
  invalid?: boolean
}

type Tool = { label: string; title: string; run: () => void; className?: string }

// contenteditable + execCommand: no dependency, and every change is reduced to the article
// subset (p, h2, h3, lists, strong, em, links, quotes) before it reaches the form.
export default function RichTextEditor({ value, onChange, label, invalid }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const emitted = useRef<string | null>(null)

  // Only write into the DOM when the value comes from outside (load, language switch), not while typing.
  useEffect(() => {
    if (ref.current && value !== emitted.current) {
      ref.current.innerHTML = value
      emitted.current = value
    }
  }, [value])

  const emit = () => {
    const html = cleanEditorHtml(ref.current?.innerHTML || '')
    emitted.current = html
    onChange(html)
  }
  const exec = (cmd: string, arg?: string) => {
    ref.current?.focus()
    document.execCommand('defaultParagraphSeparator', false, 'p')
    document.execCommand(cmd, false, arg)
    emit()
  }
  const block = (tag: string) => {
    const current = document.queryCommandValue('formatBlock').toLowerCase()
    exec('formatBlock', current === tag ? 'p' : tag)
  }
  const link = () => {
    const url = window.prompt('Link URL (https://… or /path)')
    if (url === null) return
    if (!url) return exec('unlink')
    if (!/^(https?:\/\/|\/(?!\/)|#)/i.test(url)) return window.alert('Use an https:// address or a site path starting with /')
    exec('createLink', url)
  }

  const tools: Tool[] = [
    { label: 'B', title: 'Bold', run: () => exec('bold'), className: 'font-bold' },
    { label: 'I', title: 'Italic', run: () => exec('italic'), className: 'italic' },
    { label: 'H2', title: 'Heading', run: () => block('h2') },
    { label: 'H3', title: 'Subheading', run: () => block('h3') },
    { label: '• List', title: 'Bulleted list', run: () => exec('insertUnorderedList') },
    { label: '1. List', title: 'Numbered list', run: () => exec('insertOrderedList') },
    { label: 'Link', title: 'Link', run: link },
    { label: '❝ Quote', title: 'Quote', run: () => block('blockquote') },
  ]

  return (
    <div className={`rounded-md border bg-white ${invalid ? 'border-red-500' : 'border-gray-300'}`}>
      <div className="flex flex-wrap gap-1 border-b border-gray-200 bg-gray-50 p-1.5" role="toolbar" aria-label={`${label} formatting`}>
        {tools.map((t) => (
          <button
            key={t.title}
            type="button"
            title={t.title}
            aria-label={t.title}
            onMouseDown={(e) => e.preventDefault()}
            onClick={t.run}
            className={`min-h-9 rounded px-2.5 text-sm text-gray-700 hover:bg-gray-200 ${t.className || ''}`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div
        ref={ref}
        role="textbox"
        aria-multiline="true"
        aria-label={label}
        aria-invalid={invalid || undefined}
        contentEditable
        suppressContentEditableWarning
        onInput={emit}
        onBlur={emit}
        onPaste={(e) => {
          e.preventDefault()
          document.execCommand('insertText', false, e.clipboardData.getData('text/plain'))
        }}
        className="min-h-64 max-w-none p-4 text-gray-900 focus:outline-none [&_blockquote]:border-l-4 [&_blockquote]:pl-3 [&_blockquote]:text-gray-600 [&_h2]:mt-3 [&_h2]:text-xl [&_h2]:font-bold [&_h3]:mt-2 [&_h3]:text-lg [&_h3]:font-semibold [&_a]:text-indigo-600 [&_a]:underline [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:my-2 [&_ul]:list-disc [&_ul]:pl-6"
      />
    </div>
  )
}
