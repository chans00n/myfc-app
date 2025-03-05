'use client'

import React, { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Database } from '@/types/database'
import { Achievement, ACHIEVEMENTS } from '@/lib/achievements'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import ShareAchievementButton from '@/components/achievements/ShareAchievementButton'

type UserAchievement = Database['public']['Tables']['user_achievements']['Row']

type AchievementsDisplayProps = {
  stats: {
    current_streak: number
    total_duration: number
    difficulty_distribution: {
      advanced: number
    }
    unique_exercises: number
  }
}

export default function AchievementsDisplay({ stats }: AchievementsDisplayProps) {
  const [userAchievements, setUserAchievements] = useState<UserAchievement[]>([])
  const [weeklyProgress, setWeeklyProgress] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClientComponentClient()

  useEffect(() => {
    async function fetchAchievements() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error('Not authenticated')

        // Fetch user achievements
        const { data: achievements, error: achievementsError } = await supabase
          .from('user_achievements')
          .select('*')
          .eq('user_id', user.id)

        if (achievementsError) throw achievementsError
        setUserAchievements(achievements || [])

        // Fetch weekly progress
        const { data: progress, error: progressError } = await supabase
          .from('workout_progress')
          .select('completed_at, duration')
          .eq('user_id', user.id)
          .gte('completed_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
          .order('completed_at', { ascending: true })

        if (progressError) throw progressError

        // Process weekly progress data
        const weeklyData = progress.reduce((acc: any[], workout) => {
          const date = new Date(workout.completed_at).toLocaleDateString()
          const existingDay = acc.find(d => d.date === date)
          
          if (existingDay) {
            existingDay.duration += workout.duration
          } else {
            acc.push({
              date,
              duration: workout.duration
            })
          }
          
          return acc
        }, [])

        setWeeklyProgress(weeklyData)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch achievements')
      } finally {
        setLoading(false)
      }
    }

    fetchAchievements()
  }, [supabase])

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

  const earnedAchievements = ACHIEVEMENTS.filter(achievement =>
    userAchievements.some(ua => ua.achievement_id === achievement.id)
  )

  const unearnedAchievements = ACHIEVEMENTS.filter(achievement =>
    !userAchievements.some(ua => ua.achievement_id === achievement.id)
  )

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Weekly Progress</h3>
        <div className="bg-white p-6 rounded-lg shadow h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={weeklyProgress}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
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

      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Your Achievements</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {earnedAchievements.map((achievement) => (
            <div key={achievement.id} className="flex items-center justify-between p-3 border-b border-gray-100">
              <div className="flex items-center space-x-3">
                <div className="text-2xl">🏆</div>
                <div>
                  <h4 className="font-medium">{achievement.name}</h4>
                  <p className="text-sm text-gray-500">{achievement.description}</p>
                </div>
              </div>
              <ShareAchievementButton 
                achievementId={achievement.id} 
                achievementName={achievement.name} 
                isEarned={true} 
              />
            </div>
          ))}
          {unearnedAchievements.map((achievement) => (
            <div key={achievement.id} className="flex items-center justify-between p-3 border-b border-gray-100 opacity-60">
              <div className="flex items-center space-x-3">
                <div className="text-2xl">🔒</div>
                <div>
                  <h4 className="font-medium">{achievement.name}</h4>
                  <p className="text-sm text-gray-500">{achievement.description}</p>
                </div>
              </div>
              <ShareAchievementButton 
                achievementId={achievement.id} 
                achievementName={achievement.name} 
                isEarned={false} 
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
} 