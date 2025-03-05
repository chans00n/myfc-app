import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Database } from '@/types/database'
import { useAuth } from '@/components/providers/auth-provider'

type Achievement = Database['public']['Tables']['achievements']['Row']
type UserAchievement = Database['public']['Tables']['user_achievements']['Row'] & {
  achievements: Achievement
}

export function useAchievements() {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [userAchievements, setUserAchievements] = useState<UserAchievement[]>([])
  const { user } = useAuth()
  const supabase = createClientComponentClient<Database>()

  // Fetch all achievements and user achievements
  const fetchAchievements = async () => {
    if (!user) return

    setIsLoading(true)
    setError(null)

    try {
      // Fetch all achievements
      const { data: achievementsData, error: achievementsError } = await supabase
        .from('achievements')
        .select('*')
        .order('points', { ascending: false })

      if (achievementsError) throw achievementsError

      // Fetch user achievements
      const { data: userAchievementsData, error: userAchievementsError } = await supabase
        .from('user_achievements')
        .select('*, achievements(*)')
        .eq('user_id', user.id)
        .order('achieved_at', { ascending: false })

      if (userAchievementsError) throw userAchievementsError

      setAchievements(achievementsData || [])
      setUserAchievements(userAchievementsData as UserAchievement[] || [])
    } catch (err) {
      console.error('Error fetching achievements:', err)
      setError('Failed to load achievements')
    } finally {
      setIsLoading(false)
    }
  }

  // Check if user has a specific achievement
  const hasAchievement = (achievementId: string) => {
    return userAchievements.some((ua) => ua.achievement_id === achievementId)
  }

  // Award an achievement to the user
  const awardAchievement = async (achievementId: string) => {
    if (!user) return null

    // Check if user already has this achievement
    if (hasAchievement(achievementId)) {
      return null
    }

    try {
      const { data, error } = await supabase
        .from('user_achievements')
        .insert({
          user_id: user.id,
          achievement_id: achievementId,
        })
        .select('*, achievements(*)')
        .single()

      if (error) throw error

      // Refresh achievements
      await fetchAchievements()

      return data as UserAchievement
    } catch (err) {
      console.error('Error awarding achievement:', err)
      setError('Failed to award achievement')
      return null
    }
  }

  // Get user's total achievement points
  const getTotalPoints = () => {
    return userAchievements.reduce((total, ua) => total + (ua.achievements?.points || 0), 0)
  }

  // Get achievements that the user hasn't earned yet
  const getUnearned = () => {
    const earnedIds = userAchievements.map((ua) => ua.achievement_id)
    return achievements.filter((a) => !earnedIds.includes(a.id))
  }

  // Initialize data on mount or when user changes
  useEffect(() => {
    if (user) {
      fetchAchievements()
    } else {
      setAchievements([])
      setUserAchievements([])
      setIsLoading(false)
    }
  }, [user])

  return {
    isLoading,
    error,
    achievements,
    userAchievements,
    hasAchievement,
    awardAchievement,
    getTotalPoints,
    getUnearned,
    refreshAchievements: fetchAchievements,
  }
} 