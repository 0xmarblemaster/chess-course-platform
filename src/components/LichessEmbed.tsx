'use client'

interface LichessEmbedProps {
  embedUrl: string
  title: string
  onTestPassed?: () => void
  className?: string
}

export default function LichessEmbed({
  embedUrl,
  title,

  className = ''
}: LichessEmbedProps) {
  return (
    <div className={`w-full ${className}`}>
      <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden shadow-md">
        <iframe
          src={embedUrl}
          title={`Lichess Challenge - ${title}`}
          className="w-full h-full"
          allowFullScreen
        />
      </div>
    </div>
  )
}