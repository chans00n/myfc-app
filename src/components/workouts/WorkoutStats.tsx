'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

type Exercise = {
  duration: number
  rest_duration: number
}

type WorkoutExercise = {
  exercise: Exercise
}

type Workout = {
  exercises: WorkoutExercise[]
}

type WorkoutProgress = {
  completed_at: string
  workout: {
    exercises: {
      exercise: Exercise
    }[]
  }
}

type WorkoutStats = {
  total_workouts: number
  total_duration: number
  streak: number
  last_workout: string | null
  completed_exercises: number
}

type WorkoutStatsProps = {
  workoutId: string
}

type SupabaseWorkoutProgress = {
  completed_at: string
  workout: {
    exercises: {
      exercise: Exercise
    }[]
  }
}

export default function WorkoutStats({ workoutId }: WorkoutStatsProps) {
  const [stats, setStats] = useState<WorkoutStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClientComponentClient()

  useEffect(() => {
    async function fetchStats() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error('Not authenticated')

        // Get total workouts completed
        const { count: totalWorkouts, error: workoutsError } = await supabase
          .from('workout_progress')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)

        if (workoutsError) throw workoutsError

        // Get total duration and completed exercises
        const { data: workoutData, error: workoutError } = await supabase
          .from('workout_progress')
          .select(`
            completed_at,
            workout:workouts(
              exercises:workout_exercises(
                exercise:exercises(
                  duration,
                  rest_duration
                )
              )
            )
          `)
          .eq('user_id', user.id)
          .order('completed_at', { ascending: false })

        if (workoutError) throw workoutError

        // Calculate total duration and completed exercises
        let totalDuration = 0
        let completedExercises = 0

        const typedWorkoutData = (workoutData || []) as unknown as SupabaseWorkoutProgress[]
        typedWorkoutData.forEach((workout) => {
          workout.workout.exercises.forEach((exercise) => {
            totalDuration += exercise.exercise.duration + exercise.exercise.rest_duration
            completedExercises++
          })
        })

        // Calculate streak
        let streak = 0
        if (typedWorkoutData.length > 0) {
          const lastWorkout = new Date(typedWorkoutData[0].completed_at)
          const today = new Date()
          const diffTime = Math.abs(today.getTime() - lastWorkout.getTime())
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

          if (diffDays <= 1) {
            streak = 1
            let currentDate = new Date(lastWorkout)
            for (let i = 1; i < typedWorkoutData.length; i++) {
              const prevWorkout = new Date(typedWorkoutData[i].completed_at)
              const dayDiff = Math.floor(
                (currentDate.getTime() - prevWorkout.getTime()) / (1000 * 60 * 60 * 24)
              )
              if (dayDiff === 1) {
                streak++
                currentDate = prevWorkout
              } else {
                break
              }
            }
          }
        }

        setStats({
          total_workouts: totalWorkouts || 0,
          total_duration: totalDuration,
          streak,
          last_workout: typedWorkoutData[0]?.completed_at || null,
          completed_exercises: completedExercises,
        })
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch workout stats')
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [workoutId, supabase])

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        <div className="h-4 bg-gray-200 rounded w-2/3"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-md bg-red-50 p-4">
        <div className="text-sm text-red-700">{error}</div>
      </div>
    )
  }

  if (!stats) return null

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    return `${hours}h ${minutes}m`
  }

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Your Progress</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-indigo-600">{stats.total_workouts}</div>
          <div className="text-sm text-gray-500">Total Workouts</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-indigo-600">{formatDuration(stats.total_duration)}</div>
          <div className="text-sm text-gray-500">Total Time</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-indigo-600">{stats.streak}</div>
          <div className="text-sm text-gray-500">Day Streak</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-indigo-600">{stats.completed_exercises}</div>
          <div className="text-sm text-gray-500">Exercises Completed</div>
        </div>
      </div>
      {stats.last_workout && (
        <div className="mt-4 text-sm text-gray-500 text-center">
          Last workout: {new Date(stats.last_workout).toLocaleDateString()}
        </div>
      )}
    </div>
  )
} 