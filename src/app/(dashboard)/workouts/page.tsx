import { getCurrentUser } from '@/lib/auth'
import DashboardLayout from '@/components/layouts/DashboardLayout'
import { createServerSupabaseClient } from '@/lib/auth'
import { formatDate } from '@/lib/utils'
import Image from 'next/image'

// Base64 encoded placeholder image for workouts
const DEFAULT_WORKOUT_IMAGE = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjYwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8IS0tIEJhY2tncm91bmQgLS0+CiAgPHJlY3QgeD0iMCIgeT0iMCIgd2lkdGg9IjgwMCIgaGVpZ2h0PSI2MDAiIGZpbGw9IiNmMGYwZjAiIC8+CgogIDwhLS0gRHVtYmJlbGwgLS0+CiAgPGcgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoNDAwLCAzMDApIj4KICAgIDwhLS0gRHVtYmJlbGwgYmFyIC0tPgogICAgPHJlY3QgeD0iLTE1MCIgeT0iLTEwIiB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwIiByeD0iNSIgcnk9IjUiIGZpbGw9IiM2NjY2NjYiIC8+CgogICAgPCEtLSBEdW1iYmVsbCB3ZWlnaHRzIC0tPgogICAgPGcgZmlsbD0iIzQ0NDQ0NCI+CiAgICAgIDxjaXJjbGUgY3g9Ii0xNzAiIGN5PSIwIiByPSI0MCIgLz4KICAgICAgPGNpcmNsZSBjeD0iMTcwIiBjeT0iMCIgcj0iNDAiIC8+CiAgICA8L2c+CiAgPC9nPgoKICA8IS0tIFRleHQgLS0+CiAgPHRleHQgeD0iNDAwIiB5PSI0MDAiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIzMCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0iIzY2NjY2NiI+V29ya291dCBJbWFnZTwvdGV4dD4KPC9zdmc+'

async function getWorkouts() {
  const supabase = createServerSupabaseClient()
  const { data: workouts } = await supabase
    .from('workouts')
    .select('*')
    .order('date', { ascending: true })
    .limit(7)

  return workouts
}

export default async function WorkoutsPage() {
  const user = await getCurrentUser()
  const workouts = await getWorkouts()

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium leading-6 text-gray-900">Daily Workouts</h3>
            <div className="mt-2 max-w-xl text-sm text-gray-500">
              <p>Access your daily face workout routines and track your progress.</p>
            </div>
          </div>
        </div>

        {/* Workouts Grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {workouts?.map((workout) => (
            <div
              key={workout.id}
              className="bg-white overflow-hidden shadow rounded-lg divide-y divide-gray-200"
            >
              <div className="relative pb-48">
                <img
                  className="absolute h-full w-full object-cover"
                  src={workout.thumbnail_url || DEFAULT_WORKOUT_IMAGE}
                  alt={workout.title}
                  onError={(e) => {
                    // Fallback if the image fails to load
                    e.currentTarget.src = DEFAULT_WORKOUT_IMAGE;
                  }}
                />
              </div>
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900">{workout.title}</h3>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      workout.difficulty === 'beginner'
                        ? 'bg-green-100 text-green-800'
                        : workout.difficulty === 'intermediate'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {workout.difficulty.charAt(0).toUpperCase() + workout.difficulty.slice(1)}
                  </span>
                </div>
                <p className="mt-2 text-sm text-gray-500">{workout.description}</p>
                <div className="mt-4 flex items-center justify-between">
                  <div className="flex items-center text-sm text-gray-500">
                    <svg
                      className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    {workout.duration} minutes
                  </div>
                  <div className="text-sm text-gray-500">{formatDate(workout.date)}</div>
                </div>
                <div className="mt-6">
                  <button
                    type="button"
                    className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Start Workout
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  )
} 