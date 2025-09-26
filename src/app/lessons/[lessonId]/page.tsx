'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useLanguage } from '@/contexts/LanguageContext'
import ProtectedRoute from '@/components/ProtectedRoute'
import { getLessonsForLevel, getUserProgress, getLevels, type Lesson } from '@/lib/data'
import { markVideoWatched, markTestPassed, markLessonComplete } from '@/lib/progress'
import Link from 'next/link'

export default function LessonPage() {
  const params = useParams()
  const { t } = useLanguage()

  const { user } = useAuth()
  const lessonId = parseInt(params.lessonId as string)
  
  const [lesson, setLesson] = useState<Lesson | null>(null)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [updating, setUpdating] = useState(false)
  const [videoWatched, setVideoWatched] = useState(false)
  const [testPassed, setTestPassed] = useState(false)

  const loadLessonData = useCallback(async () => {
    if (!user || !lessonId) return

    try {
      setLoading(true)
      setError('')
      
      // Find the lesson by searching through all available levels
      const levels = await getLevels()
      console.log('LessonPage - Available levels:', levels)
      let foundLesson: Lesson | null = null
      
      for (const level of levels) {
        const lessons = await getLessonsForLevel(level.id)
        console.log(`LessonPage - Lessons for level ${level.id}:`, lessons)
        const targetLesson = lessons.find(l => l.id === lessonId)
        if (targetLesson) {
          foundLesson = targetLesson
          console.log('LessonPage - Found lesson:', targetLesson)
          break
        }
      }
      
      if (!foundLesson) {
        console.log('LessonPage - Lesson not found for ID:', lessonId)
        setError(t('lesson.lessonNotFound', 'Lesson not found'))
        return
      }
      
      setLesson(foundLesson)
      
      // Load user progress for this lesson
      const userProgress = await getUserProgress(user.id)
      const lessonProgress = userProgress.find(p => p.lesson_id === lessonId)
      
      if (lessonProgress) {
        setVideoWatched(lessonProgress.video_watched)
        setTestPassed(lessonProgress.test_passed)
      }
    } catch (error) {
      console.error('Error loading lesson data:', error)
      setError(t('lesson.failedToLoad', 'Failed to load lesson data'))
    } finally {
      setLoading(false)
    }
  }, [user, lessonId, t])

  useEffect(() => {
    if (user && lessonId) {
      loadLessonData()
    }
  }, [user, lessonId, loadLessonData])

  const handleMarkVideoWatched = async () => {
    if (!user || !lesson || updating) return

    try {
      setUpdating(true)
      await markVideoWatched(user.id, lesson.id)
      setVideoWatched(true)
      // Progress updated
    } catch (error) {
      console.error('Error marking video as watched:', error)
    } finally {
      setUpdating(false)
    }
  }

  const handleMarkTestPassed = async () => {
    if (!user || !lesson || updating) return

    try {
      setUpdating(true)
      await markTestPassed(user.id, lesson.id)
      setTestPassed(true)
      // Progress updated
    } catch (error) {
      console.error('Error marking test as passed:', error)
    } finally {
      setUpdating(false)
    }
  }

  const handleMarkComplete = async () => {
    if (!user || !lesson || updating) return

    try {
      setUpdating(true)
      await markLessonComplete(user.id, lesson.id)
      setVideoWatched(true)
      setTestPassed(true)
      // Progress updated
    } catch (error) {
      console.error('Error marking lesson as complete:', error)
    } finally {
      setUpdating(false)
    }
  }

  const isCompleted = videoWatched && testPassed

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">{t('lesson.loading', 'Loading lesson...')}</p>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  if (error || !lesson) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">{t('lesson.error', 'Error')}</h1>
            <p className="text-gray-600 mb-4">{error || t('lesson.lessonNotFound', 'Lesson not found')}</p>
            <Link
              href="/dashboard"
              className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors"
            >
              {t('lesson.backToDashboard', 'Back to Dashboard')}
            </Link>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Lesson Header */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              {lesson.title}
            </h1>
            
            {/* Progress Indicators */}
            <div className="flex items-center space-x-6 mb-6">
              <div className="flex items-center space-x-2">
                <span className={videoWatched ? 'text-green-600' : 'text-gray-400'}>
                  {videoWatched ? '✅' : '⭕'}
                </span>
                <span className={videoWatched ? 'text-green-600' : 'text-gray-600'}>
                  {videoWatched ? t('lesson.videoWatched', 'Video Watched') : t('lesson.videoNotWatched', 'Video Not Watched')}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <span className={testPassed ? 'text-green-600' : 'text-gray-400'}>
                  {testPassed ? '✅' : '⭕'}
                </span>
                <span className={testPassed ? 'text-green-600' : 'text-gray-600'}>
                  {testPassed ? t('lesson.testPassed', 'Test Passed') : t('lesson.testNotPassed', 'Test Not Passed')}
                </span>
              </div>
              {isCompleted && (
                <div className="flex items-center space-x-2">
                  <span className="text-green-600">🏆</span>
                  <span className="text-green-600 font-medium">{t('lesson.lessonCompleted', 'Lesson Completed!')}</span>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Video Section */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                📹 {t('lesson.videoLesson', 'Video Lesson')}
              </h2>
              
              {lesson.video_url ? (
                <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden mb-4">
                  <iframe
                    src={lesson.video_url.replace('watch?v=', 'embed/')}
                    title={lesson.title}
                    className="w-full h-full"
                    allowFullScreen
                  />
                </div>
              ) : (
                <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center mb-4">
                  <p className="text-gray-500">{t('lesson.noVideoAvailable', 'No video available')}</p>
                </div>
              )}
              
              <div className="flex justify-between items-center">
                <p className="text-sm text-gray-600">
                  {t('lesson.watchVideoDescription', 'Watch the video to understand the concepts')}
                </p>
                <button
                  onClick={handleMarkVideoWatched}
                  disabled={videoWatched || updating}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    videoWatched
                      ? 'bg-green-100 text-green-700 cursor-not-allowed'
                      : 'bg-indigo-600 text-white hover:bg-indigo-700'
                  }`}
                >
                  {updating ? t('lesson.updating', 'Updating...') : videoWatched ? t('lesson.videoWatched', 'Video Watched') : t('lesson.markVideoWatched', 'Mark Video Watched')}
                </button>
              </div>
            </div>

            {/* Lichess Challenge Section */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                🎯 {t('lesson.interactiveChallenge', 'Interactive Challenge')}
              </h2>
              
              {lesson.lichess_embed_url ? (
                <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden mb-4">
                  <iframe
                    src={lesson.lichess_embed_url}
                    title={`Lichess Challenge - ${lesson.title}`}
                    className="w-full h-full"
                  />
                </div>
              ) : (
                <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center mb-4">
                  <p className="text-gray-500">{t('lesson.noChallengeAvailable', 'No challenge available')}</p>
                </div>
              )}

              
              <div className="flex justify-between items-center">
                <p className="text-sm text-gray-600">
                  {t('lesson.completeChallengeDescription', 'Complete the challenge to test your understanding')}
                </p>
                <button
                  onClick={handleMarkTestPassed}
                  disabled={testPassed || updating}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    testPassed
                      ? 'bg-green-100 text-green-700 cursor-not-allowed'
                      : 'bg-indigo-600 text-white hover:bg-indigo-700'
                  }`}
                >
                  {updating ? t('lesson.updating', 'Updating...') : testPassed ? t('lesson.testPassed', 'Test Passed') : t('lesson.markTestPassed', 'Mark Test Passed')}
                </button>
              </div>
            </div>
          </div>

          {/* Complete Lesson Section */}
          <div className="bg-white rounded-lg shadow-md p-6 mt-8">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                {t('lesson.completeThisLesson', 'Complete This Lesson')}
              </h2>
              <p className="text-gray-600 mb-6">
                {t('lesson.completeLessonDescription', 'Mark this lesson as complete when you\'ve finished both the video and challenge')}
              </p>
              
              <button
                onClick={handleMarkComplete}
                disabled={isCompleted || updating || !videoWatched || !testPassed}
                className={`px-8 py-3 rounded-lg text-lg font-medium transition-colors ${
                  isCompleted
                    ? 'bg-green-100 text-green-700 cursor-not-allowed'
                    : (!videoWatched || !testPassed)
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-green-600 text-white hover:bg-green-700'
                }`}
              >
                {updating ? t('lesson.updating', 'Updating...') : isCompleted ? t('lesson.lessonCompleted', 'Lesson Completed!') : t('lesson.markLessonComplete', 'Mark Lesson Complete')}
              </button>
              
              {!videoWatched && (
                <p className="text-sm text-gray-500 mt-2">
                  {t('lesson.completeVideoFirst', 'Complete the video first')}
                </p>
              )}
              {!testPassed && videoWatched && (
                <p className="text-sm text-gray-500 mt-2">
                  {t('lesson.completeChallengeFirst', 'Complete the challenge first')}
                </p>
              )}
            </div>
          </div>

          {/* Navigation */}
          <div className="mt-8 flex justify-between">
            <Link
              href={`/levels/${lesson.level_id}`}
              className="text-indigo-600 hover:text-indigo-700 font-medium"
            >
              {t('lesson.backToLevel', '← Back to Level')}
            </Link>
            <Link
              href="/dashboard"
              className="text-indigo-600 hover:text-indigo-700 font-medium"
            >
              {t('lesson.dashboard', 'Dashboard →')}
            </Link>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}