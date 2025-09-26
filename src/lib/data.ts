import { supabase, type Level, type Lesson, type Progress, type Badge } from './supabaseClient'

// Re-export types for convenience
export type { Level, Lesson, Progress, Badge }

export async function getLevels(): Promise<Level[]> {
  try {
    console.log('Fetching levels...')
    const { data, error } = await supabase
      .from('levels')
      .select('*')
      .order('order_index')

    if (error) {
      console.error('Error fetching levels:', error)
      return []
    }

    console.log('Levels fetched successfully:', data)
    return data || []
  } catch (err) {
    console.error('Exception fetching levels:', err)
    return []
  }
}

export async function getLessonsForLevel(levelId: number): Promise<Lesson[]> {
  const { data, error } = await supabase
    .from('lessons')
    .select('*')
    .eq('level_id', levelId)
    .order('order_index')

  if (error) {
    console.error('Error fetching lessons:', error)
    return []
  }

  return data || []
}

export async function getUserProgress(userId: string): Promise<Progress[]> {
  const { data, error } = await supabase
    .from('progress')
    .select('*')
    .eq('user_id', userId)

  if (error) {
    console.error('Error fetching progress:', error)
    return []
  }

  return data || []
}

export async function getUserBadges(userId: string): Promise<Badge[]> {
  try {
    console.log('Fetching badges for user:', userId)
    const { data, error } = await supabase
      .from('badges')
      .select('*')
      .eq('user_id', userId)

    if (error) {
      console.error('Error fetching badges:', error)
      return []
    }

    return data || []
  } catch (err) {
    console.error('Exception fetching badges:', err)
    return []
  }
}

export async function getLevelProgress(userId: string, levelId: number): Promise<{
  totalLessons: number
  completedLessons: number
  progressPercentage: number
}> {
  const lessons = await getLessonsForLevel(levelId)
  const progress = await getUserProgress(userId)
  
  const totalLessons = lessons.length
  const completedLessons = progress.filter(p => 
    lessons.some(l => l.id === p.lesson_id) && 
    p.video_watched && 
    p.test_passed
  ).length
  
  const progressPercentage = totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0
  
  return {
    totalLessons,
    completedLessons,
    progressPercentage
  }
}

export async function getOverallProgress(userId: string): Promise<{
  totalLessons: number
  completedLessons: number
  progressPercentage: number
}> {
  const levels = await getLevels()
  const progress = await getUserProgress(userId)
  
  let totalLessons = 0
  let completedLessons = 0
  
  for (const level of levels) {
    const lessons = await getLessonsForLevel(level.id)
    totalLessons += lessons.length
    
    const levelCompletedLessons = progress.filter(p => 
      lessons.some(l => l.id === p.lesson_id) && 
      p.video_watched && 
      p.test_passed
    ).length
    
    completedLessons += levelCompletedLessons
  }
  
  const progressPercentage = totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0
  
  return {
    totalLessons,
    completedLessons,
    progressPercentage
  }
}