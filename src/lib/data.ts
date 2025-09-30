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
// Optimized function to get all dashboard data in parallel
export async function getDashboardData(userId: string): Promise<{
  levels: Level[]
  badges: Badge[]
  overallProgress: {
    totalLessons: number
    completedLessons: number
    progressPercentage: number
  }
  levelsWithProgress: Array<Level & {
    progress: {
      totalLessons: number
      completedLessons: number
      progressPercentage: number
    }
    isUnlocked: boolean
  }>
}> {
  try {
    console.log('Fetching dashboard data in parallel...')
    
    // Make all API calls in parallel
    const [levels, badges, userProgress, lessonsData] = await Promise.all([
      getLevels(),
      getUserBadges(userId),
      getUserProgress(userId),
      // Get all lessons for all levels in parallel
      supabase
        .from('lessons')
        .select('*')
        .order('level_id, order_index')
        .then(({ data, error }) => {
          if (error) throw error
          return data || []
        })
    ])

    // Calculate overall progress
    const totalLessons = lessonsData.length
    const completedLessons = userProgress.filter(p => 
      p.video_watched && p.test_passed
    ).length
    const overallProgress = {
      totalLessons,
      completedLessons,
      progressPercentage: totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0
    }

    // Process levels with progress
    const levelsWithProgress = levels.map((level, index) => {
      const levelLessons = lessonsData.filter(l => l.level_id === level.id)
      const levelCompletedLessons = userProgress.filter(p => 
        levelLessons.some(l => l.id === p.lesson_id) && 
        p.video_watched && 
        p.test_passed
      ).length
      
      const progress = {
        totalLessons: levelLessons.length,
        completedLessons: levelCompletedLessons,
        progressPercentage: levelLessons.length > 0 ? (levelCompletedLessons / levelLessons.length) * 100 : 0
      }

      // Check if previous level is completed (for unlocking logic)
      const isUnlocked = index === 0 || (index > 0 && levels[index - 1] && 
        userProgress.some(p => 
          levelLessons.some(l => l.id === p.lesson_id) && 
          p.video_watched && p.test_passed
        ))

      return {
        ...level,
        progress,
        isUnlocked
      }
    })

    console.log('Dashboard data fetched successfully')
    return {
      levels,
      badges,
      overallProgress,
      levelsWithProgress
    }
  } catch (error) {
    console.error('Error fetching dashboard data:', error)
    throw error
  }
}

// Optimized function to get courses page data
export async function getCoursesData(userId: string): Promise<{
  lessons: Lesson[]
  levelProgress: {
    totalLessons: number
    completedLessons: number
    progressPercentage: number
  }
  lessonsWithProgress: Array<Lesson & {
    progress: Progress | null
    isCompleted: boolean
  }>
}> {
  try {
    console.log('Fetching courses data in parallel...')
    
    // Get first level and all data in parallel
    const [levels, userProgress, lessonsData] = await Promise.all([
      getLevels(),
      getUserProgress(userId),
      supabase
        .from('lessons')
        .select('*')
        .order('level_id, order_index')
        .then(({ data, error }) => {
          if (error) throw error
          return data || []
        })
    ])

    if (levels.length === 0) {
      throw new Error('No courses available')
    }

    const firstLevel = levels[0]
    const levelLessons = lessonsData.filter(l => l.level_id === firstLevel.id)
    
    // Calculate level progress
    const completedLessons = userProgress.filter(p => 
      levelLessons.some(l => l.id === p.lesson_id) && 
      p.video_watched && 
      p.test_passed
    ).length
    
    const levelProgress = {
      totalLessons: levelLessons.length,
      completedLessons,
      progressPercentage: levelLessons.length > 0 ? (completedLessons / levelLessons.length) * 100 : 0
    }

    // Map lessons with progress
    const lessonsWithProgress = levelLessons.map(lesson => {
      const lessonProgress = userProgress.find(p => p.lesson_id === lesson.id) || null
      return {
        ...lesson,
        progress: lessonProgress,
        isCompleted: lessonProgress ? lessonProgress.video_watched && lessonProgress.test_passed : false
      }
    })

    console.log('Courses data fetched successfully')
    return {
      lessons: levelLessons,
      levelProgress,
      lessonsWithProgress
    }
  } catch (error) {
    console.error('Error fetching courses data:', error)
    throw error
  }
}
