'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Database } from '@/types/database'
import { useToast } from '@/components/ui/toast'
import { checkAchievementProgress } from '@/lib/achievements'

type WorkoutProgress = Database['public']['Tables']['workout_progress']['Row']
type UserAchievement = Database['public']['Tables']['user_achievements']['Row']
type ProgressMetric = Database['public']['Tables']['progress_metrics']['Row']

export type TimeRange = 'week' | 'month' | 'year' | 'all'

export interface WorkoutAnalytics {
  totalWorkouts: number
  totalDuration: number
  avgDuration: number
  currentStreak: number
  bestStreak: number
  difficultyDistribution: { name: string; value: number }[]
  weeklyProgress: { day: string; count: number; duration: number }[]
  monthlyProgress: { month: string; count: number; duration: number }[]
  exerciseDistribution: { name: string; value: number }[]
  timeOfDayDistribution: { name: string; value: number }[]
}

export function useProgress() {
  const [workoutHistory, setWorkoutHistory] = useState<WorkoutProgress[]>([])
  const [userAchievements, setUserAchievements] = useState<UserAchievement[]>([])
  const [progressMetrics, setProgressMetrics] = useState<ProgressMetric[]>([])
  const [analytics, setAnalytics] = useState<WorkoutAnalytics | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const supabase = createClientComponentClient<Database>()
  const { toast } = useToast()
  
  const fetchWorkoutHistory = useCallback(async (timeRange: TimeRange = 'all') => {
    try {
      setIsLoading(true)
      setError(null)
      
      const { data: { session } } = await supabase.auth.getSession()
      console.log('Auth session:', session ? 'Found' : 'Not found')
      if (!session) {
        throw new Error('No active session')
      }
      
      let query = supabase
        .from('workout_progress')
        .select('*')
        .eq('user_id', session.user.id)
        .order('completed_at', { ascending: false })
      
      // Apply time range filter
      const now = new Date()
      if (timeRange === 'week') {
        const weekAgo = new Date(now)
        weekAgo.setDate(now.getDate() - 7)
        query = query.gte('completed_at', weekAgo.toISOString())
      } else if (timeRange === 'month') {
        const monthAgo = new Date(now)
        monthAgo.setMonth(now.getMonth() - 1)
        query = query.gte('completed_at', monthAgo.toISOString())
      } else if (timeRange === 'year') {
        const yearAgo = new Date(now)
        yearAgo.setFullYear(now.getFullYear() - 1)
        query = query.gte('completed_at', yearAgo.toISOString())
      }
      
      const { data, error: fetchError } = await query
      console.log('Workout history data:', data ? `Found ${data.length} records` : 'No data', fetchError ? `Error: ${fetchError.message}` : 'No error')
      
      if (fetchError) throw fetchError
      
      setWorkoutHistory(data || [])
      
      // Calculate analytics
      if (data && data.length > 0) {
        calculateAnalytics(data)
      } else {
        setAnalytics(null)
      }
    } catch (err) {
      console.error('Error fetching workout history:', err)
      setError('Failed to load workout history')
    } finally {
      setIsLoading(false)
    }
  }, [supabase])
  
  const fetchUserAchievements = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        throw new Error('No active session')
      }
      
      const { data, error } = await supabase
        .from('user_achievements')
        .select('*')
        .eq('user_id', session.user.id)
      
      if (error) throw error
      
      setUserAchievements(data || [])
    } catch (err) {
      console.error('Error fetching user achievements:', err)
    }
  }, [supabase])
  
  const fetchProgressMetrics = useCallback(async (timeRange: TimeRange = 'all') => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        throw new Error('No active session')
      }
      
      let query = supabase
        .from('progress_metrics')
        .select('*')
        .eq('user_id', session.user.id)
        .order('recorded_at', { ascending: false })
      
      // Apply time range filter
      const now = new Date()
      if (timeRange === 'week') {
        const weekAgo = new Date(now)
        weekAgo.setDate(now.getDate() - 7)
        query = query.gte('recorded_at', weekAgo.toISOString())
      } else if (timeRange === 'month') {
        const monthAgo = new Date(now)
        monthAgo.setMonth(now.getMonth() - 1)
        query = query.gte('recorded_at', monthAgo.toISOString())
      } else if (timeRange === 'year') {
        const yearAgo = new Date(now)
        yearAgo.setFullYear(now.getFullYear() - 1)
        query = query.gte('recorded_at', yearAgo.toISOString())
      }
      
      const { data, error } = await query
      
      if (error) throw error
      
      setProgressMetrics(data || [])
    } catch (err) {
      console.error('Error fetching progress metrics:', err)
    }
  }, [supabase])
  
  const calculateAnalytics = (workouts: WorkoutProgress[]) => {
    // Total workouts
    const totalWorkouts = workouts.length
    
    // Total and average duration
    const totalDuration = workouts.reduce((sum, workout) => sum + workout.duration_seconds, 0)
    const avgDuration = totalWorkouts > 0 ? totalDuration / totalWorkouts : 0
    
    // Calculate streaks
    const streaks = calculateStreaks(workouts)
    
    // Weekly progress
    const weeklyProgress = calculateWeeklyProgress(workouts)
    
    // Monthly progress
    const monthlyProgress = calculateMonthlyProgress(workouts)
    
    // Placeholder data for distributions
    // In a real implementation, you would calculate these from the workout data
    const difficultyDistribution = [
      { name: 'Beginner', value: 0 },
      { name: 'Intermediate', value: 0 },
      { name: 'Advanced', value: 0 }
    ]
    
    const exerciseDistribution = [
      { name: 'Cardio', value: 0 },
      { name: 'Strength', value: 0 },
      { name: 'Flexibility', value: 0 },
      { name: 'Balance', value: 0 }
    ]
    
    const timeOfDayDistribution = [
      { name: 'Morning', value: 0 },
      { name: 'Afternoon', value: 0 },
      { name: 'Evening', value: 0 },
      { name: 'Night', value: 0 }
    ]
    
    setAnalytics({
      totalWorkouts,
      totalDuration,
      avgDuration,
      currentStreak: streaks.currentStreak,
      bestStreak: streaks.bestStreak,
      difficultyDistribution,
      weeklyProgress,
      monthlyProgress,
      exerciseDistribution,
      timeOfDayDistribution
    })
  }
  
  const calculateStreaks = (workouts: WorkoutProgress[]) => {
    if (!workouts.length) return { currentStreak: 0, bestStreak: 0 }
    
    // Sort workouts by date (newest first)
    const sortedWorkouts = [...workouts].sort((a, b) => 
      new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime()
    )
    
    let currentStreak = 0
    let bestStreak = 0
    let currentDate = new Date()
    
    // Set time to midnight for date comparison
    currentDate.setHours(0, 0, 0, 0)
    
    // Check if the most recent workout was today or yesterday
    const mostRecentDate = new Date(sortedWorkouts[0].completed_at)
    mostRecentDate.setHours(0, 0, 0, 0)
    
    const dayDiff = Math.floor((currentDate.getTime() - mostRecentDate.getTime()) / (1000 * 60 * 60 * 24))
    
    // If the most recent workout was more than 1 day ago, current streak is 0
    if (dayDiff > 1) {
      return { currentStreak: 0, bestStreak: calculateBestStreak(sortedWorkouts) }
    }
    
    // Calculate current streak
    const dates = new Set<string>()
    for (const workout of sortedWorkouts) {
      const workoutDate = new Date(workout.completed_at)
      workoutDate.setHours(0, 0, 0, 0)
      dates.add(workoutDate.toISOString().split('T')[0])
    }
    
    // Check consecutive days
    let checkDate = new Date(mostRecentDate)
    while (true) {
      const dateStr = checkDate.toISOString().split('T')[0]
      if (dates.has(dateStr)) {
        currentStreak++
        checkDate.setDate(checkDate.getDate() - 1)
      } else {
        break
      }
    }
    
    bestStreak = calculateBestStreak(sortedWorkouts)
    
    return { currentStreak, bestStreak }
  }
  
  const calculateBestStreak = (workouts: WorkoutProgress[]) => {
    if (!workouts.length) return 0
    
    // Create a set of dates when workouts were completed
    const workoutDates = new Set<string>()
    for (const workout of workouts) {
      const date = new Date(workout.completed_at)
      date.setHours(0, 0, 0, 0)
      workoutDates.add(date.toISOString().split('T')[0])
    }
    
    // Convert to array and sort
    const sortedDates = Array.from(workoutDates).sort()
    
    let bestStreak = 1
    let currentStreak = 1
    
    for (let i = 1; i < sortedDates.length; i++) {
      const prevDate = new Date(sortedDates[i - 1])
      const currDate = new Date(sortedDates[i])
      
      // Check if dates are consecutive
      const dayDiff = Math.floor((currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24))
      
      if (dayDiff === 1) {
        currentStreak++
      } else {
        currentStreak = 1
      }
      
      bestStreak = Math.max(bestStreak, currentStreak)
    }
    
    return bestStreak
  }
  
  const calculateWeeklyProgress = (workouts: WorkoutProgress[]) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    const result = days.map(day => ({ day, count: 0, duration: 0 }))
    
    // Get workouts from the last 7 days
    const now = new Date()
    const weekAgo = new Date(now)
    weekAgo.setDate(now.getDate() - 7)
    
    const recentWorkouts = workouts.filter(workout => 
      new Date(workout.completed_at) >= weekAgo
    )
    
    // Group by day of week
    for (const workout of recentWorkouts) {
      const date = new Date(workout.completed_at)
      const dayIndex = date.getDay()
      result[dayIndex].count++
      result[dayIndex].duration += workout.duration_seconds
    }
    
    return result
  }
  
  const calculateMonthlyProgress = (workouts: WorkoutProgress[]) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const result = months.map(month => ({ month, count: 0, duration: 0 }))
    
    // Get workouts from the last 12 months
    const now = new Date()
    const yearAgo = new Date(now)
    yearAgo.setFullYear(now.getFullYear() - 1)
    
    const recentWorkouts = workouts.filter(workout => 
      new Date(workout.completed_at) >= yearAgo
    )
    
    // Group by month
    for (const workout of recentWorkouts) {
      const date = new Date(workout.completed_at)
      const monthIndex = date.getMonth()
      result[monthIndex].count++
      result[monthIndex].duration += workout.duration_seconds
    }
    
    return result
  }
  
  const recordWorkout = async (
    workoutId: string,
    durationSeconds: number,
    rating?: number,
    notes?: string
  ) => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        throw new Error('No active session')
      }
      
      const { data, error } = await supabase
        .from('workout_progress')
        .insert({
          user_id: session.user.id,
          workout_id: workoutId,
          duration_seconds: durationSeconds,
          rating: rating || null,
          notes: notes || null,
          completed_at: new Date().toISOString()
        })
        .select()
      
      if (error) throw error
      
      // Refresh workout history
      await fetchWorkoutHistory()
      
      // Check for achievements
      await checkAndUpdateAchievements()
      
      toast({
        title: 'Workout recorded',
        description: 'Your workout has been successfully recorded.',
        variant: 'success'
      })
      
      return data
    } catch (err) {
      console.error('Error recording workout:', err)
      toast({
        title: 'Error',
        description: 'Failed to record workout. Please try again.',
        variant: 'destructive'
      })
      return null
    }
  }
  
  const recordProgress = async (
    metricName: string,
    value: number,
    notes?: string
  ) => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        throw new Error('No active session')
      }
      
      const { data, error } = await supabase
        .from('progress_metrics')
        .insert({
          user_id: session.user.id,
          metric_name: metricName,
          metric_value: value,
          notes: notes || null,
          recorded_at: new Date().toISOString()
        })
        .select()
      
      if (error) throw error
      
      // Refresh progress metrics
      await fetchProgressMetrics()
      
      toast({
        title: 'Progress recorded',
        description: 'Your progress has been successfully recorded.',
        variant: 'success'
      })
      
      return data
    } catch (err) {
      console.error('Error recording progress:', err)
      toast({
        title: 'Error',
        description: 'Failed to record progress. Please try again.',
        variant: 'destructive'
      })
      return null
    }
  }
  
  const checkAndUpdateAchievements = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        throw new Error('No active session')
      }
      
      // Get all workout progress for the user
      const { data: workouts, error: workoutsError } = await supabase
        .from('workout_progress')
        .select('*')
        .eq('user_id', session.user.id)
      
      if (workoutsError) throw workoutsError
      
      // Get current user achievements
      const { data: achievements, error: achievementsError } = await supabase
        .from('user_achievements')
        .select('*')
        .eq('user_id', session.user.id)
      
      if (achievementsError) throw achievementsError
      
      if (!workouts) return
      
      // Calculate workout stats
      const stats = {
        totalWorkouts: workouts.length,
        totalDuration: workouts.reduce((sum, w) => sum + w.duration_seconds, 0),
        currentStreak: calculateStreaks(workouts).currentStreak,
        uniqueExercises: new Set(workouts.map(w => w.workout_id)).size,
        advancedWorkouts: 0 // This would need to be calculated based on workout difficulty
      }
      
      // Check for new achievements
      const earnedAchievements = achievements || []
      const newAchievements = checkAchievementProgress(stats, earnedAchievements)
      
      // Insert any new achievements
      if (newAchievements.length > 0) {
        for (const achievement of newAchievements) {
          const { error } = await supabase
            .from('user_achievements')
            .insert({
              user_id: session.user.id,
              achievement_id: achievement.id,
              earned_at: new Date().toISOString()
            })
          
          if (error) console.error('Error saving achievement:', error)
        }
        
        // Refresh achievements
        await fetchUserAchievements()
        
        // Show toast for new achievements
        toast({
          title: 'Achievement Unlocked!',
          description: `You've earned ${newAchievements.length} new achievement${newAchievements.length > 1 ? 's' : ''}!`,
          variant: 'success'
        })
      }
    } catch (err) {
      console.error('Error checking achievements:', err)
    }
  }
  
  // Initialize data on mount
  useEffect(() => {
    const loadData = async () => {
      await Promise.all([
        fetchWorkoutHistory(),
        fetchUserAchievements(),
        fetchProgressMetrics()
      ])
    }
    
    loadData()
  }, [fetchWorkoutHistory, fetchUserAchievements, fetchProgressMetrics])
  
  return {
    workoutHistory,
    userAchievements,
    progressMetrics,
    analytics,
    isLoading,
    error,
    fetchWorkoutHistory,
    fetchUserAchievements,
    fetchProgressMetrics,
    recordWorkout,
    recordProgress
  }
} 