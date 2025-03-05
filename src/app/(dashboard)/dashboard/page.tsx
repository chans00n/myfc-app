'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import DashboardLayout from '@/components/layouts/DashboardLayout'
import WorkoutRecommendations from '@/components/workouts/WorkoutRecommendations'
import { useProgress } from '@/hooks/useProgress'
import { useAchievements } from '@/hooks/useAchievements'
import { CheckCircleIcon, ClockIcon, FireIcon, TrophyIcon } from '@heroicons/react/24/solid'
import WorkoutSchedule from '@/components/workouts/WorkoutSchedule'

export default function DashboardPage() {
  const { workoutHistory, isLoading: progressLoading } = useProgress()
  const { achievements, isLoading: achievementsLoading } = useAchievements()
  const [greeting, setGreeting] = useState('')
  
  // Calculate total points from achievements
  const totalPoints = achievements.reduce((sum, achievement) => sum + achievement.reward_points, 0)
  
  // Calculate analytics from workout history
  const totalWorkouts = workoutHistory.length
  const totalDuration = workoutHistory.reduce((sum, workout) => sum + workout.duration_seconds, 0)
  const currentStreak = 0 // This would need to be calculated properly
  
  useEffect(() => {
    const hour = new Date().getHours()
    if (hour < 12) {
      setGreeting('Good morning')
    } else if (hour < 18) {
      setGreeting('Good afternoon')
    } else {
      setGreeting('Good evening')
    }
  }, [])
  
  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }
    return `${minutes}m`
  }
  
  const isLoading = progressLoading || achievementsLoading
  
  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">{greeting}!</h1>
        
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard 
            title="Total Workouts" 
            value={isLoading ? '-' : totalWorkouts.toString()} 
            icon={<CheckCircleIcon className="h-6 w-6 text-green-500" />}
            isLoading={isLoading}
          />
          <StatCard 
            title="Total Duration" 
            value={isLoading ? '-' : formatDuration(totalDuration)} 
            icon={<ClockIcon className="h-6 w-6 text-blue-500" />}
            isLoading={isLoading}
          />
          <StatCard 
            title="Current Streak" 
            value={isLoading ? '-' : `${currentStreak} days`} 
            icon={<FireIcon className="h-6 w-6 text-orange-500" />}
            isLoading={isLoading}
          />
          <StatCard 
            title="Achievement Points" 
            value={isLoading ? '-' : totalPoints.toString()} 
            icon={<TrophyIcon className="h-6 w-6 text-yellow-500" />}
            isLoading={isLoading}
          />
        </div>
        
        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Recent Activity */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-medium text-gray-900 dark:text-white">Recent Activity</h2>
                <Link 
                  href="/progress" 
                  className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300"
                >
                  View All
                </Link>
              </div>
              
              {isLoading ? (
                <div className="animate-pulse space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  ))}
                </div>
              ) : workoutHistory.length > 0 ? (
                <div className="space-y-4">
                  {workoutHistory.slice(0, 3).map((workout, index) => (
                    <div key={index} className="border-b border-gray-200 dark:border-gray-700 pb-4 last:border-0 last:pb-0">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium text-gray-900 dark:text-white">{workout.workout_id}</h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {new Date(workout.completed_at).toLocaleDateString()} • {formatDuration(workout.duration_seconds)}
                          </p>
                        </div>
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200">
                          Completed
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400">No workout history available. Start recording your workouts!</p>
              )}
            </div>
            
            {/* Quick Actions */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Quick Actions</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Link 
                  href="/workouts" 
                  className="flex items-center justify-center p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <span className="font-medium text-gray-900 dark:text-white">Browse Workouts</span>
                </Link>
                <Link 
                  href="/progress" 
                  className="flex items-center justify-center p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <span className="font-medium text-gray-900 dark:text-white">View Progress</span>
                </Link>
                <Link 
                  href="/profile" 
                  className="flex items-center justify-center p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <span className="font-medium text-gray-900 dark:text-white">Update Profile</span>
                </Link>
                <Link 
                  href="/settings" 
                  className="flex items-center justify-center p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <span className="font-medium text-gray-900 dark:text-white">Settings</span>
                </Link>
              </div>
            </div>
          </div>
          
          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            <WorkoutSchedule />
            <WorkoutRecommendations />
            
            {/* Achievement Showcase */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-medium text-gray-900 dark:text-white">Recent Achievements</h2>
                <Link 
                  href="/progress?tab=achievements" 
                  className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300"
                >
                  View All
                </Link>
              </div>
              
              {isLoading ? (
                <div className="animate-pulse space-y-4">
                  {[...Array(2)].map((_, i) => (
                    <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <TrophyIcon className="h-12 w-12 text-yellow-500 mx-auto mb-3" />
                  <p className="text-gray-500 dark:text-gray-400">
                    Complete workouts to earn achievements!
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

function StatCard({ title, value, icon, isLoading }: { 
  title: string, 
  value: string, 
  icon: React.ReactNode,
  isLoading: boolean
}) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <div className="flex items-center">
        <div className="flex-shrink-0">
          {icon}
        </div>
        <div className="ml-5 w-0 flex-1">
          <dl>
            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
              {title}
            </dt>
            <dd>
              {isLoading ? (
                <div className="h-6 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mt-1"></div>
              ) : (
                <div className="text-lg font-medium text-gray-900 dark:text-white">
                  {value}
                </div>
              )}
            </dd>
          </dl>
        </div>
      </div>
    </div>
  )
} 