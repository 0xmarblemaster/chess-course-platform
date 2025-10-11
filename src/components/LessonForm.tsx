'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import type { Lesson, Level } from '@/lib/supabaseClient'

interface LessonDataUpdate {
  title: string
  level_id: number
  order_index: number
  video_url: string | null
  lichess_embed_url: string | null
  lichess_embed_url_2?: string | null
  lichess_image_url?: string | null
  lichess_image_url_2?: string | null
  description?: string | null
  lichess_description?: string | null
  lichess_description_2?: string | null
}

interface LessonFormProps {
  lesson?: Lesson
  levels: Level[]
  onSuccess: () => void
  onCancel: () => void
}

export default function LessonForm({ lesson, levels, onSuccess, onCancel }: LessonFormProps) {
  const [formData, setFormData] = useState({
    title: lesson?.title || '',
    description: lesson?.description || '',
    level_id: lesson?.level_id || (levels.length > 0 ? levels[0].id : 1),
    order_index: (lesson?.order_index ?? 1) as number | null,
    video_url: lesson?.video_url || '',
    lichess_embed_url: lesson?.lichess_embed_url || '',
    lichess_embed_url_2: lesson?.lichess_embed_url_2 || '',
    lichess_image_url: lesson?.lichess_image_url || '',
    lichess_image_url_2: lesson?.lichess_image_url_2 || '',
    lichess_description: lesson?.lichess_description || '',
    lichess_description_2: lesson?.lichess_description_2 || ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [uploadingImage1, setUploadingImage1] = useState(false)
  const [uploadingImage2, setUploadingImage2] = useState(false)

  console.log('LessonForm - Initialized with:', { lesson, levels, formData })

  // Update level_id when levels change or when creating a new lesson
  useEffect(() => {
    if (!lesson && levels.length > 0) {
      setFormData(prev => ({
        ...prev,
        level_id: levels[0].id
      }))
    }
  }, [levels, lesson])

  const handleImageUpload = async (file: File, imageField: 'lichess_image_url' | 'lichess_image_url_2') => {
    if (!file) return

    const fileExt = file.name.split('.').pop()
    const fileName = `${Math.random()}.${fileExt}`
    const filePath = `lesson-images/${fileName}`

    try {
      if (imageField === 'lichess_image_url') {
        setUploadingImage1(true)
      } else {
        setUploadingImage2(true)
      }

      const { error: uploadError } = await supabase.storage
        .from('lesson-images')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data } = supabase.storage
        .from('lesson-images')
        .getPublicUrl(filePath)

      setFormData(prev => ({
        ...prev,
        [imageField]: data.publicUrl
      }))
    } catch (error) {
      console.error('Error uploading image:', error)
      setError('Failed to upload image')
    } finally {
      setUploadingImage1(false)
      setUploadingImage2(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Build payload, explicitly nulling cleared optional fields so deletes are saved
      const safeOrderIndex = typeof formData.order_index === 'number' && formData.order_index >= 1 ? formData.order_index : 1
      const lessonData: LessonDataUpdate = {
        title: formData.title,
        level_id: formData.level_id,
        order_index: safeOrderIndex,
        video_url: formData.video_url?.trim() ? formData.video_url : null,
        lichess_embed_url: formData.lichess_embed_url?.trim() ? formData.lichess_embed_url : null,
        description: formData.description?.trim() ? formData.description : null,
        lichess_description: formData.lichess_description?.trim() ? formData.lichess_description : null,
        lichess_description_2: formData.lichess_description_2?.trim() ? formData.lichess_description_2 : null,
        lichess_embed_url_2: formData.lichess_embed_url_2?.trim() ? formData.lichess_embed_url_2 : null,
        lichess_image_url: formData.lichess_image_url?.trim() ? formData.lichess_image_url : null,
        lichess_image_url_2: formData.lichess_image_url_2?.trim() ? formData.lichess_image_url_2 : null
      }

      console.log('Saving lesson data:', lessonData)

      if (lesson) {
        // Update existing lesson
        const { error } = await supabase
          .from('lessons')
          .update(lessonData)
          .eq('id', lesson.id)

        if (error) throw error
      } else {
        // Create new lesson
        const { error } = await supabase
          .from('lessons')
          .insert(lessonData)

        if (error) throw error
      }

      onSuccess()
    } catch (error) {
      console.error('Error saving lesson:', error)
      console.error('Error details:', JSON.stringify(error, null, 2))
      
      // Show more specific error message
      let errorMessage = 'Failed to save lesson'
      if (error && typeof error === 'object' && 'message' in error) {
        errorMessage = `Failed to save lesson: ${error.message}`
      } else if (error && typeof error === 'string') {
        errorMessage = `Failed to save lesson: ${error}`
      }
      
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={onCancel}>
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            {lesson ? 'Edit Lesson' : 'Create New Lesson'}
          </h2>

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
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                rows={3}
                placeholder="Brief description of what this lesson covers..."
              />
              <p className="text-xs text-gray-500 mt-1">
                Optional description of the lesson content and objectives
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Lesson Number
              </label>
              <input
                type="number"
                required
                min="1"
                value={formData.order_index ?? ''}
                onChange={(e) => {
                  const v = e.target.value
                  if (v === '') {
                    setFormData({ ...formData, order_index: null })
                  } else {
                    const parsed = parseInt(v, 10)
                    setFormData({ ...formData, order_index: Number.isNaN(parsed) ? null : parsed })
                  }
                }}
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
                Lichess Challenge URL (Primary)
              </label>
              <input
                type="url"
                value={formData.lichess_embed_url}
                onChange={(e) => setFormData({ ...formData, lichess_embed_url: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="https://lichess.org/training/CHALLENGE_ID or https://lichess.org/study/STUDY_ID"
              />
              <p className="text-xs text-gray-500 mt-1">
                Main Lichess training puzzle, study, or game analysis URL
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Primary Challenge Description
              </label>
              <textarea
                value={formData.lichess_description}
                onChange={(e) => setFormData({ ...formData, lichess_description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                rows={2}
                placeholder="Optional description of what this challenge covers..."
              />
              <p className="text-xs text-gray-500 mt-1">
                Optional description explaining the primary Lichess challenge
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Primary Challenge Thumbnail
              </label>
              <div className="flex items-center space-x-4">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleImageUpload(file, 'lichess_image_url')
                  }}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  disabled={uploadingImage1}
                />
                {formData.lichess_image_url && (
                  <img
                    src={formData.lichess_image_url}
                    alt="Primary challenge thumbnail"
                    className="w-16 h-16 object-cover rounded border"
                  />
                )}
                {uploadingImage1 && (
                  <div className="text-sm text-gray-500">Uploading...</div>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Optional thumbnail image for the primary Lichess challenge
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Lichess Challenge URL (Secondary)
              </label>
              <input
                type="url"
                value={formData.lichess_embed_url_2}
                onChange={(e) => setFormData({ ...formData, lichess_embed_url_2: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="https://lichess.org/training/CHALLENGE_ID or https://lichess.org/study/STUDY_ID"
              />
              <p className="text-xs text-gray-500 mt-1">
                Optional additional Lichess challenge for extra practice
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Secondary Challenge Description
              </label>
              <textarea
                value={formData.lichess_description_2}
                onChange={(e) => setFormData({ ...formData, lichess_description_2: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                rows={2}
                placeholder="Optional description of what this challenge covers..."
              />
              <p className="text-xs text-gray-500 mt-1">
                Optional description explaining the secondary Lichess challenge
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Secondary Challenge Thumbnail
              </label>
              <div className="flex items-center space-x-4">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleImageUpload(file, 'lichess_image_url_2')
                  }}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  disabled={uploadingImage2}
                />
                {formData.lichess_image_url_2 && (
                  <img
                    src={formData.lichess_image_url_2}
                    alt="Secondary challenge thumbnail"
                    className="w-16 h-16 object-cover rounded border"
                  />
                )}
                {uploadingImage2 && (
                  <div className="text-sm text-gray-500">Uploading...</div>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Optional thumbnail image for the secondary Lichess challenge
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
