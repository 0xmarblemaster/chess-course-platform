'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import type { Level, Lesson } from '@/lib/supabaseClient'
import AdminRoute from '@/components/AdminRoute'
import LevelForm from '@/components/LevelForm'
import LessonForm from '@/components/LessonForm'
import Link from 'next/link'

const AdminManage = () => {
  const [levels, setLevels] = useState<Level[]>([])
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [loading, setLoading] = useState(true)
  const [showLevelForm, setShowLevelForm] = useState(false)
  const [showLessonForm, setShowLessonForm] = useState(false)
  const [editingLevel, setEditingLevel] = useState<Level | undefined>()
  const [editingLesson, setEditingLesson] = useState<Lesson | undefined>()

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [levelsResult, lessonsResult] = await Promise.all([
          supabase.from('levels').select('*').order('order_index'),
          supabase.from('lessons').select('*').order('level_id, order_index')
        ])

        if (levelsResult.data) setLevels(levelsResult.data)
        if (lessonsResult.data) setLessons(lessonsResult.data)
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const refreshData = async () => {
    try {
      const [levelsResult, lessonsResult] = await Promise.all([
        supabase.from('levels').select('*').order('order_index'),
        supabase.from('lessons').select('*').order('level_id, order_index')
      ])

      if (levelsResult.data) setLevels(levelsResult.data)
      if (lessonsResult.data) setLessons(lessonsResult.data)
    } catch (error) {
      console.error('Error refreshing data:', error)
    }
  }

  const handleDeleteLevel = async (levelId: number) => {
    if (!confirm('Are you sure you want to delete this level? This will also delete all associated lessons.')) {
      return
    }

    try {
      // First delete all lessons in this level
      await supabase.from('lessons').delete().eq('level_id', levelId)
      
      // Then delete the level
      const { error } = await supabase.from('levels').delete().eq('id', levelId)
      
      if (error) throw error
      
      await refreshData()
    } catch (error) {
      console.error('Error deleting level:', error)
      alert('Error deleting level. Please try again.')
    }
  }

  const handleDeleteLesson = async (lessonId: number) => {
    if (!confirm('Are you sure you want to delete this lesson?')) {
      return
    }

    try {
      const { error } = await supabase.from('lessons').delete().eq('id', lessonId)
      
      if (error) throw error
      
      await refreshData()
    } catch (error) {
      console.error('Error deleting lesson:', error)
      alert('Error deleting lesson. Please try again.')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Manage Content</h1>
                <p className="mt-1 text-sm text-gray-500">
                  Manage courses, lessons, and educational content
                </p>
              </div>
              <Link
                href="/admin"
                className="bg-gray-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-700 transition-colors"
              >
                Back to Admin Dashboard
              </Link>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Courses Section */}
          <div className="bg-white shadow rounded-lg mb-8">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Courses ({levels.length})
                </h3>
                <button 
                  onClick={() => {
                    setEditingLevel(undefined)
                    setShowLevelForm(true)
                  }}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700 transition-colors"
                >
                  Add New Course
                </button>
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Title
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Description
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Video Link
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Puzzle Practice
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        PDF URL
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {levels.map((level) => (
                      <tr key={level.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {level.title}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {level.description}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {level.video_url ? (
                            <a href={level.video_url} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-900">
                              View Video
                            </a>
                          ) : (
                            <span className="text-gray-400">No Video</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {level.puzzle_practice_url ? (
                            <a href={level.puzzle_practice_url} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-900">
                              View Puzzle
                            </a>
                          ) : (
                            <span className="text-gray-400">No Puzzle</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {level.pdf_url ? (
                            <a href={level.pdf_url} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-900">
                              View PDF
                            </a>
                          ) : (
                            <span className="text-gray-400">No PDF</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button 
                            onClick={() => {
                              setEditingLevel(level)
                              setShowLevelForm(true)
                            }}
                            className="text-indigo-600 hover:text-indigo-900 mr-3"
                          >
                            Edit
                          </button>
                          <button 
                            onClick={() => handleDeleteLevel(level.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Lessons Section */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Lessons ({lessons.length})
                </h3>
                <button 
                  onClick={() => {
                    setEditingLesson(undefined)
                    setShowLessonForm(true)
                  }}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700 transition-colors"
                >
                  Add New Lesson
                </button>
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Course
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Lesson #
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Title
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Video URL
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Lichess URL
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {lessons.map((lesson) => {
                      const level = levels.find(l => l.id === lesson.level_id)
                      return (
                        <tr key={lesson.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {level?.title || `Course ${lesson.level_id}`}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            Lesson {lesson.order}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {lesson.title}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {lesson.video_url ? (
                              <a href={lesson.video_url} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-900">
                                View Video
                              </a>
                            ) : (
                              <span className="text-gray-400">No Video</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {lesson.lichess_embed_url ? (
                              <a href={lesson.lichess_embed_url} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-900">
                                View Challenge
                              </a>
                            ) : (
                              <span className="text-gray-400">No Challenge</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button 
                              onClick={() => {
                                setEditingLesson(lesson)
                                setShowLessonForm(true)
                              }}
                              className="text-indigo-600 hover:text-indigo-900 mr-3"
                            >
                              Edit
                            </button>
                            <button 
                              onClick={() => handleDeleteLesson(lesson.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Forms */}
        {showLevelForm && (
          <LevelForm
            level={editingLevel}
            onSuccess={() => {
              setShowLevelForm(false)
              setEditingLevel(undefined)
              refreshData()
            }}
            onCancel={() => {
              setShowLevelForm(false)
              setEditingLevel(undefined)
            }}
          />
        )}

        {showLessonForm && (
          <LessonForm
            lesson={editingLesson}
            levels={levels}
            onSuccess={() => {
              setShowLessonForm(false)
              setEditingLesson(undefined)
              refreshData()
            }}
            onCancel={() => {
              setShowLessonForm(false)
              setEditingLesson(undefined)
            }}
          />
        )}
      </div>
    </div>
  )
}

export default AdminManage