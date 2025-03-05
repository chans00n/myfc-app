'use client'

import { useState } from 'react'
import { useSchedule } from '@/hooks/useSchedule'
import Link from 'next/link'
import { CalendarIcon, CheckIcon, TrashIcon } from '@heroicons/react/24/solid'

export default function WorkoutSchedule() {
  const { 
    scheduledWorkouts, 
    isLoading, 
    error, 
    markAsCompleted, 
    deleteScheduledWorkout,
    getTodayWorkouts,
    getUpcomingWorkouts
  } = useSchedule()
  
  const [activeTab, setActiveTab] = useState<'today' | 'upcoming'>('today')
  
  const todayWorkouts = getTodayWorkouts()
  const upcomingWorkouts = getUpcomingWorkouts()
  
  const handleMarkCompleted = async (id: string) => {
    await markAsCompleted(id)
  }
  
  const handleDelete = async (id: string) => {
    await deleteScheduledWorkout(id)
  }
  
  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })
  }
  
  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Workout Schedule</h2>
        <div className="animate-pulse space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
          ))}
        </div>
      </div>
    )
  }
  
  if (error) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Workout Schedule</h2>
        <div className="bg-red-50 dark:bg-red-900 p-4 rounded-md">
          <p className="text-sm text-red-700 dark:text-red-200">{error}</p>
        </div>
      </div>
    )
  }
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Workout Schedule</h2>
      
      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-700 mb-4">
        <button
          className={`py-2 px-4 text-sm font-medium ${
            activeTab === 'today'
              ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
          onClick={() => setActiveTab('today')}
        >
          Today
        </button>
        <button
          className={`py-2 px-4 text-sm font-medium ${
            activeTab === 'upcoming'
              ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
          onClick={() => setActiveTab('upcoming')}
        >
          Upcoming
        </button>
      </div>
      
      {/* Today's Workouts */}
      {activeTab === 'today' && (
        <div>
          {todayWorkouts.length === 0 ? (
            <div className="text-center py-8">
              <CalendarIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500 dark:text-gray-400">No workouts scheduled for today.</p>
              <Link 
                href="/workouts" 
                className="mt-2 inline-block text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300"
              >
                Browse workouts
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {todayWorkouts.map((workout) => (
                <div 
                  key={workout.id} 
                  className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white">
                        {workout.workout?.title || 'Workout'}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {formatTime(workout.scheduled_for)}
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleMarkCompleted(workout.id)}
                        className="p-1 rounded-full text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900"
                        title="Mark as completed"
                      >
                        <CheckIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(workout.id)}
                        className="p-1 rounded-full text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900"
                        title="Delete"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="mt-2 flex items-center">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      workout.workout?.difficulty === 'beginner' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                      workout.workout?.difficulty === 'intermediate' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                      'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                    }`}>
                      {workout.workout?.difficulty ? 
                        workout.workout.difficulty.charAt(0).toUpperCase() + workout.workout.difficulty.slice(1) 
                        : 'Unknown'}
                    </span>
                    <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                      {workout.workout?.duration_seconds ? `${Math.round(workout.workout.duration_seconds / 60)} min` : ''}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      
      {/* Upcoming Workouts */}
      {activeTab === 'upcoming' && (
        <div>
          {upcomingWorkouts.length === 0 ? (
            <div className="text-center py-8">
              <CalendarIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500 dark:text-gray-400">No upcoming workouts scheduled.</p>
              <Link 
                href="/workouts" 
                className="mt-2 inline-block text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300"
              >
                Schedule a workout
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {upcomingWorkouts.map((workout) => (
                <div 
                  key={workout.id} 
                  className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white">
                        {workout.workout?.title || 'Workout'}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {formatDate(workout.scheduled_for)} at {formatTime(workout.scheduled_for)}
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleDelete(workout.id)}
                        className="p-1 rounded-full text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900"
                        title="Delete"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="mt-2 flex items-center">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      workout.workout?.difficulty === 'beginner' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                      workout.workout?.difficulty === 'intermediate' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                      'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                    }`}>
                      {workout.workout?.difficulty ? 
                        workout.workout.difficulty.charAt(0).toUpperCase() + workout.workout.difficulty.slice(1) 
                        : 'Unknown'}
                    </span>
                    <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                      {workout.workout?.duration_seconds ? `${Math.round(workout.workout.duration_seconds / 60)} min` : ''}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
} 