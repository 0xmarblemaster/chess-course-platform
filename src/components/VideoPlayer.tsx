'use client'

interface VideoPlayerProps {
  videoUrl: string
  title: string
  onVideoWatched?: () => void
  className?: string
}

export default function VideoPlayer({
  videoUrl,
  title,

  className = ''
}: VideoPlayerProps) {
  const getEmbedUrl = (url: string) => {
    // Handle YouTube URLs
    if (url.includes('youtube.com/watch?v=')) {
      return url.replace('watch?v=', 'embed/')
    }
    if (url.includes('youtu.be/')) {
      const videoId = url.split('youtu.be/')[1].split('?')[0]
      return `https://www.youtube.com/embed/${videoId}`
    }
    // Return as-is if already an embed URL
    return url
  }

  const embedUrl = getEmbedUrl(videoUrl)

  return (
    <div className={`w-full ${className}`}>
      <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden shadow-md">
        <iframe
          src={embedUrl}
          title={title}
          className="w-full h-full"
          allowFullScreen
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        />
      </div>
    </div>
  )
}