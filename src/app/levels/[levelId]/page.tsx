'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import ProtectedRoute from '@/components/ProtectedRoute'
import { getLevels, getLessonsForLevel, getUserProgress, getLevelProgress, type Level, type Lesson, type Progress } from '@/lib/data'
import Link from 'next/link'

interface LessonWithProgress extends Lesson {
  progress?: Progress
  isCompleted: boolean
}

export default function LevelPage() {
  const params = useParams()

  const { user } = useAuth()
  const levelId = parseInt(params.levelId as string)
  
  const [level, setLevel] = useState<Level | null>(null)
  const [lessons, setLessons] = useState<LessonWithProgress[]>([])
  const [levelProgress, setLevelProgress] = useState({
    totalLessons: 0,
    completedLessons: 0,
    progressPercentage: 0
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadLevelData = useCallback(async () => {
    if (!user || !levelId) return

    try {
      setLoading(true)
      setError('')
      
      // Load level data
      const levels = await getLevels()
      const currentLevel = levels.find(l => l.id === levelId)
      
      if (!currentLevel) {
        setError('Level not found')
        return
      }
      
      setLevel(currentLevel)
      
      // Load lessons and progress
      const lessonsData = await getLessonsForLevel(levelId)
      const userProgress = await getUserProgress(user.id)
      const progress = await getLevelProgress(user.id, levelId)
      
      const lessonsWithProgress: LessonWithProgress[] = lessonsData.map(lesson => {
        const lessonProgress = userProgress.find(p => p.lesson_id === lesson.id)
        return {
          ...lesson,
          progress: lessonProgress,
          isCompleted: lessonProgress ? lessonProgress.video_watched && lessonProgress.test_passed : false
        }
      })
      
      setLessons(lessonsWithProgress)
      setLevelProgress(progress)
    } catch (error) {
      console.error('Error loading level data:', error)
      setError('Failed to load level data')
    } finally {
      setLoading(false)
    }
  }, [user, levelId])

  useEffect(() => {
    if (user && levelId) {
      loadLevelData()
    }
  }, [user, levelId, loadLevelData])

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading level...</p>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  if (error || !level) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Error</h1>
            <p className="text-gray-600 mb-4">{error || 'Level not found'}</p>
            <Link
              href="/dashboard"
              className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        {/* Navigation */}
        <nav className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center space-x-4">
                <Link href="/dashboard" className="text-2xl font-bold text-indigo-600">
                  ♔ Chess Master
                </Link>
                <span className="text-gray-400">/</span>
                <span className="text-gray-700">{level.title}</span>
              </div>
              <div className="flex items-center space-x-4">
                <Link
                  href="/dashboard"
                  className="text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Dashboard
                </Link>
              </div>
            </div>
          </div>
        </nav>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Level Header */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {level.title}
                </h1>
                <p className="text-gray-600 mb-6">{level.description}</p>
                
                {/* Progress Bar */}
                <div className="mb-4">
                  <div className="flex justify-between text-sm text-gray-600 mb-2">
                    <span>Level Progress</span>
                    <span>{levelProgress.completedLessons}/{levelProgress.totalLessons} lessons</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-indigo-600 h-3 rounded-full transition-all duration-300"
                      style={{ width: `${levelProgress.progressPercentage}%` }}
                    ></div>
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    {levelProgress.progressPercentage.toFixed(1)}% complete
                  </p>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
                {level.pdf_url && (
                  <a
                    href={level.pdf_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="border border-indigo-600 text-indigo-600 px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-50 transition-colors text-center"
                  >
                    📄 Download PDF
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Lessons List */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              Lessons ({lessons.length})
            </h2>
            
            {lessons.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No lessons available for this level.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {lessons.map((lesson, index) => (
                  <div
                    key={lesson.id}
                    className="border border-gray-200 rounded-lg p-4 hover:border-indigo-300 transition-colors"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                            lesson.isCompleted ? 'bg-green-600' : 'bg-indigo-600'
                          }`}>
                            {index + 1}
                          </div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            {lesson.title}
                          </h3>
                          {lesson.isCompleted && (
                            <span className="text-green-600 text-sm">✅ Completed</span>
                          )}
                        </div>
                        
                        {/* Lesson Progress Indicators */}
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <div className="flex items-center space-x-1">
                            <span className={lesson.progress?.video_watched ? 'text-green-600' : 'text-gray-400'}>
                              📹
                            </span>
                            <span className={lesson.progress?.video_watched ? 'text-green-600' : 'text-gray-400'}>
                              Video {lesson.progress?.video_watched ? 'Watched' : 'Not Watched'}
                            </span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <span className={lesson.progress?.test_passed ? 'text-green-600' : 'text-gray-400'}>
                              🎯
                            </span>
                            <span className={lesson.progress?.test_passed ? 'text-green-600' : 'text-gray-400'}>
                              Test {lesson.progress?.test_passed ? 'Passed' : 'Not Passed'}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-4 sm:mt-0">
                        <Link
                          href={`/lessons/${lesson.id}`}
                          className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700 transition-colors text-center block"
                        >
                          {lesson.isCompleted ? 'Review Lesson' : 'Start Lesson'}
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Back to Dashboard */}
          <div className="mt-8 text-center">
            <Link
              href="/dashboard"
              className="text-indigo-600 hover:text-indigo-700 font-medium"
            >
              ← Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}