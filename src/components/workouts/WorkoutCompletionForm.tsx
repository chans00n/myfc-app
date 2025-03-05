'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
// Temporarily use emoji stars instead of Heroicons due to import issues
// import { StarIcon } from '@heroicons/react/24/solid'
// import { StarIcon as StarOutlineIcon } from '@heroicons/react/24/outline'
import { useSocial } from '@/hooks/useSocial'

interface WorkoutCompletionFormProps {
  workoutId: string
  workoutTitle: string
  durationSeconds: number
  onSuccess?: () => void
}

export default function WorkoutCompletionForm({
  workoutId,
  workoutTitle,
  durationSeconds,
  onSuccess
}: WorkoutCompletionFormProps) {
  const [actualDuration, setActualDuration] = useState(durationSeconds)
  const [rating, setRating] = useState<number | null>(null)
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [shareWorkout, setShareWorkout] = useState(false)
  
  const router = useRouter()
  const { toast } = useToast()
  const { shareWorkout: shareWorkoutToSocial } = useSocial()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Record workout completion logic here
      // This would typically involve a database call
      
      // If user chose to share the workout, share it to their social feed
      if (shareWorkout && rating !== null) {
        await shareWorkoutToSocial(workoutId, actualDuration, rating, notes)
      } else if (shareWorkout) {
        await shareWorkoutToSocial(workoutId, actualDuration, undefined, notes)
      }
      
      toast({
        title: 'Workout Completed!',
        description: `You've successfully completed ${workoutTitle}`,
        variant: 'success'
      })
      
      if (onSuccess) {
        onSuccess()
      } else {
        router.push('/workouts')
      }
    } catch (error) {
      console.error('Error completing workout:', error)
      toast({
        title: 'Error',
        description: 'Failed to record workout completion. Please try again.',
        variant: 'destructive'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">
          Congratulations!
        </h2>
        <p className="text-muted-foreground">
          You've completed <span className="font-medium">{workoutTitle}</span>. 
          Please take a moment to record your experience.
        </p>
      </div>
      
      <div className="space-y-2">
        <label className="text-sm font-medium">
          Actual Duration (minutes)
        </label>
        <Input
          type="number"
          value={Math.round(actualDuration / 60)}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setActualDuration(parseInt(e.target.value) * 60)}
          min={1}
          required
        />
      </div>
      
      <div className="space-y-2">
        <label className="text-sm font-medium">
          Rate this workout
        </label>
        <div className="flex space-x-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              className="text-yellow-400 focus:outline-none text-2xl"
            >
              {rating && star <= rating ? '⭐' : '☆'}
            </button>
          ))}
        </div>
      </div>
      
      <div className="space-y-2">
        <label className="text-sm font-medium">
          Notes (optional)
        </label>
        <Textarea
          value={notes}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNotes(e.target.value)}
          placeholder="How did you feel? Was it challenging? Any modifications?"
          rows={3}
        />
      </div>
      
      <div className="flex items-center space-x-2">
        <Checkbox 
          id="share" 
          checked={shareWorkout}
          onCheckedChange={(checked: boolean) => setShareWorkout(checked)}
        />
        <label
          htmlFor="share"
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          Share this workout with followers
        </label>
      </div>
      
      <div className="flex space-x-2">
        <Button
          type="submit"
          disabled={isSubmitting}
          className="flex-1"
        >
          {isSubmitting ? 'Saving...' : 'Complete Workout'}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
      </div>
    </form>
  )
} 