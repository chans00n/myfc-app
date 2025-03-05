'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Database } from '@/types/database'
import { useProgress } from './useProgress'

type Workout = Database['public']['Tables']['workouts']['Row']
type WorkoutProgress = Database['public']['Tables']['workout_progress']['Row']

export function useRecommendations() {
  const [recommendations, setRecommendations] = useState<Workout[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const { workoutHistory } = useProgress()
  const supabase = createClientComponentClient<Database>()
  
  const fetchRecommendations = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const { data: { session } } = await supabase.auth.getSession()
      console.log('Recommendations - Auth session:', session ? 'Found' : 'Not found')
      if (!session) {
        throw new Error('No active session')
      }
      
      // Get all available workouts
      const { data: workouts, error: workoutsError } = await supabase
        .from('workouts')
        .select('*')
      
      console.log('Recommendations - Workouts data:', workouts ? `Found ${workouts.length} records` : 'No data', workoutsError ? `Error: ${workoutsError.message}` : 'No error')
      
      if (workoutsError) throw workoutsError
      
      if (!workouts || workouts.length === 0) {
        setRecommendations([])
        return
      }
      
      // Generate personalized recommendations
      const personalizedRecommendations = generateRecommendations(workouts, workoutHistory)
      setRecommendations(personalizedRecommendations)
    } catch (err) {
      console.error('Error fetching recommendations:', err)
      setError('Failed to load workout recommendations')
    } finally {
      setIsLoading(false)
    }
  }, [supabase, workoutHistory])
  
  const generateRecommendations = (
    allWorkouts: Workout[],
    history: WorkoutProgress[]
  ): Workout[] => {
    if (!allWorkouts.length) return []
    
    // Create a set of recently completed workout IDs
    const recentWorkoutIds = new Set(
      history.slice(0, 5).map(workout => workout.workout_id)
    )
    
    // Determine user's current level based on workout history
    let userLevel = 'beginner'
    if (history.length > 20) {
      userLevel = 'advanced'
    } else if (history.length > 5) {
      userLevel = 'intermediate'
    }
    
    // Score each workout based on various factors
    const scoredWorkouts = allWorkouts.map(workout => {
      let score = 0
      
      // Prefer workouts that match the user's level
      if (workout.difficulty === userLevel) {
        score += 5
      } else if (
        (userLevel === 'beginner' && workout.difficulty === 'intermediate') ||
        (userLevel === 'intermediate' && workout.difficulty === 'advanced')
      ) {
        // Slightly challenge the user with next level
        score += 3
      }
      
      // Avoid recently completed workouts
      if (recentWorkoutIds.has(workout.id)) {
        score -= 10
      }
      
      // Prefer variety in workout types (based on title keywords)
      const hasVariety = hasWorkoutVariety(workout, history)
      if (hasVariety) {
        score += 2
      }
      
      return { workout, score }
    })
    
    // Sort by score (highest first) and return the top 5
    return scoredWorkouts
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map(item => item.workout)
  }
  
  const hasWorkoutVariety = (workout: Workout, history: WorkoutProgress[]): boolean => {
    // Simple implementation - check if the workout title contains keywords
    // that aren't common in recent workouts
    const recentTitles = history.slice(0, 5).map(w => w.workout_id.toLowerCase())
    const workoutTitle = workout.title.toLowerCase()
    
    // Extract keywords (this is a simplified approach)
    const keywords = workoutTitle.split(' ')
    
    // Check if any keywords are not present in recent workouts
    return keywords.some(keyword => 
      !recentTitles.some(title => title.includes(keyword))
    )
  }
  
  // Initialize recommendations on mount
  useEffect(() => {
    if (workoutHistory.length > 0) {
      fetchRecommendations()
    }
  }, [fetchRecommendations, workoutHistory])
  
  return {
    recommendations,
    isLoading,
    error,
    fetchRecommendations
  }
} 