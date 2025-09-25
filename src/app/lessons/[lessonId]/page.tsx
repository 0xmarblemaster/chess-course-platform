'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import ProtectedRoute from '@/components/ProtectedRoute'
import { getLessonsForLevel, getUserProgress, type Lesson } from '@/lib/data'
import { markVideoWatched, markTestPassed, markLessonComplete } from '@/lib/progress'
import Link from 'next/link'

export default function LessonPage() {
  const params = useParams()

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
      
      // Find the lesson by searching through all levels
      const levels = [1, 2, 3] // We know we have 3 levels
      let foundLesson: Lesson | null = null
      
      for (const levelId of levels) {
        const lessons = await getLessonsForLevel(levelId)
        const targetLesson = lessons.find(l => l.id === lessonId)
        if (targetLesson) {
          foundLesson = targetLesson
          break
        }
      }
      
      if (!foundLesson) {
        setError('Lesson not found')
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
      setError('Failed to load lesson data')
    } finally {
      setLoading(false)
    }
  }, [user, lessonId])

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
            <p className="mt-4 text-gray-600">Loading lesson...</p>
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
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Error</h1>
            <p className="text-gray-600 mb-4">{error || 'Lesson not found'}</p>
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
                <Link href={`/levels/${lesson.level_id}`} className="text-gray-700 hover:text-indigo-600">
                  Level {lesson.level_id}
                </Link>
                <span className="text-gray-400">/</span>
                <span className="text-gray-700">{lesson.title}</span>
              </div>
              <div className="flex items-center space-x-4">
                <Link
                  href={`/levels/${lesson.level_id}`}
                  className="text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Back to Level
                </Link>
              </div>
            </div>
          </div>
        </nav>

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
                  Video {videoWatched ? 'Watched' : 'Not Watched'}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <span className={testPassed ? 'text-green-600' : 'text-gray-400'}>
                  {testPassed ? '✅' : '⭕'}
                </span>
                <span className={testPassed ? 'text-green-600' : 'text-gray-600'}>
                  Test {testPassed ? 'Passed' : 'Not Passed'}
                </span>
              </div>
              {isCompleted && (
                <div className="flex items-center space-x-2">
                  <span className="text-green-600">🏆</span>
                  <span className="text-green-600 font-medium">Lesson Completed!</span>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Video Section */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                📹 Video Lesson
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
                  <p className="text-gray-500">No video available</p>
                </div>
              )}
              
              <div className="flex justify-between items-center">
                <p className="text-sm text-gray-600">
                  Watch the video to understand the concepts
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
                  {updating ? 'Updating...' : videoWatched ? 'Video Watched' : 'Mark Video Watched'}
                </button>
              </div>
            </div>

            {/* Lichess Challenge Section */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                🎯 Interactive Challenge
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
                  <p className="text-gray-500">No challenge available</p>
                </div>
              )}
              
              <div className="flex justify-between items-center">
                <p className="text-sm text-gray-600">
                  Complete the challenge to test your understanding
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
                  {updating ? 'Updating...' : testPassed ? 'Test Passed' : 'Mark Test Passed'}
                </button>
              </div>
            </div>
          </div>

          {/* Complete Lesson Section */}
          <div className="bg-white rounded-lg shadow-md p-6 mt-8">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Complete This Lesson
              </h2>
              <p className="text-gray-600 mb-6">
                Mark this lesson as complete when you&apos;ve finished both the video and challenge
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
                {updating ? 'Updating...' : isCompleted ? 'Lesson Completed!' : 'Mark Lesson Complete'}
              </button>
              
              {!videoWatched && (
                <p className="text-sm text-gray-500 mt-2">
                  Complete the video first
                </p>
              )}
              {!testPassed && videoWatched && (
                <p className="text-sm text-gray-500 mt-2">
                  Complete the challenge first
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
              ← Back to Level
            </Link>
            <Link
              href="/dashboard"
              className="text-indigo-600 hover:text-indigo-700 font-medium"
            >
              Dashboard →
            </Link>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}