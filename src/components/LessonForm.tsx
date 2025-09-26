'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import type { Lesson, Level } from '@/lib/supabaseClient'

interface LessonFormProps {
  lesson?: Lesson
  levels: Level[]
  onSuccess: () => void
  onCancel: () => void
}

export default function LessonForm({ lesson, levels, onSuccess, onCancel }: LessonFormProps) {
  const [formData, setFormData] = useState({
    title: lesson?.title || '',
    level_id: lesson?.level_id || 1,
    order_index: lesson?.order_index || 1,
    video_url: lesson?.video_url || '',
    lichess_embed_url: lesson?.lichess_embed_url || ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  console.log('LessonForm - Initialized with:', { lesson, levels, formData })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      console.log('LessonForm - Submitting form data:', formData)
      
      if (lesson) {
        // Update existing lesson
        console.log('LessonForm - Updating existing lesson:', lesson.id)
        const { error } = await supabase
          .from('lessons')
          .update(formData)
          .eq('id', lesson.id)

        if (error) {
          console.error('LessonForm - Update error:', error)
          throw error
        }
      } else {
        // Create new lesson
        console.log('LessonForm - Creating new lesson with data:', formData)
        const { data, error } = await supabase
          .from('lessons')
          .insert([formData])
          .select()

        if (error) {
          console.error('LessonForm - Insert error:', error)
          console.error('LessonForm - Error details:', JSON.stringify(error, null, 2))
          throw error
        }
        
        console.log('LessonForm - Insert successful:', data)
      }

      onSuccess()
    } catch (err: unknown) {
      console.error('LessonForm - Exception:', err)
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            {lesson ? 'Edit Lesson' : 'Add New Lesson to Course'}
          </h3>
          
          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="e.g., Introduction to Chess"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Course
                </label>
                <select
                  required
                  value={formData.level_id}
                  onChange={(e) => setFormData({ ...formData, level_id: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {levels.map((level) => (
                    <option key={level.id} value={level.id}>
                      {level.title}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Select which course this lesson belongs to
                </p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Lesson Number
              </label>
              <input
                type="number"
                required
                min="1"
                value={formData.order_index}
                onChange={(e) => setFormData({ ...formData, order_index: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="1, 2, 3, etc."
              />
              <p className="text-xs text-gray-500 mt-1">
                The order this lesson appears within the course (1 = first lesson, 2 = second lesson, etc.)
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                YouTube Video URL
              </label>
              <input
                type="url"
                value={formData.video_url}
                onChange={(e) => setFormData({ ...formData, video_url: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="https://www.youtube.com/watch?v=VIDEO_ID or https://youtu.be/VIDEO_ID"
              />
              <p className="text-xs text-gray-500 mt-1">
                Supports YouTube watch URLs (youtube.com/watch?v=) or short URLs (youtu.be/)
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Lichess Challenge URL
              </label>
              <input
                type="url"
                value={formData.lichess_embed_url}
                onChange={(e) => setFormData({ ...formData, lichess_embed_url: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="https://lichess.org/training/CHALLENGE_ID or https://lichess.org/study/STUDY_ID"
              />
              <p className="text-xs text-gray-500 mt-1">
                Supports Lichess training puzzles, studies, or game analysis URLs
              </p>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md disabled:opacity-50"
              >
                {loading ? 'Saving...' : (lesson ? 'Update' : 'Create')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}