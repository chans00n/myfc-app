import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import Link from 'next/link'
import WorkoutCard from '@/components/workouts/WorkoutCard'

// Function to fetch workouts from Supabase
async function getWorkouts() {
  const supabase = createServerComponentClient({ cookies })
  
  const { data: workouts, error } = await supabase
    .from('workouts')
    .select('*')
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error('Error fetching workouts:', error)
    return []
  }
  
  return workouts || []
}

export default async function WorkoutsPage() {
  const workouts = await getWorkouts()
  
  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-gray-900">Workouts</h1>
          <Link
            href="/workouts/create"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Create Workout
          </Link>
        </div>
        
        <div className="mt-6 grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {workouts.map((workout) => (
            <Link key={workout.id} href={`/workouts/${workout.id}`}>
              <WorkoutCard workout={workout} />
            </Link>
          ))}
          
          {workouts.length === 0 && (
            <div className="col-span-full text-center py-12">
              <h3 className="mt-2 text-lg font-medium text-gray-900">No workouts found</h3>
              <p className="mt-1 text-sm text-gray-500">Get started by creating a new workout.</p>
              <div className="mt-6">
                <Link
                  href="/workouts/create"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Create Workout
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 