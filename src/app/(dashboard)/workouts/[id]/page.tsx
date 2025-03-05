import { notFound } from 'next/navigation'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import DashboardLayout from '@/components/layout/DashboardLayout'
import WorkoutPlayer from '@/components/workouts/WorkoutPlayer'
import WorkoutStats from '@/components/workouts/WorkoutStats'

async function getWorkout(id: string) {
  const supabase = createServerComponentClient({ cookies })
  
  const { data: workout, error } = await supabase
    .from('workouts')
    .select(`
      *,
      exercises:workout_exercises(
        exercise:exercises(
          id,
          name,
          description,
          video_url,
          duration,
          rest_duration
        )
      )
    `)
    .eq('id', id)
    .single()

  if (error || !workout) {
    return null
  }

  return {
    ...workout,
    exercises: workout.exercises.map((e: any) => e.exercise)
  }
}

export default async function WorkoutPage({ params }: { params: { id: string } }) {
  const workout = await getWorkout(params.id)
  
  if (!workout) {
    notFound()
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">{workout.title}</h1>
            <p className="mt-2 text-sm text-gray-500">{workout.description}</p>
          </div>

          <div className="space-y-8">
            <WorkoutStats workoutId={workout.id} />
            <WorkoutPlayer
              workoutId={workout.id}
              exercises={workout.exercises}
              onComplete={() => {
                // Handle workout completion
                window.location.href = '/workouts'
              }}
            />
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
} 