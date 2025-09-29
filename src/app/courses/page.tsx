'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useLanguage } from '@/contexts/LanguageContext'
import ProtectedRoute from '@/components/ProtectedRoute'
import { getLessonsForLevel, getLevels, getUserProgress, getLevelProgress, type Lesson, type Progress } from '@/lib/data'
import Link from 'next/link'

interface LessonWithProgress extends Lesson {
  progress?: Progress
  isCompleted: boolean
}

export default function CoursesPage() {
  const { t } = useLanguage()
  const { user } = useAuth()
  
  const [lessons, setLessons] = useState<LessonWithProgress[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [levelProgress, setLevelProgress] = useState({
    totalLessons: 0,
    completedLessons: 0,
    progressPercentage: 0
  })

  useEffect(() => {
    const loadCourses = async () => {
      if (!user) return

      try {
        setLoading(true)
        setError('')
        
        // Get the first level (assuming it's the main course)
        const levels = await getLevels()
        if (levels.length === 0) {
          setError('No courses available')
          return
        }
        
        const firstLevel = levels[0]
        const levelLessons = await getLessonsForLevel(firstLevel.id)
        const userProgress = await getUserProgress(user.id)
        const progress = await getLevelProgress(user.id, firstLevel.id)
        
        const lessonsWithProgress: LessonWithProgress[] = levelLessons.map(lesson => {
          const lessonProgress = userProgress.find(p => p.lesson_id === lesson.id)
          return {
            ...lesson,
            progress: lessonProgress,
            isCompleted: lessonProgress ? lessonProgress.video_watched && lessonProgress.test_passed : false
          }
        })
        
        setLessons(lessonsWithProgress)
        setLevelProgress(progress)
        
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to load courses')
      } finally {
        setLoading(false)
      }
    }

    loadCourses()
  }, [user])

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading courses...</p>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  if (error) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Error</h1>
            <p className="text-gray-600 mb-4">{error}</p>
            <Link
              href="/dashboard"
              className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  const { totalLessons, completedLessons, progressPercentage } = levelProgress

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 py-4 sm:py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Course Header */}
          <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
              {t('level.courseTitle', 'Chess Empire')}
            </h1>
            <p className="text-gray-600 mb-6">
              {t('level.courseDescription', 'Master chess with interactive lessons and challenges')}
            </p>
            
            {/* Progress */}
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700">
                  {t('level.levelProgress', 'Course Progress')}
                </span>
                <span className="text-sm text-gray-500">
                  {progressPercentage.toFixed(1)}% {t('level.complete', 'complete')}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="h-3 rounded-full transition-all duration-300"
                  style={{ width: `${progressPercentage}%`, backgroundColor: '#32CD32' }}
                ></div>
              </div>
              <p className="text-sm text-gray-500 mt-1">
                {completedLessons}/{totalLessons} {t('level.lessons', 'lessons')}
              </p>
            </div>
          </div>

          {/* Lessons List */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              {t('level.lessons', 'lessons')} ({totalLessons})
            </h2>
            
            {lessons.length === 0 ? (
              <div className="bg-white rounded-lg shadow-md p-6 text-center">
                <p className="text-gray-500">{t('level.noLessons', 'No lessons available for this course.')}</p>
              </div>
            ) : (
              lessons.map((lesson, index) => (
                <div key={lesson.id} className="bg-white rounded-lg shadow-md p-4 sm:p-6">
                  <div className="flex flex-col space-y-4">
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                          <span className="text-indigo-600 font-semibold text-base">
                            {index + 1}
                          </span>
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base font-medium text-gray-900">
                          {lesson.title}
                        </h3>
                        <div className="flex flex-col space-y-1 mt-2">
                          <div className="flex items-center space-x-1">
                            <span className={lesson.progress?.video_watched ? 'text-green-600' : 'text-gray-400'}>
                              📹
                            </span>
                            <span className={lesson.progress?.video_watched ? 'text-green-600' : 'text-gray-400'}>
                              {t('level.video', 'Video')} {lesson.progress?.video_watched ? t('level.watched', 'Watched') : t('level.notWatched', 'Not Watched')}
                            </span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <span className={lesson.progress?.test_passed ? 'text-green-600' : 'text-gray-400'}>
                              🎯
                            </span>
                            <span className={lesson.progress?.test_passed ? 'text-green-600' : 'text-gray-400'}>
                              {t('level.test', 'Test')} {lesson.progress?.test_passed ? t('level.passed', 'Passed') : t('level.notPassed', 'Not Passed')}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="w-full">
                      <Link
                        href={`/lessons/${lesson.id}`}
                        className="block w-full text-center bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
                      >
                        {lesson.isCompleted ? t('level.reviewLesson', 'Review Lesson') : t('level.startLesson', 'Start Lesson')}
                      </Link>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Navigation */}
          <div className="mt-8 text-center">
            <Link
              href="/dashboard"
              className="text-indigo-600 hover:text-indigo-700 font-medium"
            >
              {t('level.backToDashboard', '← Back to Dashboard')}
            </Link>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}
