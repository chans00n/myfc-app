import { getCurrentUser } from '@/lib/auth'
import DashboardLayout from '@/components/layouts/DashboardLayout'
import { createServerSupabaseClient } from '@/lib/auth'

async function getMovements() {
  const supabase = createServerSupabaseClient()
  const { data: movements } = await supabase
    .from('movements')
    .select('*')
    .order('category', { ascending: true })

  return movements
}

async function getCategories() {
  const supabase = createServerSupabaseClient()
  const { data: movements } = await supabase.from('movements').select('category')
  const categories = [...new Set(movements?.map((m) => m.category) || [])]
  return categories
}

export default async function MovementLibraryPage() {
  const user = await getCurrentUser()
  const movements = await getMovements()
  const categories = await getCategories()

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium leading-6 text-gray-900">Movement Library</h3>
            <div className="mt-2 max-w-xl text-sm text-gray-500">
              <p>Browse our comprehensive collection of face exercises with video guidance.</p>
            </div>
          </div>
        </div>

        {/* Categories */}
        <div className="bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h4 className="text-sm font-medium text-gray-500">Categories</h4>
            <div className="mt-4 flex flex-wrap gap-2">
              {categories.map((category) => (
                <button
                  key={category}
                  type="button"
                  className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Movements Grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {movements?.map((movement) => (
            <div
              key={movement.id}
              className="bg-white overflow-hidden shadow rounded-lg divide-y divide-gray-200"
            >
              <div className="relative pb-48">
                <img
                  className="absolute h-full w-full object-cover"
                  src={movement.thumbnail_url}
                  alt={movement.name}
                />
              </div>
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900">{movement.name}</h3>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      movement.difficulty === 'beginner'
                        ? 'bg-green-100 text-green-800'
                        : movement.difficulty === 'intermediate'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {movement.difficulty.charAt(0).toUpperCase() + movement.difficulty.slice(1)}
                  </span>
                </div>
                <p className="mt-2 text-sm text-gray-500">{movement.description}</p>
                <div className="mt-4">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                    {movement.category}
                  </span>
                </div>
                <div className="mt-6">
                  <button
                    type="button"
                    className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Watch Video
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