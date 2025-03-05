'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Database } from '@/types/database'
import { useToast } from '@/components/ui/toast'

interface ScheduledWorkout {
  id: string
  user_id: string
  workout_id: string
  scheduled_for: string
  completed: boolean
  created_at: string
  updated_at: string
  workout?: {
    title: string
    difficulty: string
    duration_seconds: number
  }
}

export function useSchedule() {
  const [scheduledWorkouts, setScheduledWorkouts] = useState<ScheduledWorkout[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const supabase = createClientComponentClient<Database>()
  const { toast } = useToast()
  
  const fetchSchedule = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const { data: { session } } = await supabase.auth.getSession()
      console.log('Schedule - Auth session:', session ? 'Found' : 'Not found')
      if (!session) {
        throw new Error('No active session')
      }
      
      // Get scheduled workouts with workout details
      const { data, error: fetchError } = await supabase
        .from('workout_schedule')
        .select(`
          *,
          workout:workout_id (
            title,
            difficulty,
            duration_seconds
          )
        `)
        .eq('user_id', session.user.id)
        .order('scheduled_for', { ascending: true })
      
      console.log('Schedule data:', data ? `Found ${data.length} records` : 'No data', fetchError ? `Error: ${fetchError.message}` : 'No error')
      
      if (fetchError) throw fetchError
      
      setScheduledWorkouts(data || [])
    } catch (err) {
      console.error('Error fetching schedule:', err)
      setError('Failed to load workout schedule')
    } finally {
      setIsLoading(false)
    }
  }, [supabase])
  
  const scheduleWorkout = async (workoutId: string, scheduledFor: Date) => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        throw new Error('No active session')
      }
      
      const { data, error } = await supabase
        .from('workout_schedule')
        .insert({
          user_id: session.user.id,
          workout_id: workoutId,
          scheduled_for: scheduledFor.toISOString(),
          completed: false
        })
        .select()
      
      if (error) throw error
      
      // Refresh schedule
      await fetchSchedule()
      
      toast({
        title: 'Workout Scheduled',
        description: 'Your workout has been scheduled successfully.',
        variant: 'success'
      })
      
      return data
    } catch (err) {
      console.error('Error scheduling workout:', err)
      toast({
        title: 'Error',
        description: 'Failed to schedule workout. Please try again.',
        variant: 'destructive'
      })
      return null
    }
  }
  
  const markAsCompleted = async (scheduleId: string) => {
    try {
      const { data, error } = await supabase
        .from('workout_schedule')
        .update({ completed: true })
        .eq('id', scheduleId)
        .select()
      
      if (error) throw error
      
      // Refresh schedule
      await fetchSchedule()
      
      toast({
        title: 'Workout Completed',
        description: 'Your scheduled workout has been marked as completed.',
        variant: 'success'
      })
      
      return data
    } catch (err) {
      console.error('Error marking workout as completed:', err)
      toast({
        title: 'Error',
        description: 'Failed to update workout status. Please try again.',
        variant: 'destructive'
      })
      return null
    }
  }
  
  const deleteScheduledWorkout = async (scheduleId: string) => {
    try {
      const { error } = await supabase
        .from('workout_schedule')
        .delete()
        .eq('id', scheduleId)
      
      if (error) throw error
      
      // Refresh schedule
      await fetchSchedule()
      
      toast({
        title: 'Workout Removed',
        description: 'The scheduled workout has been removed.',
        variant: 'success'
      })
      
      return true
    } catch (err) {
      console.error('Error deleting scheduled workout:', err)
      toast({
        title: 'Error',
        description: 'Failed to remove scheduled workout. Please try again.',
        variant: 'destructive'
      })
      return false
    }
  }
  
  // Get upcoming workouts (not completed and scheduled in the future)
  const getUpcomingWorkouts = useCallback(() => {
    const now = new Date()
    return scheduledWorkouts.filter(workout => 
      !workout.completed && new Date(workout.scheduled_for) >= now
    )
  }, [scheduledWorkouts])
  
  // Get today's workouts
  const getTodayWorkouts = useCallback(() => {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    
    return scheduledWorkouts.filter(workout => {
      const workoutDate = new Date(workout.scheduled_for)
      return !workout.completed && workoutDate >= today && workoutDate < tomorrow
    })
  }, [scheduledWorkouts])
  
  // Initialize data on mount
  useEffect(() => {
    fetchSchedule()
  }, [fetchSchedule])
  
  return {
    scheduledWorkouts,
    isLoading,
    error,
    fetchSchedule,
    scheduleWorkout,
    markAsCompleted,
    deleteScheduledWorkout,
    getUpcomingWorkouts,
    getTodayWorkouts
  }
} 