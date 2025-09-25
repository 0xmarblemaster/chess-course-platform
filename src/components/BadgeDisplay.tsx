'use client'

interface Badge {
  id: string
  level_id: number
  badge_url: string
  earned_at: string
}

interface BadgeDisplayProps {
  badges: Badge[]
  size?: 'sm' | 'md' | 'lg'
  showLevel?: boolean
  className?: string
}

export default function BadgeDisplay({
  badges,
  size = 'md',
  showLevel = true,
  className = ''
}: BadgeDisplayProps) {
  const sizeClasses = {
    sm: 'w-12 h-12',
    md: 'w-16 h-16',
    lg: 'w-20 h-20'
  }

  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  }

  if (badges.length === 0) {
    return (
      <div className={`text-center ${className}`}>
        <div className={`${sizeClasses[size]} bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-2`}>
          <span className="text-gray-400">🏆</span>
        </div>
        <p className={`${textSizeClasses[size]} text-gray-500`}>No badges yet</p>
      </div>
    )
  }

  return (
    <div className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4 ${className}`}>
      {badges.map((badge) => (
        <div key={badge.id} className="text-center group">
          <div className={`${sizeClasses[size]} bg-gradient-to-br from-yellow-100 to-yellow-200 rounded-full flex items-center justify-center mx-auto mb-2 shadow-md group-hover:shadow-lg transition-shadow cursor-pointer`}>
            <span className="text-2xl">🏆</span>
          </div>
          {showLevel && (
            <p className={`${textSizeClasses[size]} text-gray-600 font-medium`}>
              Level {badge.level_id}
            </p>
          )}
          <p className={`${textSizeClasses[size]} text-gray-500`}>
            {new Date(badge.earned_at).toLocaleDateString()}
          </p>
        </div>
      ))}
    </div>
  )
}