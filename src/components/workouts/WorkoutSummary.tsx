'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import Link from 'next/link'

type Exercise = {
  id: string
  name: string
  duration: number
  rest_duration: number
  difficulty: 'beginner' | 'intermediate' | 'advanced'
}

type WorkoutSummaryProps = {
  workoutId: string
  exercises: Exercise[]
  onClose: () => void
}

type WorkoutStats = {
  total_duration: number
  total_exercises: number
  calories_burned: number
  streak: number
  difficulty: 'beginner' | 'intermediate' | 'advanced'
}

export default function WorkoutSummary({ workoutId, exercises, onClose }: WorkoutSummaryProps) {
  const [stats, setStats] = useState<WorkoutStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClientComponentClient()

  useEffect(() => {
    async function fetchStats() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error('Not authenticated')

        // Get workout completion data
        const { data: workoutData, error: workoutError } = await supabase
          .from('workout_progress')
          .select('completed_at')
          .eq('user_id', user.id)
          .order('completed_at', { ascending: false })
          .limit(2)

        if (workoutError) throw workoutError

        // Calculate streak
        let streak = 1
        if (workoutData && workoutData.length > 1) {
          const lastWorkout = new Date(workoutData[0].completed_at)
          const prevWorkout = new Date(workoutData[1].completed_at)
          const dayDiff = Math.floor(
            (lastWorkout.getTime() - prevWorkout.getTime()) / (1000 * 60 * 60 * 24)
          )
          if (dayDiff === 1) {
            streak = 2
          }
        }

        // Calculate total duration and calories
        const totalDuration = exercises.reduce(
          (acc, exercise) => acc + exercise.duration + exercise.rest_duration,
          0
        )

        // Rough estimate: 1 minute of face exercise burns about 3-5 calories
        const caloriesBurned = Math.round((totalDuration / 60) * 4)

        // Determine overall workout difficulty based on exercise difficulties
        const difficulties = exercises.map(e => e.difficulty)
        const difficultyCounts = difficulties.reduce((acc, diff) => {
          acc[diff] = (acc[diff] || 0) + 1
          return acc
        }, {} as Record<'beginner' | 'intermediate' | 'advanced', number>)

        const maxDifficulty = Object.entries(difficultyCounts).reduce((a, b) => 
          (difficultyCounts[a[0] as 'beginner' | 'intermediate' | 'advanced'] > 
           difficultyCounts[b[0] as 'beginner' | 'intermediate' | 'advanced'] ? a : b)
        )[0] as 'beginner' | 'intermediate' | 'advanced'

        setStats({
          total_duration: totalDuration,
          total_exercises: exercises.length,
          calories_burned: caloriesBurned,
          streak,
          difficulty: maxDifficulty,
        })
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch workout stats')
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [workoutId, exercises, supabase])

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
        <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="space-y-4">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
        <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
          <div className="text-red-600">{error}</div>
          <button
            onClick={onClose}
            className="mt-4 w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700"
          >
            Close
          </button>
        </div>
      </div>
    )
  }

  if (!stats) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Workout Complete! 🎉</h2>
          <p className="mt-2 text-gray-500">Great job! Here's your workout summary.</p>
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Total Duration</span>
            <span className="font-semibold">{formatDuration(stats.total_duration)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Exercises Completed</span>
            <span className="font-semibold">{stats.total_exercises}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Calories Burned</span>
            <span className="font-semibold">{stats.calories_burned}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Current Streak</span>
            <span className="font-semibold">{stats.streak} days</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Difficulty Level</span>
            <span className="font-semibold capitalize">{stats.difficulty}</span>
          </div>
        </div>

        <div className="mt-8 space-y-3">
          <Link
            href="/workouts"
            className="block w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 text-center"
          >
            Back to Workouts
          </Link>
          <button
            onClick={onClose}
            className="block w-full bg-white text-gray-700 py-2 px-4 rounded-md border border-gray-300 hover:bg-gray-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
} 