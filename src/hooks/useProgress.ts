import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Database } from '@/types/database'
import { useAuth } from '@/components/providers/auth-provider'

type ProgressMetric = Database['public']['Tables']['progress_metrics']['Row']
type WorkoutProgress = Database['public']['Tables']['workout_progress']['Row']
type UserStreak = Database['public']['Tables']['user_streaks']['Row']

export function useProgress() {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [progressData, setProgressData] = useState<ProgressMetric[]>([])
  const [workoutHistory, setWorkoutHistory] = useState<WorkoutProgress[]>([])
  const [streak, setStreak] = useState<UserStreak | null>(null)
  const { user } = useAuth()
  const supabase = createClientComponentClient<Database>()

  // Fetch user progress data
  const fetchProgressData = async () => {
    if (!user) return

    setIsLoading(true)
    setError(null)

    try {
      // Fetch progress metrics
      const { data: progressData, error: progressError } = await supabase
        .from('progress_metrics')
        .select('*')
        .eq('user_id', user.id)
        .order('recorded_at', { ascending: false })

      if (progressError) throw progressError

      // Fetch workout history
      const { data: workoutData, error: workoutError } = await supabase
        .from('workout_progress')
        .select('*, workouts(*)')
        .eq('user_id', user.id)
        .order('completed_at', { ascending: false })

      if (workoutError) throw workoutError

      // Fetch streak data
      const { data: streakData, error: streakError } = await supabase
        .from('user_streaks')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (streakError && streakError.code !== 'PGRST116') {
        // PGRST116 is "No rows returned" which is fine for new users
        throw streakError
      }

      setProgressData(progressData || [])
      setWorkoutHistory(workoutData || [])
      setStreak(streakData || null)
    } catch (err) {
      console.error('Error fetching progress data:', err)
      setError('Failed to load progress data')
    } finally {
      setIsLoading(false)
    }
  }

  // Record a completed workout
  const recordWorkout = async (
    workoutId: string,
    durationSeconds: number,
    rating?: number,
    notes?: string
  ) => {
    if (!user) return null

    try {
      // Record the workout
      const { data: workoutData, error: workoutError } = await supabase
        .from('workout_progress')
        .insert({
          user_id: user.id,
          workout_id: workoutId,
          duration_seconds: durationSeconds,
          rating,
          notes,
        })
        .select()
        .single()

      if (workoutError) throw workoutError

      // Update streak
      const today = new Date().toISOString().split('T')[0]
      const { data: streakData, error: streakError } = await supabase
        .from('user_streaks')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (streakError && streakError.code !== 'PGRST116') {
        throw streakError
      }

      let newStreak
      if (streakData) {
        // Calculate days since last workout
        const lastWorkoutDate = streakData.last_workout_date
          ? new Date(streakData.last_workout_date)
          : null
        const daysSinceLastWorkout = lastWorkoutDate
          ? Math.floor(
              (new Date().getTime() - lastWorkoutDate.getTime()) / (1000 * 60 * 60 * 24)
            )
          : null

        // Update streak based on days since last workout
        let currentStreak = streakData.current_streak
        if (daysSinceLastWorkout === 1) {
          // Consecutive day, increment streak
          currentStreak += 1
        } else if (daysSinceLastWorkout !== 0) {
          // Not consecutive, reset streak
          currentStreak = 1
        }

        const longestStreak = Math.max(currentStreak, streakData.longest_streak)

        // Update streak record
        const { data: updatedStreak, error: updateError } = await supabase
          .from('user_streaks')
          .update({
            current_streak: currentStreak,
            longest_streak: longestStreak,
            last_workout_date: today,
            updated_at: new Date().toISOString(),
          })
          .eq('id', streakData.id)
          .select()
          .single()

        if (updateError) throw updateError
        newStreak = updatedStreak
      } else {
        // Create new streak record
        const { data: newStreakData, error: createError } = await supabase
          .from('user_streaks')
          .insert({
            user_id: user.id,
            current_streak: 1,
            longest_streak: 1,
            last_workout_date: today,
          })
          .select()
          .single()

        if (createError) throw createError
        newStreak = newStreakData
      }

      // Refresh data
      await fetchProgressData()

      return { workout: workoutData, streak: newStreak }
    } catch (err) {
      console.error('Error recording workout:', err)
      setError('Failed to record workout')
      return null
    }
  }

  // Record a progress metric
  const recordProgress = async (metricName: string, value: number, notes?: string) => {
    if (!user) return null

    try {
      const { data, error } = await supabase
        .from('progress_metrics')
        .insert({
          user_id: user.id,
          metric_name: metricName,
          value: value,
          notes,
        })
        .select()
        .single()

      if (error) throw error

      // Refresh data
      await fetchProgressData()

      return data
    } catch (err) {
      console.error('Error recording progress:', err)
      setError('Failed to record progress')
      return null
    }
  }

  // Get metrics for a specific metric name
  const getMetricHistory = (metricName: string) => {
    return progressData.filter((p) => p.metric_name === metricName)
  }

  // Initialize data on mount or when user changes
  useEffect(() => {
    if (user) {
      fetchProgressData()
    } else {
      setProgressData([])
      setWorkoutHistory([])
      setStreak(null)
      setIsLoading(false)
    }
  }, [user])

  return {
    isLoading,
    error,
    progressData,
    workoutHistory,
    streak,
    recordWorkout,
    recordProgress,
    getMetricHistory,
    refreshData: fetchProgressData,
  }
} 