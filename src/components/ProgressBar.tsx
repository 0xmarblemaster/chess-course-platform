'use client'

import { useEffect, useState } from 'react'

interface ProgressBarProps {
  percentage: number
  label?: string
  showPercentage?: boolean
  size?: 'sm' | 'md' | 'lg'
  color?: 'indigo' | 'green' | 'blue' | 'purple'
  animated?: boolean
  className?: string
}

export default function ProgressBar({
  percentage,
  label,
  showPercentage = true,
  size = 'md',
  color = 'indigo',
  animated = true,
  className = ''
}: ProgressBarProps) {
  const [displayPercentage, setDisplayPercentage] = useState(0)

  useEffect(() => {
    if (animated) {
      // Animate the progress bar
      const timer = setTimeout(() => {
        setDisplayPercentage(percentage)
      }, 100)
      return () => clearTimeout(timer)
    } else {
      setDisplayPercentage(percentage)
    }
  }, [percentage, animated])

  const sizeClasses = {
    sm: 'h-2',
    md: 'h-3',
    lg: 'h-4'
  }

  const colorClasses = {
    indigo: 'bg-indigo-600',
    green: 'bg-green-600',
    blue: 'bg-blue-600',
    purple: 'bg-purple-600'
  }

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">{label}</span>
          {showPercentage && (
            <span className="text-sm text-gray-500">
              {displayPercentage.toFixed(1)}%
            </span>
          )}
        </div>
      )}
      <div className={`w-full bg-gray-200 rounded-full ${sizeClasses[size]}`}>
        <div
          className={`${colorClasses[color]} ${sizeClasses[size]} rounded-full transition-all duration-500 ease-out`}
          style={{ width: `${displayPercentage}%` }}
        />
      </div>
      {!label && showPercentage && (
        <div className="text-right mt-1">
          <span className="text-sm text-gray-500">
            {displayPercentage.toFixed(1)}%
          </span>
        </div>
      )}
    </div>
  )
}