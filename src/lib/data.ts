import { supabase, type Level, type Lesson, type Progress, type Badge, type LevelGroup } from './supabaseClient'

// Re-export types for convenience
export type { Level, Lesson, Progress, Badge, LevelGroup }

// ========== Level Groups (new top-level category) ==========
export async function getLevelGroups(): Promise<LevelGroup[]> {
  try {
    const { data, error } = await supabase
      .from('level_groups')
      .select('*')
      .order('order_index')

    if (error) {
      console.error('Error fetching level groups:', error)
      return []
    }

    return data || []
  } catch (err) {
    console.error('Exception fetching level groups:', err)
    return []
  }
}

export async function createLevelGroup(payload: { title: string; description?: string; order_index?: number }): Promise<LevelGroup | null> {
  const { data, error } = await supabase
    .from('level_groups')
    .insert({
      title: payload.title,
      description: payload.description || '',
      order_index: payload.order_index ?? 0
    })
    .select('*')
    .single()

  if (error) {
    console.error('Error creating level group:', error)
    return null
  }
  return data
}

export async function updateLevelGroup(id: number, payload: Partial<Pick<LevelGroup, 'title' | 'description' | 'order_index'>>): Promise<LevelGroup | null> {
  const { data, error } = await supabase
    .from('level_groups')
    .update(payload)
    .eq('id', id)
    .select('*')
    .single()

  if (error) {
    console.error('Error updating level group:', error)
    return null
  }
  return data
}

export async function deleteLevelGroup(id: number): Promise<boolean> {
  const { error } = await supabase
    .from('level_groups')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting level group:', error)
    return false
  }
  return true
}

export async function getLevelsByGroup(groupId: number): Promise<Level[]> {
  try {
    const { data, error } = await supabase
      .from('levels')
      .select('*')
      .eq('level_group_id', groupId)
      .order('order_index')

    if (error) {
      console.error('Error fetching levels by group:', error)
      return []
    }
    return data || []
  } catch (err) {
    console.error('Exception fetching levels by group:', err)
    return []
  }
}

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
export async function getDashboardData(userId: string, groupId?: number): Promise<{
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
    // Load all levels; we'll filter by group locally to avoid extra network churn
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

    // Filter by group if provided
    const visibleLevels = groupId ? (levels as any[]).filter((l: any) => l.level_group_id === groupId) : levels

    // Process levels with progress
    const levelsWithProgress = visibleLevels.map((level, index) => {
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
      let isUnlocked = true
      if (index === 0) {
        isUnlocked = true
      } else {
        const prevLevel = visibleLevels[index - 1]
        const prevLevelLessons = lessonsData.filter(l => l.level_id === prevLevel.id)
        const prevCompleted = userProgress.filter(p =>
          prevLevelLessons.some(l => l.id === p.lesson_id) && p.video_watched && p.test_passed
        ).length
        isUnlocked = prevLevelLessons.length === 0 || prevCompleted === prevLevelLessons.length
      }

      return {
        ...level,
        progress,
        isUnlocked
      }
    })

    // Calculate overall progress across courses (average of per-course completion)
    const totalCourses = visibleLevels.length
    const completedCoursesFloat = levelsWithProgress.reduce((acc, l) => acc + (l.progress.progressPercentage / 100), 0)
    const overallProgress = {
      totalLessons: totalCourses, // repurpose to avoid wide changes
      completedLessons: completedCoursesFloat,
      progressPercentage: totalCourses > 0 ? (completedCoursesFloat / totalCourses) * 100 : 0
    }

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
export async function getCoursesData(userId: string, groupId?: number): Promise<{
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
      (async () => {
        if (groupId) return await getLevelsByGroup(groupId)
        return await getLevels()
      })(),
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
