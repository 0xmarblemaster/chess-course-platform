'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useLanguage } from '@/contexts/LanguageContext'
import Link from 'next/link'

export default function Home() {
  const { user } = useAuth()
  const { t } = useLanguage()

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="text-center">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold text-gray-900 mb-6">
            {t('home.title', 'Master Chess with Interactive Lessons')}
          </h1>
          <p className="text-lg sm:text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            {t('home.subtitle', 'Learn chess from beginner to advanced with our structured course, interactive challenges, and progress tracking.')}
          </p>
          {!user && (
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/signup"
                className="bg-indigo-600 text-white px-8 py-3 rounded-lg text-lg font-medium hover:bg-indigo-700 transition-colors"
              >
                {t('home.startLearning', 'Start Learning Free')}
              </Link>
              <Link
                href="/login"
                className="border border-indigo-600 text-indigo-600 px-8 py-3 rounded-lg text-lg font-medium hover:bg-indigo-50 transition-colors"
              >
                {t('home.signIn', 'Sign In')}
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Course Overview */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-16">
        <div className="text-center mb-8 sm:mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
            {t('home.structuredLearning', 'Structured Learning Path')}
          </h2>
          <p className="text-lg text-gray-600">
            {t('home.progressDescription', 'Progress through 3 comprehensive levels with 30+ lessons each')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Level 1 */}
          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🌱</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">{t('home.beginnerLevel', 'Beginner Level')}</h3>
              <p className="text-gray-600 mb-4">
                {t('home.beginnerDescription', 'Learn the basics: piece movement, basic tactics, and opening principles.')}
              </p>
              <ul className="text-sm text-gray-500 space-y-1">
                <li>{t('home.videoLessonsFeature', '• 30+ video lessons')}</li>
                <li>{t('home.interactiveFeature', '• Interactive challenges')}</li>
                <li>{t('home.downloadableFeature', '• Downloadable PDF')}</li>
              </ul>
            </div>
          </div>

          {/* Level 2 */}
          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className="text-center">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">⚡</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">{t('home.intermediateLevel', 'Intermediate Level')}</h3>
              <p className="text-gray-600 mb-4">
                {t('home.intermediateDescription', 'Advance your skills with complex tactics and positional play.')}
              </p>
              <ul className="text-sm text-gray-500 space-y-1">
                <li>{t('home.advancedTactics', '• Advanced tactics')}</li>
                <li>{t('home.positionalConcepts', '• Positional concepts')}</li>
                <li>{t('home.endgamePatterns', '• Endgame patterns')}</li>
              </ul>
            </div>
          </div>

          {/* Level 3 */}
          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">👑</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">{t('home.advancedLevel', 'Advanced Level')}</h3>
              <p className="text-gray-600 mb-4">
                {t('home.advancedDescription', 'Master advanced strategies and tournament preparation.')}
              </p>
              <ul className="text-sm text-gray-500 space-y-1">
                <li>{t('home.complexEndgames', '• Complex endgames')}</li>
                <li>{t('home.strategicPlanning', '• Strategic planning')}</li>
                <li>{t('home.gameAnalysis', '• Game analysis')}</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              {t('home.whyChoose', 'Why Choose Our Platform?')}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📹</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('home.videoLessons', 'Video Lessons')}</h3>
              <p className="text-gray-600 text-sm">
                {t('home.videoDescription', 'High-quality video content with expert instruction')}
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🎯</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('home.interactiveChallenges', 'Interactive Challenges')}</h3>
              <p className="text-gray-600 text-sm">
                {t('home.challengesDescription', 'Practice with Lichess-integrated puzzles and games')}
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📊</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('home.progressTracking', 'Progress Tracking')}</h3>
              <p className="text-gray-600 text-sm">
                {t('home.trackingDescription', 'Monitor your learning journey with detailed analytics')}
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🏆</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('home.achievementBadges', 'Achievement Badges')}</h3>
              <p className="text-gray-600 text-sm">
                {t('home.badgesDescription', 'Earn badges as you complete levels and milestones')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      {!user && (
        <div className="bg-indigo-600 py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold text-white mb-4">
              {t('home.readyToStart', 'Ready to Start Your Chess Journey?')}
            </h2>
            <p className="text-xl text-indigo-100 mb-8">
              {t('home.joinThousands', 'Join thousands of students learning chess with our structured approach')}
            </p>
            <Link
              href="/signup"
              className="bg-white text-indigo-600 px-8 py-3 rounded-lg text-lg font-medium hover:bg-gray-100 transition-colors"
            >
              {t('home.getStartedFree', 'Get Started Free')}
            </Link>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-gray-400">
            {t('home.copyright', '© 2024 Chess Empire. All rights reserved.')}
          </p>
        </div>
      </footer>
    </div>
  )
}