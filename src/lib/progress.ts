import { supabase } from './supabaseClient'

export async function updateLessonProgress(
  userId: string,
  lessonId: number,
  videoWatched: boolean,
  testPassed: boolean
) {
  const { data, error } = await supabase
    .from('progress')
    .upsert({
      user_id: userId,
      lesson_id: lessonId,
      video_watched: videoWatched,
      test_passed: testPassed,
      completed_at: videoWatched && testPassed ? new Date().toISOString() : null
    }, {
      onConflict: 'user_id,lesson_id'
    })
    .select()

  if (error) {
    console.error('Error updating progress:', error)
    throw error
  }

  return data
}

export async function markVideoWatched(userId: string, lessonId: number) {
  // Get current progress
  const { data: currentProgress } = await supabase
    .from('progress')
    .select('*')
    .eq('user_id', userId)
    .eq('lesson_id', lessonId)
    .single()

  const testPassed = currentProgress?.test_passed || false

  return updateLessonProgress(userId, lessonId, true, testPassed)
}

export async function markTestPassed(userId: string, lessonId: number) {
  // Get current progress
  const { data: currentProgress } = await supabase
    .from('progress')
    .select('*')
    .eq('user_id', userId)
    .eq('lesson_id', lessonId)
    .single()

  const videoWatched = currentProgress?.video_watched || false

  return updateLessonProgress(userId, lessonId, videoWatched, true)
}

export async function markLessonComplete(userId: string, lessonId: number) {
  return updateLessonProgress(userId, lessonId, true, true)
}