'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Database } from '@/types/database'
import { ACHIEVEMENTS, calculateAchievementPoints } from '@/lib/achievements'

type UserAchievement = Database['public']['Tables']['user_achievements']['Row']
type Achievement = Database['public']['Tables']['achievements']['Row']

export function useAchievements() {
  const [userAchievements, setUserAchievements] = useState<UserAchievement[]>([])
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [totalPoints, setTotalPoints] = useState(0)
  
  const supabase = createClientComponentClient<Database>()
  
  const fetchUserAchievements = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const { data: { session } } = await supabase.auth.getSession()
      console.log('Achievements - Auth session:', session ? 'Found' : 'Not found')
      if (!session) {
        throw new Error('No active session')
      }
      
      // Fetch user achievements
      const { data: userAchievementsData, error: userAchievementsError } = await supabase
        .from('user_achievements')
        .select('*')
        .eq('user_id', session.user.id)
      
      console.log('User achievements data:', userAchievementsData ? `Found ${userAchievementsData.length} records` : 'No data', userAchievementsError ? `Error: ${userAchievementsError.message}` : 'No error')
      
      if (userAchievementsError) throw userAchievementsError
      
      // Fetch all achievements
      const { data: achievementsData, error: achievementsError } = await supabase
        .from('achievements')
        .select('*')
      
      console.log('Achievements data:', achievementsData ? `Found ${achievementsData.length} records` : 'No data', achievementsError ? `Error: ${achievementsError.message}` : 'No error')
      
      if (achievementsError) throw achievementsError
      
      setUserAchievements(userAchievementsData || [])
      setAchievements(achievementsData || [])
      
      // Calculate total points
      const points = calculatePoints(userAchievementsData || [], achievementsData || [])
      setTotalPoints(points)
    } catch (err) {
      console.error('Error fetching achievements:', err)
      setError('Failed to load achievements')
    } finally {
      setIsLoading(false)
    }
  }, [supabase])
  
  const calculatePoints = (
    userAchievements: UserAchievement[],
    achievements: Achievement[]
  ): number => {
    let total = 0
    
    for (const userAchievement of userAchievements) {
      const achievement = achievements.find(a => a.id === userAchievement.achievement_id)
      if (achievement) {
        total += achievement.reward_points
      }
    }
    
    return total
  }
  
  // Get earned and unearned achievements
  const getAchievementStatus = useCallback(() => {
    const earnedIds = new Set(userAchievements.map(ua => ua.achievement_id))
    
    const earned = achievements.filter(a => earnedIds.has(a.id))
    const unearned = achievements.filter(a => !earnedIds.has(a.id))
    
    return { earned, unearned }
  }, [userAchievements, achievements])
  
  // Initialize data on mount
  useEffect(() => {
    fetchUserAchievements()
  }, [fetchUserAchievements])
  
  return {
    userAchievements,
    achievements,
    isLoading,
    error,
    totalPoints,
    fetchUserAchievements,
    getAchievementStatus
  }
} 