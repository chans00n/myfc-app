'use client'

import { useState, useEffect } from 'react'
import { useProgress } from '@/hooks/useProgress'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Database } from '@/types/database'

type Workout = Database['public']['Tables']['workouts']['Row']

interface RecordWorkoutFormProps {
  onSuccess?: () => void
}

export default function RecordWorkoutForm({ onSuccess }: RecordWorkoutFormProps) {
  const [workouts, setWorkouts] = useState<Workout[]>([])
  const [selectedWorkoutId, setSelectedWorkoutId] = useState('')
  const [durationMinutes, setDurationMinutes] = useState('')
  const [rating, setRating] = useState<number | null>(null)
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  
  const { recordWorkout } = useProgress()
  const supabase = createClientComponentClient<Database>()
  
  // Fetch available workouts
  useEffect(() => {
    async function fetchWorkouts() {
      try {
        const { data, error } = await supabase
          .from('workouts')
          .select('*')
          .order('date', { ascending: false })
        
        if (error) throw error
        
        setWorkouts(data || [])
      } catch (err) {
        console.error('Error fetching workouts:', err)
        setError('Failed to load workouts')
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchWorkouts()
  }, [supabase])
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)
    setSuccess(false)
    
    try {
      if (!selectedWorkoutId) {
        throw new Error('Please select a workout')
      }
      
      if (!durationMinutes || isNaN(Number(durationMinutes))) {
        throw new Error('Please enter a valid duration')
      }
      
      // Convert minutes to seconds
      const durationSeconds = Math.round(Number(durationMinutes) * 60)
      
      const result = await recordWorkout(
        selectedWorkoutId,
        durationSeconds,
        rating === null ? undefined : rating,
        notes || undefined
      )
      
      if (!result) {
        throw new Error('Failed to record workout')
      }
      
      // Reset form
      setSelectedWorkoutId('')
      setDurationMinutes('')
      setRating(null)
      setNotes('')
      setSuccess(true)
      
      // Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Record Completed Workout</h2>
      
      {error && (
        <div className="mb-4 bg-red-50 dark:bg-red-900 p-4 rounded-md">
          <p className="text-sm text-red-700 dark:text-red-200">{error}</p>
        </div>
      )}
      
      {success && (
        <div className="mb-4 bg-green-50 dark:bg-green-900 p-4 rounded-md">
          <p className="text-sm text-green-700 dark:text-green-200">Workout recorded successfully!</p>
        </div>
      )}
      
      {isLoading ? (
        <div className="animate-pulse space-y-4">
          <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="workoutId" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Workout
            </label>
            <select
              id="workoutId"
              value={selectedWorkoutId}
              onChange={(e) => setSelectedWorkoutId(e.target.value)}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-700 dark:bg-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
              required
            >
              <option value="">Select a workout</option>
              {workouts.map((workout) => (
                <option key={workout.id} value={workout.id}>
                  {workout.title} ({workout.difficulty})
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label htmlFor="duration" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Duration (minutes)
            </label>
            <input
              type="number"
              id="duration"
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(e.target.value)}
              min="1"
              step="1"
              className="mt-1 block w-full border-gray-300 dark:border-gray-700 dark:bg-gray-900 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="e.g., 30"
              required
            />
          </div>
          
          <div>
            <label htmlFor="rating" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Rating (optional)
            </label>
            <div className="mt-1 flex items-center space-x-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className={`
                    p-1 rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500
                    ${rating && rating >= star ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600'}
                  `}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                </button>
              ))}
              {rating && (
                <button
                  type="button"
                  onClick={() => setRating(null)}
                  className="ml-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
          
          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Notes (optional)
            </label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="mt-1 block w-full border border-gray-300 dark:border-gray-700 dark:bg-gray-900 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="How did the workout feel? Any modifications?"
            />
          </div>
          
          <div>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`
                w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white 
                ${isSubmitting 
                  ? 'bg-indigo-400 cursor-not-allowed' 
                  : 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
                }
              `}
            >
              {isSubmitting ? 'Recording...' : 'Record Workout'}
            </button>
          </div>
        </form>
      )}
    </div>
  )
} 