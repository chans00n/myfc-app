'use client'

import { useState, useEffect } from 'react'
import { useProgress } from '@/hooks/useProgress'
import { useAchievements } from '@/hooks/useAchievements'
import DashboardLayoutWrapper from '@/components/layouts/DashboardLayoutWrapper'
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
  Legend,
} from 'recharts'
import { CheckCircleIcon, ClockIcon, FireIcon, TrophyIcon, ChartBarIcon } from '@heroicons/react/24/solid'
import RecordProgressForm from '@/components/workouts/RecordProgressForm'
import RecordWorkoutForm from '@/components/workouts/RecordWorkoutForm'

const COLORS = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444']

export default function ProgressPage() {
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year'>('week')
  const [activeTab, setActiveTab] = useState<'overview' | 'workouts' | 'achievements' | 'metrics'>('overview')
  
  const {
    isLoading: progressLoading,
    error: progressError,
    progressData,
    workoutHistory,
    streak,
    refreshData,
  } = useProgress()
  
  const {
    isLoading: achievementsLoading,
    error: achievementsError,
    achievements,
    userAchievements,
    getTotalPoints,
  } = useAchievements()
  
  const isLoading = progressLoading || achievementsLoading
  const error = progressError || achievementsError

  // Format duration from seconds to hours and minutes
  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`
  }

  // Format date to readable format
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    })
  }

  // Group progress data by metric
  const getMetricData = () => {
    const metrics: Record<string, any[]> = {}
    
    if (!progressData || !Array.isArray(progressData)) {
      return metrics;
    }
    
    progressData.forEach(item => {
      if (!metrics[item.metric_name]) {
        metrics[item.metric_name] = []
      }
      
      metrics[item.metric_name].push({
        date: formatDate(item.recorded_at),
        value: item.value,
        notes: item.notes,
      })
    })
    
    return metrics
  }

  // Get workout stats
  const getWorkoutStats = () => {
    if (!workoutHistory.length) return null
    
    const totalWorkouts = workoutHistory.length
    const totalDuration = workoutHistory.reduce((acc, workout) => acc + workout.duration_seconds, 0)
    const avgDuration = Math.round(totalDuration / totalWorkouts)
    
    // Calculate difficulty distribution
    const difficultyDistribution = workoutHistory.reduce((acc: Record<string, number>, workout) => {
      const difficulty = workout.workout_id // This should be replaced with actual difficulty data
      acc[difficulty] = (acc[difficulty] || 0) + 1
      return acc
    }, {})
    
    // Format for pie chart
    const difficultyData = Object.entries(difficultyDistribution).map(([name, value]) => ({
      name,
      value,
    }))
    
    return {
      totalWorkouts,
      totalDuration,
      avgDuration,
      difficultyData,
    }
  }

  // Get weekly workout data
  const getWeeklyData = () => {
    const last7Days = new Date()
    last7Days.setDate(last7Days.getDate() - 7)
    
    const filteredWorkouts = workoutHistory.filter(
      workout => new Date(workout.completed_at) >= last7Days
    )
    
    // Group by day
    const dailyData: Record<string, { date: string, duration: number, count: number }> = {}
    
    filteredWorkouts.forEach(workout => {
      const date = formatDate(workout.completed_at)
      
      if (!dailyData[date]) {
        dailyData[date] = { date, duration: 0, count: 0 }
      }
      
      dailyData[date].duration += workout.duration_seconds
      dailyData[date].count += 1
    })
    
    return Object.values(dailyData)
  }

  if (isLoading) {
    return (
      <DashboardLayoutWrapper>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse space-y-8">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
              ))}
            </div>
            <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        </div>
      </DashboardLayoutWrapper>
    )
  }

  if (error) {
    return (
      <DashboardLayoutWrapper>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-red-50 dark:bg-red-900 p-4 rounded-md">
            <p className="text-red-700 dark:text-red-200">{error}</p>
          </div>
        </div>
      </DashboardLayoutWrapper>
    )
  }

  const workoutStats = getWorkoutStats()
  const weeklyData = getWeeklyData()
  const metricData = getMetricData()

  return (
    <DashboardLayoutWrapper>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">Progress Dashboard</h1>
        
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-indigo-100 dark:bg-indigo-900 mr-4">
                <CheckCircleIcon className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Workouts</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{workoutStats?.totalWorkouts || 0}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-green-100 dark:bg-green-900 mr-4">
                <ClockIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Duration</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatDuration(workoutStats?.totalDuration || 0)}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-amber-100 dark:bg-amber-900 mr-4">
                <FireIcon className="h-6 w-6 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Current Streak</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {streak?.current_streak || 0} days
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-purple-100 dark:bg-purple-900 mr-4">
                <TrophyIcon className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Achievement Points</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{getTotalPoints()}</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Navigation Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700 mb-8">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'overview', name: 'Overview' },
              { id: 'workouts', name: 'Workout History' },
              { id: 'achievements', name: 'Achievements' },
              { id: 'metrics', name: 'Metrics' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`
                  whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
                  ${activeTab === tab.id
                    ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'}
                `}
              >
                {tab.name}
              </button>
            ))}
          </nav>
        </div>
        
        {/* Tab Content */}
        <div className="space-y-8">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <>
              {/* Weekly Progress Chart */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Weekly Progress</h2>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={weeklyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="duration" name="Duration (seconds)" fill="#4F46E5" />
                      <Bar dataKey="count" name="Workouts" fill="#10B981" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              
              {/* Recent Achievements */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Recent Achievements</h2>
                {userAchievements.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {userAchievements.slice(0, 3).map((ua) => {
                      const achievement = achievements.find(a => a.id === ua.achievement_id)
                      if (!achievement) return null
                      
                      return (
                        <div key={ua.id} className="flex items-center p-4 border border-indigo-200 dark:border-indigo-800 rounded-lg bg-indigo-50 dark:bg-indigo-900/30">
                          <div className="text-2xl mr-3">🏆</div>
                          <div>
                            <h3 className="font-medium text-gray-900 dark:text-white">{achievement.name}</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{achievement.description}</p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <p className="text-gray-500 dark:text-gray-400">No achievements earned yet. Keep working out to earn badges!</p>
                )}
              </div>
              
              {/* Recent Workouts */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Recent Workouts</h2>
                {workoutHistory.length > 0 ? (
                  <div className="overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                      <thead className="bg-gray-50 dark:bg-gray-900">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Workout</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Duration</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Rating</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {workoutHistory.slice(0, 5).map((workout) => (
                          <tr key={workout.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                              {formatDate(workout.completed_at)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                              {workout.workout_id}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                              {formatDuration(workout.duration_seconds)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                              {workout.rating ? `${workout.rating}/5` : '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-gray-500 dark:text-gray-400">No workouts recorded yet. Complete a workout to see your history!</p>
                )}
              </div>
            </>
          )}
          
          {/* Workouts Tab */}
          {activeTab === 'workouts' && (
            <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Recent Workouts</h3>
                  {isLoading ? (
                    <div className="animate-pulse space-y-4">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
                      ))}
                    </div>
                  ) : workoutHistory.length > 0 ? (
                    <div className="space-y-4">
                      {workoutHistory.slice(0, 5).map((workout, index) => (
                        <div key={index} className="border-b border-gray-200 dark:border-gray-700 pb-4 last:border-0 last:pb-0">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-medium text-gray-900 dark:text-white">{workout.workout_id}</h4>
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                {formatDate(workout.completed_at)} • {formatDuration(workout.duration_seconds)}
                              </p>
                              {workout.rating !== null && (
                                <div className="flex items-center mt-1">
                                  {[...Array(5)].map((_, i) => (
                                    <svg 
                                      key={i} 
                                      className={`h-4 w-4 ${i < (workout.rating || 0) ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600'}`}
                                      xmlns="http://www.w3.org/2000/svg" 
                                      viewBox="0 0 20 20" 
                                      fill="currentColor"
                                    >
                                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                    </svg>
                                  ))}
                                </div>
                              )}
                            </div>
                            <span className="px-2 py-1 text-xs font-medium rounded-full bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200">
                              Completed
                            </span>
                          </div>
                          {workout.notes && (
                            <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">{workout.notes}</p>
                          )}
                        </div>
                      ))}
                      {workoutHistory.length > 5 && (
                        <div className="text-center">
                          <button 
                            className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300"
                            onClick={() => {/* Implement view more functionality */}}
                          >
                            View all workouts
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-gray-500 dark:text-gray-400">No workout history available. Start recording your workouts!</p>
                  )}
                </div>
                
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Workout Trends</h3>
                  {isLoading ? (
                    <div className="animate-pulse h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  ) : weeklyData.length > 0 ? (
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={weeklyData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} />
                          <XAxis 
                            dataKey="day" 
                            tick={{ fontSize: 12 }}
                            tickFormatter={(value) => value.substring(0, 3)}
                          />
                          <YAxis 
                            tick={{ fontSize: 12 }}
                            tickFormatter={(value) => `${Math.round(value / 60)}m`}
                          />
                          <Tooltip 
                            formatter={(value: number) => [`${Math.floor(value / 60)}m ${value % 60}s`, 'Duration']}
                            labelFormatter={(label) => `${label}`}
                          />
                          <Bar 
                            dataKey="duration" 
                            fill="#6366F1" 
                            radius={[4, 4, 0, 0]}
                            name="Duration"
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <p className="text-gray-500 dark:text-gray-400">No workout data available to display trends.</p>
                  )}
                </div>
              </div>
              
              <div className="lg:col-span-1">
                <RecordWorkoutForm onSuccess={() => refreshData()} />
              </div>
            </div>
          )}
          
          {/* Achievements Tab */}
          {activeTab === 'achievements' && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-medium text-gray-900 dark:text-white">Your Achievements</h2>
                <div className="bg-indigo-100 dark:bg-indigo-900 px-4 py-2 rounded-full">
                  <span className="text-indigo-800 dark:text-indigo-200 font-medium">
                    {userAchievements.length} / {achievements.length} Earned
                  </span>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {achievements.map((achievement) => {
                  const isEarned = userAchievements.some(ua => ua.achievement_id === achievement.id)
                  
                  return (
                    <div 
                      key={achievement.id} 
                      className={`
                        p-4 rounded-lg border 
                        ${isEarned 
                          ? 'border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-900/30' 
                          : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/30 opacity-60'
                        }
                      `}
                    >
                      <div className="flex items-start">
                        <div className="text-3xl mr-3">🏆</div>
                        <div>
                          <h3 className="font-medium text-gray-900 dark:text-white">{achievement.name}</h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{achievement.description}</p>
                          {isEarned && (
                            <span className="inline-flex items-center mt-2 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                              <CheckCircleIcon className="h-3 w-3 mr-1" />
                              Earned
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
          
          {/* Metrics Tab */}
          {activeTab === 'metrics' && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                    <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Track Your Progress</h2>
                    <p className="text-gray-500 dark:text-gray-400 mb-6">
                      Monitor your fitness metrics over time to see your improvement.
                    </p>
                    
                    {Object.keys(metricData).length > 0 ? (
                      Object.entries(metricData).map(([metricName, data]) => (
                        <div key={metricName} className="mb-8">
                          <h3 className="text-md font-medium text-gray-900 dark:text-white mb-4 capitalize">{metricName}</h3>
                          <div className="h-64 mb-4">
                            <ResponsiveContainer width="100%" height="100%">
                              <LineChart data={data}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="date" />
                                <YAxis />
                                <Tooltip />
                                <Line 
                                  type="monotone" 
                                  dataKey="value" 
                                  stroke="#4F46E5" 
                                  strokeWidth={2}
                                  dot={{ fill: '#4F46E5', strokeWidth: 2 }}
                                />
                              </LineChart>
                            </ResponsiveContainer>
                          </div>
                          
                          <div className="overflow-hidden">
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                              <thead className="bg-gray-50 dark:bg-gray-900">
                                <tr>
                                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date</th>
                                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Value</th>
                                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Notes</th>
                                </tr>
                              </thead>
                              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                {data.map((item, index) => (
                                  <tr key={index}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                      {item.date}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                                      {item.value}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                                      {item.notes || '-'}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500 dark:text-gray-400">No metrics recorded yet. Start tracking your progress!</p>
                    )}
                  </div>
                </div>
                
                <div className="lg:col-span-1">
                  <RecordProgressForm onSuccess={refreshData} />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayoutWrapper>
  )
} 