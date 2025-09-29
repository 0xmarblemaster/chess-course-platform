'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { useLanguage } from '@/contexts/LanguageContext'
import ProtectedRoute from '@/components/ProtectedRoute'
import type { Lesson, Progress } from '@/lib/supabaseClient'

export default function LessonPage() {
  const params = useParams()
  const router = useRouter()
  const { t } = useLanguage()
  const [lesson, setLesson] = useState<Lesson | null>(null)
  const [progress, setProgress] = useState<Progress | null>(null)
  const [allLessons, setAllLessons] = useState<Lesson[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [error, setError] = useState('')

  const lessonId = parseInt(params.lessonId as string)

  useEffect(() => {
    fetchLesson()
    fetchProgress()
    fetchAllLessons()
  }, [lessonId])

  const fetchLesson = async () => {
    try {
      const { data, error } = await supabase
        .from('lessons')
        .select('*')
        .eq('id', lessonId)
        .single()

      if (error) throw error
      setLesson(data)
    } catch (err) {
      console.error('Error fetching lesson:', err)
      setError('Failed to load lesson')
    }
  }

  const fetchProgress = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('progress')
        .select('*')
        .eq('user_id', user.id)
        .eq('lesson_id', lessonId)
        .maybeSingle()

      if (error) throw error
      setProgress(data || null)
    } catch (err) {
      console.error('Error fetching progress:', err)
    }
  }

  const fetchAllLessons = async () => {
    try {
      const { data, error } = await supabase
        .from('lessons')
        .select('*')
        .order('order_index')

      if (error) throw error
      setAllLessons(data || [])
    } catch (err) {
      console.error('Error fetching lessons:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleMarkVideoWatched = async () => {
    if (!lesson) return

    try {
      setUpdating(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { error } = await supabase
        .from('progress')
        .upsert({
          user_id: user.id,
          lesson_id: lesson.id,
          video_watched: true,
          test_passed: progress?.test_passed || false
        }, {
          onConflict: 'user_id,lesson_id'
        })

      if (error) throw error
      await fetchProgress()
    } catch (err) {
      console.error('Error updating progress:', err)
    } finally {
      setUpdating(false)
    }
  }

  const handleMarkTestPassed = async () => {
    if (!lesson) return

    try {
      setUpdating(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { error } = await supabase
        .from('progress')
        .upsert({
          user_id: user.id,
          lesson_id: lesson.id,
          video_watched: progress?.video_watched || false,
          test_passed: true
        }, {
          onConflict: 'user_id,lesson_id'
        })

      if (error) throw error
      await fetchProgress()
    } catch (err) {
      console.error('Error updating progress:', err)
    } finally {
      setUpdating(false)
    }
  }

  const handleMarkLessonComplete = async () => {
    if (!lesson) return

    try {
      setUpdating(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { error } = await supabase
        .from('progress')
        .upsert({
          user_id: user.id,
          lesson_id: lesson.id,
          video_watched: true,
          test_passed: true,
          completed_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,lesson_id'
        })

      if (error) throw error
      await fetchProgress()
    } catch (err) {
      console.error('Error completing lesson:', err)
    } finally {
      setUpdating(false)
    }
  }

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <p className="text-gray-600">{t('common.loading', 'Loading...')}</p>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  if (error || !lesson) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              {t('lesson.notFound', 'Lesson Not Found')}
            </h1>
            <p className="text-gray-600 mb-6">
              {t('lesson.notFoundDescription', 'The lesson you are looking for does not exist.')}
            </p>
            <button
              onClick={() => router.push(lesson ? `/levels/${lesson.level_id}` : '/courses')}
              className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700"
            >
              {t('lesson.backToCourses', 'Back to Courses')}
            </button>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  const videoWatched = progress?.video_watched || false
  const testPassed = progress?.test_passed || false
  const isCompleted = progress?.completed_at !== null

  // Find previous and next lessons
  // Define the correct lesson order based on the admin panel sequence
  const correctLessonOrder = [
    1, 2, 17, 18, 19, 20,  // Основы шахмат (Chess Fundamentals)
    22, 23,                // Шах и Мат (Check and Checkmate)
    25,                    // Шахматная нотация (Chess Notation)
    26, 27,                // Рокировка (Castling)
    29, 28, 31, 30, 32,    // Ничья (Draw)
    33,                    // Сравнительная сила фигур (Piece Values)
    34,                    // Мат тяжелыми фигурами (Checkmate with Heavy Pieces)
    35, 36                 // Связка (Pin)
  ];
  
  // Sort lessons according to the correct order
  const sortedLessons = correctLessonOrder
    .map(lessonId => allLessons.find(lesson => lesson.id === lessonId))
    .filter(Boolean); // Remove any undefined lessons
  
  const currentIndex = sortedLessons.findIndex(l => l.id === lesson.id)
  const previousLesson = currentIndex > 0 ? sortedLessons[currentIndex - 1] : null
  const nextLesson = currentIndex < sortedLessons.length - 1 ? sortedLessons[currentIndex + 1] : null

  // Default thumbnail for Lichess challenges
  const defaultThumbnail = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEyMCIgdmlld0JveD0iMCAwIDIwMCAxMjAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMTIwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xMDAgNDBMMTIwIDYwTDEwMCA4MEw4MCA2MEwxMDAgNDBaIiBmaWxsPSIjNjM2NkY3Ii8+Cjx0ZXh0IHg9IjEwMCIgeT0iMTAwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjNkI3MjgwIiBmb250LWZhbWlseT0ic2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZm9udC13ZWlnaHQ9IjUwMCI+Q2hlc3MgQ2hhbGxlbmdlPC90ZXh0Pgo8L3N2Zz4="

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 py-4 sm:py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Lesson Header */}
          <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
              {lesson.title}
            </h1>
            
            {/* Progress Indicators */}
            <div className="flex flex-wrap items-center gap-4 mb-4">
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${videoWatched ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="text-sm font-medium text-gray-700">
                  {videoWatched ? t('lesson.videoWatched', 'Video Watched') : t('lesson.videoNotWatched', 'Video Not Watched')}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${testPassed ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="text-sm font-medium text-gray-700">
                  {testPassed ? t('lesson.testPassed', 'Test Passed') : t('lesson.testNotPassed', 'Test Not Passed')}
                </span>
              </div>
            </div>

            {/* Description */}
            {lesson.description && (
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <h2 className="text-lg font-semibold text-gray-900 mb-2">
                  {t('lesson.descriptionTitle', 'Lesson Description')}
                </h2>
                <p className="text-gray-700 whitespace-pre-wrap">{lesson.description}</p>
              </div>
            )}
          </div>

          {/* Video Section */}
          {lesson.video_url && (
            <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-6 sm:mb-8">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">
                📹 {t('lesson.videoLesson', 'Video Lesson')}
              </h2>
              
              <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden mb-4">
                <iframe
                  src={lesson.video_url.replace('watch?v=', 'embed/').replace('youtu.be/', 'youtube.com/embed/')}
                  title={`Video Lesson - ${lesson.title}`}
                  className="w-full h-full"
                  allowFullScreen
                />
              </div>
              
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-0">
                <p className="text-sm text-gray-600">
                  {t('lesson.watchVideoDescription', 'Watch the video to learn the concepts')}
                </p>
                <button
                  onClick={handleMarkVideoWatched}
                  disabled={videoWatched || updating}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    videoWatched
                      ? 'bg-indigo-100 text-indigo-700 cursor-not-allowed'
                      : 'bg-indigo-600 text-white hover:bg-indigo-700'
                  }`}
                >
                  {updating ? t('lesson.updating', 'Updating...') : videoWatched ? t('lesson.videoWatched', 'Video Watched') : t('lesson.markVideoWatched', 'Mark Video Watched')}
                </button>
              </div>
            </div>
          )}

          {/* Primary Lichess Challenge Section */}
          <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-6 sm:mb-8">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">
              🎯 {t('lesson.lichessChallenge', 'Lichess Challenge')}
            </h2>
            
            {lesson.lichess_embed_url ? (
              <div>
                {/* Thumbnail with custom image or default */}
                <div 
                  className="w-64 h-40 bg-gray-100 rounded-lg overflow-hidden mb-4 relative cursor-pointer mx-auto"
                  onClick={() => window.open(lesson.lichess_embed_url, '_blank')}
                  style={{
                    backgroundImage: `url(${lesson.lichess_image_url || defaultThumbnail})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat'
                  }}
                >
                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                    <div className="text-center text-white">
                      <div className="w-16 h-16 mx-auto mb-4 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </div>
                      <div className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium">
                        {t('lesson.openInLichess', 'Open in Lichess')}
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Always show the direct link as well */}
                <div className="mb-4 p-3 bg-indigo-50 rounded-lg">
                  <p className="text-sm text-indigo-700 mb-2">
                    {t('lesson.lichessDirectLink', 'Direct link to challenge:')}
                  </p>
                  <a
                    href={lesson.lichess_embed_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-600 hover:text-indigo-800 underline text-sm break-all"
                  >
                    {lesson.lichess_embed_url}
                  </a>
                </div>
              </div>
            ) : (
              <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center mb-4">
                <p className="text-gray-500">{t('lesson.noChallengeAvailable', 'No challenge available')}</p>
              </div>
            )}

            {/* Test Passed Button */}
            <div className="flex justify-end">
              <button
                onClick={handleMarkTestPassed}
                disabled={testPassed || updating}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  testPassed
                    ? 'bg-indigo-100 text-indigo-700 cursor-not-allowed'
                    : 'bg-indigo-600 text-white hover:bg-indigo-700'
                }`}
              >
                {updating ? t('lesson.updating', 'Updating...') : testPassed ? t('lesson.testPassed', 'Test Passed') : t('lesson.markTestPassed', 'Mark Test Passed')}
              </button>
            </div>
          </div>

          {/* Second Lichess Challenge Section */}
          {lesson.lichess_embed_url_2 && (
            <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-6 sm:mb-8">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">
                🎯 {t('lesson.additionalChallenge', 'Additional Challenge')}
              </h2>
              
              <div>
                {/* Thumbnail with custom image or default */}
                <div 
                  className="w-64 h-40 bg-gray-100 rounded-lg overflow-hidden mb-4 relative cursor-pointer mx-auto"
                  onClick={() => window.open(lesson.lichess_embed_url_2, '_blank')}
                  style={{
                    backgroundImage: `url(${lesson.lichess_image_url_2 || defaultThumbnail})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat'
                  }}
                >
                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                    <div className="text-center text-white">
                      <div className="w-16 h-16 mx-auto mb-4 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </div>
                      <div className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium">
                        {t('lesson.openInLichess', 'Open in Lichess')}
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Always show the direct link as well */}
                <div className="mb-4 p-3 bg-indigo-50 rounded-lg">
                  <p className="text-sm text-indigo-700 mb-2">
                    {t('lesson.lichessDirectLink', 'Direct link to challenge:')}
                  </p>
                  <a
                    href={lesson.lichess_embed_url_2}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-600 hover:text-indigo-800 underline text-sm break-all"
                  >
                    {lesson.lichess_embed_url_2}
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* Complete Lesson Section */}
          <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 mt-6 sm:mt-8">
            <div className="text-center">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">
                {t('lesson.completeThisLesson', 'Complete This Lesson')}
              </h2>
              <p className="text-gray-600 mb-6">
                {t('lesson.completeDescription', 'Mark this lesson as complete when you have finished both the video and the challenge')}
              </p>
              <button
                onClick={handleMarkLessonComplete}
                disabled={isCompleted || updating}
                className={`px-6 py-3 rounded-lg text-base font-medium transition-colors ${
                  isCompleted
                    ? 'bg-indigo-100 text-indigo-700 cursor-not-allowed'
                    : 'bg-indigo-600 text-white hover:bg-indigo-700'
                }`}
              >
                {updating ? t('lesson.updating', 'Updating...') : isCompleted ? t('lesson.completed', 'Completed') : t('lesson.markLessonComplete', 'Mark Lesson Complete')}
              </button>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-8">
            <div className="flex-1">
              {previousLesson ? (
                <button
                  onClick={() => router.push(`/lessons/${previousLesson.id}`)}
                  className="flex items-center space-x-2 text-indigo-600 hover:text-indigo-800 font-medium"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  <span>{t('lesson.previousLesson', 'Previous Lesson')}</span>
                </button>
              ) : (
                <div></div>
              )}
            </div>
            
            <div className="flex-1 text-center">
              <button
                onClick={() => router.push(lesson ? `/levels/${lesson.level_id}` : '/courses')}
                className="text-gray-600 hover:text-gray-800 font-medium"
              >
                {t('lesson.backToCourses', 'Back to Courses')}
              </button>
            </div>
            
            <div className="flex-1 text-right">
              {nextLesson ? (
                <button
                  onClick={() => router.push(`/lessons/${nextLesson.id}`)}
                  className="flex items-center space-x-2 text-indigo-600 hover:text-indigo-800 font-medium ml-auto"
                >
                  <span>{t('lesson.nextLesson', 'Next Lesson')}</span>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              ) : (
                <div></div>
              )}
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}
