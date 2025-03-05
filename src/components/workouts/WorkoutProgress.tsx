'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

type WorkoutProgress = {
  id: string
  workout_id: string
  completed_at: string
  duration: number
  difficulty: 'beginner' | 'intermediate' | 'advanced'
}

type WorkoutStats = {
  total_workouts: number
  total_duration: number
  average_duration: number
  best_streak: number
  current_streak: number
  difficulty_distribution: {
    beginner: number
    intermediate: number
    advanced: number
  }
}

export default function WorkoutProgress() {
  const [progress, setProgress] = useState<WorkoutProgress[]>([])
  const [stats, setStats] = useState<WorkoutStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClientComponentClient()

  useEffect(() => {
    async function fetchProgress() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error('Not authenticated')

        const { data, error: fetchError } = await supabase
          .from('workout_progress')
          .select('*')
          .eq('user_id', user.id)
          .order('completed_at', { ascending: false })

        if (fetchError) throw fetchError

        setProgress(data || [])

        // Calculate statistics
        const totalWorkouts = data.length
        const totalDuration = data.reduce((acc, workout) => acc + workout.duration, 0)
        const averageDuration = totalWorkouts > 0 ? totalDuration / totalWorkouts : 0

        // Calculate streaks
        let currentStreak = 1
        let bestStreak = 1
        let tempStreak = 1

        for (let i = 1; i < data.length; i++) {
          const currentDate = new Date(data[i].completed_at)
          const prevDate = new Date(data[i - 1].completed_at)
          const dayDiff = Math.floor(
            (currentDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24)
          )

          if (dayDiff === 1) {
            tempStreak++
            bestStreak = Math.max(bestStreak, tempStreak)
          } else {
            tempStreak = 1
          }
        }

        // Calculate difficulty distribution
        const difficultyDistribution = {
          beginner: data.filter(w => w.difficulty === 'beginner').length,
          intermediate: data.filter(w => w.difficulty === 'intermediate').length,
          advanced: data.filter(w => w.difficulty === 'advanced').length,
        }

        setStats({
          total_workouts: totalWorkouts,
          total_duration: totalDuration,
          average_duration: averageDuration,
          best_streak: bestStreak,
          current_streak: currentStreak,
          difficulty_distribution: difficultyDistribution,
        })
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch workout progress')
      } finally {
        setLoading(false)
      }
    }

    fetchProgress()
  }, [supabase])

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours}h ${mins}m`
  }

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-gray-200 rounded"></div>
          ))}
        </div>
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

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Your Progress</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900">Total Workouts</h3>
          <p className="mt-2 text-3xl font-bold text-indigo-600">{stats.total_workouts}</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900">Total Duration</h3>
          <p className="mt-2 text-3xl font-bold text-indigo-600">
            {formatDuration(stats.total_duration)}
          </p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900">Best Streak</h3>
          <p className="mt-2 text-3xl font-bold text-indigo-600">{stats.best_streak} days</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Difficulty Distribution</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-sm text-gray-500">Beginner</div>
            <div className="text-2xl font-bold text-indigo-600">
              {stats.difficulty_distribution.beginner}
            </div>
          </div>
          <div className="text-center">
            <div className="text-sm text-gray-500">Intermediate</div>
            <div className="text-2xl font-bold text-indigo-600">
              {stats.difficulty_distribution.intermediate}
            </div>
          </div>
          <div className="text-center">
            <div className="text-sm text-gray-500">Advanced</div>
            <div className="text-2xl font-bold text-indigo-600">
              {stats.difficulty_distribution.advanced}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Workouts</h3>
        <div className="space-y-4">
          {progress.slice(0, 5).map((workout) => (
            <div
              key={workout.id}
              className="flex items-center justify-between py-2 border-b last:border-0"
            >
              <div>
                <div className="text-sm font-medium text-gray-900">
                  {new Date(workout.completed_at).toLocaleDateString()}
                </div>
                <div className="text-sm text-gray-500 capitalize">{workout.difficulty}</div>
              </div>
              <div className="text-sm text-gray-500">
                {formatDuration(workout.duration)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
} 