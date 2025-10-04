'use client'

import { useEffect, useState, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useLanguage } from '@/contexts/LanguageContext'
import ProtectedRoute from '@/components/ProtectedRoute'
import LoadingScreen from "@/components/LoadingScreen"
import { getDashboardData, getLevelGroups } from "@/lib/data"
import { type Level, type Badge, type LevelGroup } from '@/lib/data'
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
  const { user } = useAuth()
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
  const [levelGroups, setLevelGroups] = useState<LevelGroup[]>([])
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null)
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
      
      // Use optimized parallel data loading
      const { badges: badgesData, overallProgress: overallProgressData, levelsWithProgress } = await getDashboardData(user.id, selectedGroupId ?? undefined)
      
      setLevels(levelsWithProgress)
      setBadges(badgesData)
      setOverallProgress(overallProgressData)
    } finally {
      setDashboardLoading(false)
    }
  }, [user, selectedGroupId])

  useEffect(() => {
    if (user) {
      loadDashboardData()
    }
  }, [user, loadDashboardData])

  // Load level groups once and default to first if none selected
  useEffect(() => {
    const loadGroupsAndDefault = async () => {
      const groups = await getLevelGroups()
      setLevelGroups(groups)

      // Restore persisted selection first
      const persisted = typeof window !== 'undefined' ? window.localStorage.getItem('selectedLevelGroupId') : null
      if (persisted) {
        setSelectedGroupId(parseInt(persisted, 10))
        return
      }

      // Otherwise, determine current group by first incomplete course
      if (user) {
        const { levels: allLevels, levelsWithProgress } = await getDashboardData(user.id)
        const firstIncomplete = levelsWithProgress.find(l => l.progress.progressPercentage < 100)
        if (firstIncomplete && (firstIncomplete as any).level_group_id) {
          setSelectedGroupId((firstIncomplete as any).level_group_id)
          return
        }
      }

      if (!selectedGroupId && groups.length > 0) {
        setSelectedGroupId(groups[0].id)
      }
    }
    loadGroupsAndDefault()
  }, [user])

  // Persist selection
  useEffect(() => {
    if (selectedGroupId && typeof window !== 'undefined') {
      window.localStorage.setItem('selectedLevelGroupId', String(selectedGroupId))
    }
  }, [selectedGroupId])


  if (dashboardLoading) {
    return (
      <ProtectedRoute>
        <LoadingScreen isVisible={true} />
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
          <div
            className="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-6 sm:mb-8"
            style={{ backgroundImage: 'linear-gradient(90deg, #f8ff00 0%, #3ad59f 100%)' }}
          >
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              {t('dashboard.overallProgress', 'Overall Progress')}
            </h2>
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <span>{t('dashboard.courseProgress', 'Course Progress')}</span>
                  <span>{Math.round(overallProgress.completedLessons)}/{overallProgress.totalLessons} {t('dashboard.lessons', 'lessons')}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="h-3 rounded-full transition-all duration-300"
                    style={{ width: `${overallProgress.progressPercentage}%`, backgroundColor: '#32CD32' }}
                  ></div>
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  {overallProgress.progressPercentage.toFixed(0)}% {t('dashboard.complete', 'complete')}
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
            {/* Level Group Tabs */}
            {levelGroups.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center gap-2 overflow-x-auto py-1">
                  {levelGroups.map(g => (
                    <button
                      key={g.id}
                      onClick={() => setSelectedGroupId(g.id)}
                      className={`whitespace-nowrap px-4 py-2 rounded-full text-sm transition-colors ${selectedGroupId === g.id ? 'bg-indigo-600 text-white shadow-sm' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                    >
                      {g.title}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Course Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {levels.map((level, index) => {
                const translatedLevel = translateLevel(level)
                const isLocked = !level.isUnlocked
                const isCompleted = level.progress.progressPercentage === 100
                const isCurrent = level.isUnlocked && level.progress.progressPercentage > 0 && level.progress.progressPercentage < 100
                const ctaLabel = isCompleted
                  ? t('dashboard.reviewLevel', 'Review Level')
                  : (level.progress.completedLessons === 0
                      ? t('dashboard.startLevel', 'Start Level')
                      : t('dashboard.continueLevel', 'Continue Level'))
                return (
                  <div
                    key={level.id}
                    className={`rounded-xl border transition-all duration-200 ${isLocked ? 'border-gray-300 bg-gray-50 opacity-75' : 'border-gray-200 hover:border-indigo-300 hover:shadow-lg bg-white'}`}
                    style={
                      isCompleted
                        ? { backgroundColor: '#E9FBEC' }
                        : (isCurrent
                            ? { backgroundImage: 'linear-gradient(90deg, #f8ff00 0%, #3ad59f 100%)' }
                            : undefined)
                    }
                  >
                    <div className="p-5 flex flex-col h-full">
                      <div className="flex items-center gap-3 mb-2">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${isLocked ? 'bg-gray-400' : 'bg-indigo-600'}`}>{index + 1}</div>
                        <h3 className="text-lg font-semibold text-gray-900">{translatedLevel.title}</h3>
                        {isLocked && <span className="ml-2 text-sm text-gray-500">{t('dashboard.locked', '🔒 Locked')}</span>}
                      </div>
                      <p className="text-gray-600 mb-4 line-clamp-3">{translatedLevel.description}</p>
                      <div className="mb-4">
                        <div className="flex justify-between text-sm text-gray-600 mb-2">
                          <span>{t('dashboard.progress', 'Progress')}</span>
                          <span>{level.progress.completedLessons}/{level.progress.totalLessons} {t('dashboard.lessons', 'lessons')}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div className="h-2.5 rounded-full transition-all duration-300" style={{ width: `${level.progress.progressPercentage}%`, backgroundColor: '#32CD32' }}></div>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">{level.progress.progressPercentage.toFixed(0)}% {t('dashboard.complete', 'complete')}</p>
                      </div>

                      <div className="mt-auto">
                        {isLocked ? (
                          <button disabled className="w-full bg-gray-300 text-gray-600 px-4 py-2 rounded-lg text-sm font-medium cursor-not-allowed">{t('dashboard.completePrevious', 'Complete Previous Level')}</button>
                        ) : (
                          <Link href={`/levels/${level.id}`} className="block w-full text-center bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm hover:shadow-md">{ctaLabel}</Link>
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