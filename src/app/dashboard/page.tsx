'use client'

import { useEffect, useState, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useLanguage } from '@/contexts/LanguageContext'
import ProtectedRoute from '@/components/ProtectedRoute'
import { getLevels, getLevelProgress, getOverallProgress, getUserBadges, type Level, type Badge } from '@/lib/data'
import Link from 'next/link'

interface LevelWithProgress extends Level {
  progress: {
    totalLessons: number
    completedLessons: number
    progressPercentage: number
  }
  isUnlocked: boolean
}

export default function DashboardPage() {
  const { user, loading } = useAuth()
  const { t } = useLanguage()
  const searchParams = useSearchParams()
  const authSuccess = searchParams.get('auth')

  // Handle auth success from magic link
  useEffect(() => {
    if (authSuccess === 'success' && user) {
      // Clear the URL parameter
      const url = new URL(window.location.href)
      url.searchParams.delete('auth')
      window.history.replaceState({}, '', url.toString())
    }
  }, [authSuccess, user])

  // Function to translate level titles and descriptions
  const translateLevel = (level: Level) => {
    const levelTranslations: Record<string, { title: string; description: string }> = {
      'Beginner': {
        title: t('dashboard.beginner', 'Beginner'),
        description: t('dashboard.chessBasics', 'Chess basics')
      },
      'Intermediate': {
        title: t('dashboard.intermediate', 'Intermediate'),
        description: t('home.intermediateDescription', 'Advance your skills with complex tactics and positional play.')
      },
      'Advanced': {
        title: t('dashboard.advanced', 'Advanced'),
        description: t('home.advancedDescription', 'Master advanced strategies and tournament preparation.')
      }
    }

    const translation = levelTranslations[level.title] || { title: level.title, description: level.description }
    return {
      ...level,
      title: translation.title,
      description: translation.description
    }
  }
  const [levels, setLevels] = useState<LevelWithProgress[]>([])
  const [badges, setBadges] = useState<Badge[]>([])
  const [overallProgress, setOverallProgress] = useState({
    totalLessons: 0,
    completedLessons: 0,
    progressPercentage: 0
  })
  const [dashboardLoading, setDashboardLoading] = useState(true)

  const loadDashboardData = useCallback(async () => {
    if (!user) return

    try {
      setDashboardLoading(true)
      
      // Load levels and their progress
      const levelsData = await getLevels()
      const badgesData = await getUserBadges(user.id)
      const overallProgressData = await getOverallProgress(user.id)
      
      const levelsWithProgress: LevelWithProgress[] = []
      let previousLevelCompleted = true
      
      for (let i = 0; i < levelsData.length; i++) {
        const level = levelsData[i]
        const progress = await getLevelProgress(user.id, level.id)
        
        levelsWithProgress.push({
          ...level,
          progress,
          isUnlocked: previousLevelCompleted
        })
        
        // Check if this level is completed
        previousLevelCompleted = progress.progressPercentage === 100
      }
      
      setLevels(levelsWithProgress)
      setBadges(badgesData)
      setOverallProgress(overallProgressData)
    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      setDashboardLoading(false)
    }
  }, [user])

  useEffect(() => {
    if (user) {
      loadDashboardData()
    }
  }, [user, loadDashboardData])



  if (dashboardLoading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-progress mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading dashboard...</p>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
          {/* Welcome Section */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {t('dashboard.welcome', 'Welcome to Your Chess Journey')}
            </h1>
            <p className="text-gray-600">
              {t('dashboard.trackProgress', 'Track your progress and continue learning')}
            </p>
          </div>

          {/* Overall Progress */}
          <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-6 sm:mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              {t('dashboard.overallProgress', 'Overall Progress')}
            </h2>
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <span>{t('dashboard.courseProgress', 'Course Progress')}</span>
                  <span>{overallProgress.completedLessons}/{overallProgress.totalLessons} {t('dashboard.lessons', 'lessons')}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-progress h-3 rounded-full transition-all duration-300"
                    style={{ width: `${overallProgress.progressPercentage}%` }}
                  ></div>
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  {overallProgress.progressPercentage.toFixed(1)}% {t('dashboard.complete', 'complete')}
                </p>
              </div>
            </div>
          </div>

          {/* Badges Section */}
          {badges.length > 0 && (
            <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-6 sm:mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Earned Badges
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
                {badges.map((badge) => (
                  <div key={badge.id} className="text-center">
                    <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-2">
                      <span className="text-2xl">🏆</span>
                    </div>
                    <p className="text-xs text-gray-600">Level {badge.level_id}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Levels Section */}
          <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              {t('dashboard.courseLevels', 'Course Levels')}
            </h2>
            <div className="space-y-6">
              {levels.map((level, index) => {
                const translatedLevel = translateLevel(level)
                return (
                <div
                  key={level.id}
                  className={`border rounded-xl p-6 transition-all duration-200 ${
                    level.isUnlocked
                      ? 'border-gray-200 hover:border-indigo-300 hover:shadow-lg bg-white'
                      : 'border-gray-300 bg-gray-50 opacity-75'
                  }`}
                >
                  <div className="flex flex-col space-y-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                          level.isUnlocked ? 'bg-indigo-600' : 'bg-gray-400'
                        }`}>
                          {index + 1}
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {translatedLevel.title}
                        </h3>
                        {!level.isUnlocked && (
                          <span className="text-sm text-gray-500">{t('dashboard.locked', '🔒 Locked')}</span>
                        )}
                      </div>
                      <p className="text-gray-600 mb-4">{translatedLevel.description}</p>
                      
                      {/* Progress Bar */}
                      <div className="mb-4">
                        <div className="flex justify-between text-sm text-gray-600 mb-2">
                          <span>{t('dashboard.progress', 'Progress')}</span>
                          <span>{level.progress.completedLessons}/{level.progress.totalLessons} {t('dashboard.lessons', 'lessons')}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div
                            className="bg-progress h-3 rounded-full transition-all duration-300"
                            style={{ width: `${level.progress.progressPercentage}%` }}
                          ></div>
                        </div>
                        <p className="text-sm text-gray-500 mt-1">
                          {level.progress.progressPercentage.toFixed(1)}% {t('dashboard.complete', 'complete')}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex flex-col space-y-2">
                      {level.isUnlocked ? (
                        <>
                          <Link
                            href="/courses"
                            className="bg-indigo-600 text-white px-6 py-3 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors text-center shadow-sm hover:shadow-md"
                          >
                            {level.progress.completedLessons === 0 ? t('dashboard.startLevel', 'Start Level') : t('dashboard.continueLevel', 'Continue Level')}
                          </Link>
                          {level.pdf_url && (
                            <a
                              href={level.pdf_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="border border-indigo-600 text-indigo-600 px-6 py-3 rounded-lg text-sm font-medium hover:bg-indigo-50 transition-colors text-center shadow-sm hover:shadow-md"
                            >
                              {t('dashboard.downloadPDF', 'Download PDF')}
                            </a>
                          )}
                        </>
                      ) : (
                        <button
                          disabled
                          className="bg-gray-300 text-gray-500 px-6 py-3 rounded-lg text-sm font-medium cursor-not-allowed shadow-sm"
                        >
                          {t('dashboard.completePrevious', 'Complete Previous Level')}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}