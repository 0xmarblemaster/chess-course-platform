'use client'
import LoadingScreen from "@/components/LoadingScreen"

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  HomeIcon,
  ChevronRightIcon,
  BookmarkIcon as BookmarkOutlineIcon,
  BookOpenIcon,
  ChevronLeftIcon,
  VideoCameraIcon,
  PuzzlePieceIcon
} from '@heroicons/react/24/outline'
import { BookmarkIcon as BookmarkSolidIcon, CheckCircleIcon } from '@heroicons/react/24/solid'
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
  const [showCelebration, setShowCelebration] = useState(false)
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [notesOpen, setNotesOpen] = useState(false)
  const [difficultyRating, setDifficultyRating] = useState<'easy' | 'medium' | 'hard' | null>(null)

  const lessonId = parseInt(params.lessonId as string)

  useEffect(() => {
    fetchLesson()
    fetchProgress()
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

  const fetchAllLessonsForLevel = async (levelId: number) => {
    try {
      const { data, error } = await supabase
        .from('lessons')
        .select('*')
        .eq('level_id', levelId)
        .order('order_index')

      if (error) throw error
      setAllLessons((data || []).sort((a, b) => {
        if ((a.order_index ?? 0) !== (b.order_index ?? 0)) {
          return (a.order_index ?? 0) - (b.order_index ?? 0)
        }
        return a.id - b.id
      }))
    } catch (err) {
      console.error('Error fetching lessons:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (lesson?.level_id) {
      setLoading(true)
      fetchAllLessonsForLevel(lesson.level_id)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lesson?.level_id])

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
        <LoadingScreen isVisible={true} />
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

  // Previous/Next navigation within the same level, ordered by admin-defined order_index
  const sortedLessons = [...allLessons].sort((a, b) => {
    if ((a.order_index ?? 0) !== (b.order_index ?? 0)) {
      return (a.order_index ?? 0) - (b.order_index ?? 0)
    }
    return a.id - b.id
  })
  
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
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-6 sm:mb-8"
          >
            {/* Breadcrumb */}
            <nav className="flex items-center space-x-2 text-sm text-gray-600 mb-4" aria-label="Breadcrumb">
              <Link
                href="/dashboard"
                className="flex items-center hover:text-indigo-600 transition-colors"
                aria-label="Go to dashboard"
              >
                <HomeIcon className="w-4 h-4" />
              </Link>
              <ChevronRightIcon className="w-4 h-4 text-gray-400" />
              <Link
                href={`/levels/${lesson.level_id}`}
                className="hover:text-indigo-600 transition-colors"
              >
                {t('breadcrumb.level', 'Level')}
              </Link>
              <ChevronRightIcon className="w-4 h-4 text-gray-400" />
              <span className="text-gray-900 font-medium">{lesson.title}</span>
            </nav>

            {/* Title and actions */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                  {lesson.title}
                </h1>
              </div>
              <div className="flex items-center gap-2 ml-4">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setIsBookmarked(!isBookmarked)}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                  aria-label={isBookmarked ? 'Remove bookmark' : 'Add bookmark'}
                >
                  {isBookmarked ? (
                    <BookmarkSolidIcon className="w-6 h-6 text-indigo-600" />
                  ) : (
                    <BookmarkOutlineIcon className="w-6 h-6 text-gray-400" />
                  )}
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setNotesOpen(!notesOpen)}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors"
                  aria-label="Open notes panel"
                >
                  <BookOpenIcon className="w-5 h-5" />
                  <span className="hidden sm:inline">{t('lesson.notes', 'Notes')}</span>
                </motion.button>
              </div>
            </div>

            {/* Progress Indicators */}
            <div className="flex flex-wrap items-center gap-4 mt-2">
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
              <div className="bg-gray-50 rounded-lg p-4 mt-4">
                <h2 className="text-lg font-semibold text-gray-900 mb-2">
                  {t('lesson.descriptionTitle', 'Lesson Description')}
                </h2>
                <p className="text-gray-700 whitespace-pre-wrap">{lesson.description}</p>
              </div>
            )}
          </motion.div>

          {/* Video Section */}
          {lesson.video_url && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-6 sm:mb-8"
            >
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <VideoCameraIcon className="w-6 h-6 text-indigo-600" />
                {t('lesson.video', 'Video')}
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
            </motion.div>
          )}

          {/* Primary Lichess Challenge Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-6 sm:mb-8"
          >
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <PuzzlePieceIcon className="w-6 h-6 text-indigo-600" />
              {t('lesson.lichessChallenge', 'Lichess Challenge')}
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
                
                {/* Challenge Description */}
                {lesson.lichess_description && (
                  <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-700">
                      {lesson.lichess_description}
                    </p>
                  </div>
                )}
                
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
          </motion.div>

          {/* Second Lichess Challenge Section */}
          {lesson.lichess_embed_url_2 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-6 sm:mb-8"
            >
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <PuzzlePieceIcon className="w-6 h-6 text-indigo-600" />
                {t('lesson.additionalChallenge', 'Additional Challenge')}
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
                
                {/* Challenge Description */}
                {lesson.lichess_description_2 && (
                  <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-700">
                      {lesson.lichess_description_2}
                    </p>
                  </div>
                )}
                
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
            </motion.div>
          )}

          {/* Difficulty Rating */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-6 sm:mb-8"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">
              {t('lesson.howWasLesson', 'How was this lesson?')}
            </h3>
            <div className="flex flex-col sm:flex-row gap-3 justify-center items-stretch sm:items-center">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setDifficultyRating('easy')}
                className={`flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium transition-all min-h-[44px] ${
                  difficultyRating === 'easy'
                    ? 'bg-green-500 text-white shadow-lg scale-105'
                    : 'bg-gray-100 text-gray-700 hover:bg-green-50 hover:text-green-700'
                }`}
                aria-label="Rate lesson as too easy"
              >
                <span className="text-2xl mr-2">😄</span>
                {t('lesson.tooEasy', 'Too Easy')}
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setDifficultyRating('medium')}
                className={`flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium transition-all min-h-[44px] ${
                  difficultyRating === 'medium'
                    ? 'bg-indigo-500 text-white shadow-lg scale-105'
                    : 'bg-gray-100 text-gray-700 hover:bg-indigo-50 hover:text-indigo-700'
                }`}
                aria-label="Rate lesson as just right"
              >
                <span className="text-2xl mr-2">🙂</span>
                {t('lesson.justRight', 'Just Right')}
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setDifficultyRating('hard')}
                className={`flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium transition-all min-h-[44px] ${
                  difficultyRating === 'hard'
                    ? 'bg-orange-500 text-white shadow-lg scale-105'
                    : 'bg-gray-100 text-gray-700 hover:bg-orange-50 hover:text-orange-700'
                }`}
                aria-label="Rate lesson as too hard"
              >
                <span className="text-2xl mr-2">😅</span>
                {t('lesson.tooHard', 'Too Hard')}
              </motion.button>
            </div>
            {difficultyRating && (
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center text-sm text-gray-600 mt-4"
              >
                {t('lesson.thanksFeedback', 'Thanks for your feedback!')}
              </motion.p>
            )}
          </motion.div>

          {/* Complete Lesson Section */}
          <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 mt-6 sm:mt-8">
            <div className="text-center">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">
                {t('lesson.completeThisLesson', 'Complete This Lesson')}
              </h2>
              <p className="text-gray-600 mb-6">
                {t('lesson.completeDescription', 'Mark this lesson as complete when you have finished both the video and the challenge')}
              </p>
              <motion.button
                whileHover={{
                  scale: 1.05,
                  boxShadow: '0 10px 25px rgba(99, 102, 241, 0.3)'
                }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setShowCelebration(true)
                  setTimeout(() => setShowCelebration(false), 3000)
                  handleMarkLessonComplete()
                }}
                disabled={isCompleted || updating}
                className={`px-8 py-4 rounded-xl text-base font-semibold transition-all shadow-lg min-h-[44px] ${
                  isCompleted
                    ? 'bg-green-500 text-white cursor-not-allowed'
                    : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700'
                }`}
                aria-label={isCompleted ? 'Lesson completed' : 'Mark lesson as complete'}
              >
                {isCompleted && <CheckCircleIcon className="w-5 h-5 inline mr-2" />}
                {isCompleted
                  ? t('lesson.completed', 'Completed')
                  : t('lesson.completeLesson', 'Complete Lesson')}
              </motion.button>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-stretch sm:items-center mt-8">
            {previousLesson ? (
              <motion.div whileHover={{ x: -5 }} className="flex-1">
                <Link
                  href={`/lessons/${previousLesson.id}`}
                  className="flex items-center gap-2 px-6 py-4 bg-gray-100 hover:bg-gray-200 rounded-lg transition-all"
                >
                  <ChevronLeftIcon className="w-5 h-5 text-gray-600" />
                  <div className="flex-1 text-left">
                    <div className="text-xs text-gray-500 mb-1">
                      {t('lesson.previous', 'Previous')}
                    </div>
                    <div className="font-medium text-gray-900 line-clamp-1">
                      {previousLesson.title}
                    </div>
                  </div>
                </Link>
              </motion.div>
            ) : (
              <div className="flex-1" />
            )}

            <div className="flex-1 text-center">
              <Link
                href={lesson ? `/levels/${lesson.level_id}` : '/courses'}
                className="inline-block px-6 py-4 text-gray-600 hover:text-gray-800 font-medium"
              >
                {t('lesson.backToCourses', 'Back to Courses')}
              </Link>
            </div>

            {nextLesson ? (
              <motion.div whileHover={{ x: 5 }} className="flex-1">
                <Link
                  href={`/lessons/${nextLesson.id}`}
                  className="flex items-center gap-2 px-6 py-4 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-all justify-end"
                >
                  <div className="flex-1 text-right">
                    <div className="text-xs text-indigo-600 mb-1">
                      {t('lesson.next', 'Next')}
                    </div>
                    <div className="font-medium text-gray-900 line-clamp-1">
                      {nextLesson.title}
                    </div>
                  </div>
                  <ChevronRightIcon className="w-5 h-5 text-indigo-600" />
                </Link>
              </motion.div>
            ) : (
              <div className="flex-1" />
            )}
          </div>
        </div>
      </div>

      {/* Celebration Modal */}
      <AnimatePresence>
        {showCelebration && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 z-40"
              onClick={() => setShowCelebration(false)}
              aria-hidden="true"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.5, y: 50 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.5, y: 50 }}
              transition={{ type: 'spring', duration: 0.5 }}
              className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 bg-white rounded-2xl shadow-2xl p-8 text-center max-w-md mx-4"
              role="dialog"
              aria-labelledby="celebration-title"
            >
              <motion.div
                animate={{ rotate: [0, 10, -10, 10, -10, 0], scale: [1, 1.2, 1.2, 1.2, 1.2, 1] }}
                transition={{ duration: 0.6 }}
                className="text-6xl mb-4"
                aria-hidden="true"
              >
                🎉
              </motion.div>
              <h3 id="celebration-title" className="text-2xl font-bold text-gray-900 mb-2">
                {t('lesson.greatJob', 'Great Job!')}
              </h3>
              <p className="text-gray-600 mb-6">
                {t('lesson.lessonComplete', "You've completed this lesson!")}
              </p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowCelebration(false)}
                className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
              >
                {t('lesson.continue', 'Continue')}
              </motion.button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Notes Sliding Panel */}
      <AnimatePresence>
        {notesOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 z-40"
              onClick={() => setNotesOpen(false)}
              aria-hidden="true"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 h-full w-full sm:w-96 bg-white shadow-2xl z-50 overflow-y-auto"
              role="dialog"
              aria-labelledby="notes-title"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 id="notes-title" className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <BookOpenIcon className="w-6 h-6 text-indigo-600" />
                    {t('lesson.myNotes', 'My Notes')}
                  </h3>
                  <motion.button
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setNotesOpen(false)}
                    className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                    aria-label="Close notes panel"
                  >
                    <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </motion.button>
                </div>
                <div className="space-y-4">
                  <textarea
                    className="w-full h-64 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                    placeholder={t('lesson.writeNotes', 'Write your notes here...')}
                    aria-label="Lesson notes textarea"
                  />
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full px-4 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors shadow-md"
                  >
                    {t('lesson.saveNotes', 'Save Notes')}
                  </motion.button>
                  <div className="mt-8">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">
                      {t('lesson.previousNotes', 'Previous Notes')}
                    </h4>
                    <div className="space-y-2">
                      <div className="p-3 bg-gray-50 rounded-lg text-sm text-gray-600 italic">
                        {t('lesson.noNotes', 'No notes yet for this lesson')}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </ProtectedRoute>
  )
}
