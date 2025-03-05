'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts'

type WorkoutAnalytics = {
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
  weekly_progress: {
    date: string
    duration: number
    count: number
  }[]
  monthly_progress: {
    month: string
    duration: number
    count: number
  }[]
  exercise_distribution: {
    name: string
    count: number
  }[]
  time_of_day_distribution: {
    hour: number
    count: number
  }[]
}

const COLORS = ['#4F46E5', '#10B981', '#F59E0B']

export default function WorkoutAnalytics() {
  const [analytics, setAnalytics] = useState<WorkoutAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year'>('week')
  const supabase = createClientComponentClient()

  useEffect(() => {
    fetchAnalytics()
  }, [timeRange])

  async function fetchAnalytics() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Calculate date range based on selected time range
      const now = new Date()
      let startDate = new Date()
      switch (timeRange) {
        case 'week':
          startDate.setDate(now.getDate() - 7)
          break
        case 'month':
          startDate.setMonth(now.getMonth() - 1)
          break
        case 'year':
          startDate.setFullYear(now.getFullYear() - 1)
          break
      }

      // Fetch workout data
      const { data: workouts, error: workoutsError } = await supabase
        .from('workout_progress')
        .select('*')
        .eq('user_id', user.id)
        .gte('completed_at', startDate.toISOString())
        .order('completed_at', { ascending: true })

      if (workoutsError) throw workoutsError

      // Process analytics data
      const processedAnalytics = processWorkoutData(workouts)
      setAnalytics(processedAnalytics)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch analytics')
    } finally {
      setLoading(false)
    }
  }

  function processWorkoutData(workouts: any[]): WorkoutAnalytics {
    const totalWorkouts = workouts.length
    const totalDuration = workouts.reduce((acc, workout) => acc + workout.duration, 0)
    const averageDuration = totalWorkouts > 0 ? totalDuration / totalWorkouts : 0

    // Calculate streaks
    let currentStreak = 1
    let bestStreak = 1
    let tempStreak = 1

    for (let i = 1; i < workouts.length; i++) {
      const currentDate = new Date(workouts[i].completed_at)
      const prevDate = new Date(workouts[i - 1].completed_at)
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
      beginner: workouts.filter(w => w.difficulty === 'beginner').length,
      intermediate: workouts.filter(w => w.difficulty === 'intermediate').length,
      advanced: workouts.filter(w => w.difficulty === 'advanced').length,
    }

    // Calculate weekly progress
    const weeklyProgress = workouts.reduce((acc: any[], workout) => {
      const date = new Date(workout.completed_at).toLocaleDateString()
      const existingDay = acc.find(d => d.date === date)
      
      if (existingDay) {
        existingDay.duration += workout.duration
        existingDay.count++
      } else {
        acc.push({
          date,
          duration: workout.duration,
          count: 1
        })
      }
      
      return acc
    }, [])

    // Calculate monthly progress
    const monthlyProgress = workouts.reduce((acc: any[], workout) => {
      const month = new Date(workout.completed_at).toLocaleDateString('default', { month: 'short' })
      const existingMonth = acc.find(m => m.month === month)
      
      if (existingMonth) {
        existingMonth.duration += workout.duration
        existingMonth.count++
      } else {
        acc.push({
          month,
          duration: workout.duration,
          count: 1
        })
      }
      
      return acc
    }, [])

    // Calculate exercise distribution
    const exerciseDistribution = workouts.reduce((acc: any[], workout) => {
      const exercise = workout.exercise_name
      const existingExercise = acc.find(e => e.name === exercise)
      
      if (existingExercise) {
        existingExercise.count++
      } else {
        acc.push({
          name: exercise,
          count: 1
        })
      }
      
      return acc
    }, [])

    // Calculate time of day distribution
    const timeOfDayDistribution = workouts.reduce((acc: any[], workout) => {
      const hour = new Date(workout.completed_at).getHours()
      const existingHour = acc.find(h => h.hour === hour)
      
      if (existingHour) {
        existingHour.count++
      } else {
        acc.push({
          hour,
          count: 1
        })
      }
      
      return acc
    }, []).sort((a, b) => a.hour - b.hour)

    return {
      total_workouts: totalWorkouts,
      total_duration: totalDuration,
      average_duration: averageDuration,
      best_streak: bestStreak,
      current_streak: currentStreak,
      difficulty_distribution: difficultyDistribution,
      weekly_progress: weeklyProgress,
      monthly_progress: monthlyProgress,
      exercise_distribution: exerciseDistribution,
      time_of_day_distribution: timeOfDayDistribution,
    }
  }

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
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

  if (!analytics) return null

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">Detailed Analytics</h3>
        <div className="flex space-x-2">
          {(['week', 'month', 'year'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3 py-1 text-sm font-medium rounded-md ${
                timeRange === range
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              {range.charAt(0).toUpperCase() + range.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <h4 className="text-sm font-medium text-gray-500">Total Workouts</h4>
          <p className="mt-2 text-3xl font-bold text-indigo-600">{analytics.total_workouts}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h4 className="text-sm font-medium text-gray-500">Total Duration</h4>
          <p className="mt-2 text-3xl font-bold text-indigo-600">
            {Math.round(analytics.total_duration / 60)}h {analytics.total_duration % 60}m
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h4 className="text-sm font-medium text-gray-500">Average Duration</h4>
          <p className="mt-2 text-3xl font-bold text-indigo-600">
            {Math.round(analytics.average_duration)}m
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h4 className="text-sm font-medium text-gray-500">Best Streak</h4>
          <p className="mt-2 text-3xl font-bold text-indigo-600">{analytics.best_streak} days</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h4 className="text-lg font-medium text-gray-900 mb-4">Progress Over Time</h4>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={timeRange === 'week' ? analytics.weekly_progress : analytics.monthly_progress}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey={timeRange === 'week' ? 'date' : 'month'} />
                <YAxis />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="duration"
                  stroke="#4F46E5"
                  strokeWidth={2}
                  dot={{ fill: '#4F46E5', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h4 className="text-lg font-medium text-gray-900 mb-4">Difficulty Distribution</h4>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[
                    { name: 'Beginner', value: analytics.difficulty_distribution.beginner },
                    { name: 'Intermediate', value: analytics.difficulty_distribution.intermediate },
                    { name: 'Advanced', value: analytics.difficulty_distribution.advanced },
                  ]}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {analytics.difficulty_distribution.beginner > 0 && (
                    <Cell fill={COLORS[0]} />
                  )}
                  {analytics.difficulty_distribution.intermediate > 0 && (
                    <Cell fill={COLORS[1]} />
                  )}
                  {analytics.difficulty_distribution.advanced > 0 && (
                    <Cell fill={COLORS[2]} />
                  )}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h4 className="text-lg font-medium text-gray-900 mb-4">Exercise Distribution</h4>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.exercise_distribution}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#4F46E5" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h4 className="text-lg font-medium text-gray-900 mb-4">Time of Day Distribution</h4>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.time_of_day_distribution}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#4F46E5" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  )
} 