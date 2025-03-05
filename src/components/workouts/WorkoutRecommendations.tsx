'use client'

import { useState } from 'react'
import { useRecommendations } from '@/hooks/useRecommendations'
import Link from 'next/link'
import { useTheme } from '@/contexts/ThemeContext'

export default function WorkoutRecommendations() {
  const { recommendations, isLoading, error } = useRecommendations()
  const { theme } = useTheme()
  
  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Recommended Workouts</h2>
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
        <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Recommended Workouts</h2>
        <div className="bg-red-50 dark:bg-red-900 p-4 rounded-md">
          <p className="text-sm text-red-700 dark:text-red-200">{error}</p>
        </div>
      </div>
    )
  }
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Recommended Workouts</h2>
      
      {recommendations.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400">
          Complete some workouts to get personalized recommendations!
        </p>
      ) : (
        <div className="space-y-4">
          {recommendations.map((workout) => (
            <div 
              key={workout.id} 
              className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white">{workout.title}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {workout.duration_seconds / 60} min • {workout.difficulty.charAt(0).toUpperCase() + workout.difficulty.slice(1)}
                  </p>
                </div>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  workout.difficulty === 'beginner' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                  workout.difficulty === 'intermediate' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                  'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                }`}>
                  {workout.difficulty.charAt(0).toUpperCase() + workout.difficulty.slice(1)}
                </span>
              </div>
              
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-2 line-clamp-2">
                {workout.description}
              </p>
              
              <div className="mt-4 flex justify-end">
                <Link
                  href={`/workouts/${workout.id}`}
                  className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300"
                >
                  Start Workout →
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
} 