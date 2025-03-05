'use client'

import { useState, useEffect, useRef } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import WorkoutSummary from './WorkoutSummary'
import DifficultySelector from './DifficultySelector'

type Difficulty = 'beginner' | 'intermediate' | 'advanced'

type Exercise = {
  id: string
  name: string
  description: string
  video_url: string
  duration: number
  rest_duration: number
  difficulty: Difficulty
}

type WorkoutPlayerProps = {
  workoutId: string
  exercises: Exercise[]
  onComplete: () => void
}

type PlaybackSpeed = 0.5 | 0.75 | 1 | 1.25 | 1.5 | 2

export default function WorkoutPlayer({ workoutId, exercises, onComplete }: WorkoutPlayerProps) {
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState(0)
  const [isResting, setIsResting] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [showSummary, setShowSummary] = useState(false)
  const [playbackSpeed, setPlaybackSpeed] = useState<PlaybackSpeed>(1)
  const [difficulty, setDifficulty] = useState<Difficulty>('beginner')
  const videoRef = useRef<HTMLVideoElement>(null)
  const timerRef = useRef<NodeJS.Timeout | undefined>(undefined)
  const supabase = createClientComponentClient()

  const currentExercise = exercises[currentExerciseIndex]
  const totalExercises = exercises.length

  const getDifficultyMultiplier = (diff: Difficulty) => {
    switch (diff) {
      case 'beginner':
        return 1
      case 'intermediate':
        return 1.2
      case 'advanced':
        return 1.5
      default:
        return 1
    }
  }

  const getAdjustedDuration = (duration: number) => {
    return Math.round(duration * getDifficultyMultiplier(difficulty))
  }

  const skipExercise = () => {
    if (currentExerciseIndex < totalExercises - 1) {
      setCurrentExerciseIndex((prev) => prev + 1)
      setIsPlaying(false)
      if (videoRef.current) {
        videoRef.current.pause()
      }
    }
  }

  const adjustPlaybackSpeed = (speed: PlaybackSpeed) => {
    setPlaybackSpeed(speed)
    if (videoRef.current) {
      videoRef.current.playbackRate = speed
    }
  }

  const handleDifficultyChange = (newDifficulty: Difficulty) => {
    setDifficulty(newDifficulty)
    if (currentExercise) {
      setTimeRemaining(getAdjustedDuration(currentExercise.duration))
    }
  }

  useEffect(() => {
    if (currentExercise) {
      setTimeRemaining(getAdjustedDuration(currentExercise.duration))
      setIsResting(false)
      if (videoRef.current) {
        videoRef.current.playbackRate = playbackSpeed
      }
    }
  }, [currentExerciseIndex, playbackSpeed, difficulty])

  useEffect(() => {
    if (isPlaying && timeRemaining > 0) {
      const interval = Math.floor(1000 / playbackSpeed)
      timerRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            if (isResting) {
              setIsResting(false)
              if (currentExerciseIndex < totalExercises - 1) {
                setCurrentExerciseIndex((prev) => prev + 1)
                return getAdjustedDuration(currentExercise.duration)
              } else {
                setIsPlaying(false)
                handleWorkoutComplete()
                return 0
              }
            } else {
              setIsResting(true)
              return getAdjustedDuration(currentExercise.rest_duration)
            }
          }
          return prev - 1
        })
      }, interval)
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [isPlaying, timeRemaining, isResting, currentExerciseIndex, currentExercise, totalExercises, playbackSpeed, difficulty])

  useEffect(() => {
    setProgress((currentExerciseIndex / totalExercises) * 100)
  }, [currentExerciseIndex, totalExercises])

  const handleWorkoutComplete = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { error: updateError } = await supabase
        .from('workout_progress')
        .insert({
          user_id: user.id,
          workout_id: workoutId,
          completed_at: new Date().toISOString(),
        })

      if (updateError) throw updateError

      setShowSummary(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save workout progress')
    }
  }

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying)
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause()
      } else {
        videoRef.current.play()
      }
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (!currentExercise) return null

  return (
    <>
      <div className="space-y-6">
        <DifficultySelector
          currentDifficulty={difficulty}
          onSelect={handleDifficultyChange}
        />

        <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
          <video
            ref={videoRef}
            src={currentExercise.video_url}
            className="w-full h-full object-cover"
            loop
            muted
          />
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <button
              onClick={togglePlayPause}
              className="p-4 rounded-full bg-white bg-opacity-20 hover:bg-opacity-30 transition-colors"
            >
              {isPlaying ? (
                <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ) : (
                <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900">{currentExercise.name}</h3>
            <span className="text-sm font-medium text-gray-500">
              Exercise {currentExerciseIndex + 1} of {totalExercises}
            </span>
          </div>

          <div className="relative pt-1">
            <div className="flex mb-2 items-center justify-between">
              <div>
                <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-indigo-600 bg-indigo-200">
                  Progress
                </span>
              </div>
              <div className="text-right">
                <span className="text-xs font-semibold inline-block text-indigo-600">
                  {Math.round(progress)}%
                </span>
              </div>
            </div>
            <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-indigo-200">
              <div
                style={{ width: `${progress}%` }}
                className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-indigo-500 transition-all duration-500"
              />
            </div>
          </div>

          <div className="flex justify-between items-center">
            <div className="text-center">
              <span className="text-sm font-medium text-gray-500">
                {isResting ? 'Rest Time' : 'Exercise Time'}
              </span>
              <p className="text-2xl font-bold text-gray-900">{formatTime(timeRemaining)}</p>
            </div>
            <div className="flex gap-2">
              {currentExerciseIndex < totalExercises - 1 && (
                <button
                  onClick={skipExercise}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Skip
                </button>
              )}
              <button
                onClick={togglePlayPause}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                {isPlaying ? 'Pause' : 'Resume'}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-center space-x-2">
            <span className="text-sm font-medium text-gray-500">Speed:</span>
            <div className="flex space-x-1">
              {[0.5, 0.75, 1, 1.25, 1.5, 2].map((speed) => (
                <button
                  key={speed}
                  onClick={() => adjustPlaybackSpeed(speed as PlaybackSpeed)}
                  className={`px-3 py-1 text-sm font-medium rounded-md ${
                    playbackSpeed === speed
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {speed}x
                </button>
              ))}
            </div>
          </div>

          <p className="text-sm text-gray-500">{currentExercise.description}</p>
        </div>

        {error && (
          <div className="rounded-md bg-red-50 p-4">
            <div className="text-sm text-red-700">{error}</div>
          </div>
        )}
      </div>

      {showSummary && (
        <WorkoutSummary
          workoutId={workoutId}
          exercises={exercises}
          onClose={() => {
            setShowSummary(false)
            onComplete()
          }}
        />
      )}
    </>
  )
} 