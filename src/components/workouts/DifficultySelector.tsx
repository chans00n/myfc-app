'use client'

type Difficulty = 'beginner' | 'intermediate' | 'advanced'

type DifficultySelectorProps = {
  currentDifficulty: Difficulty
  onSelect: (difficulty: Difficulty) => void
}

export default function DifficultySelector({ currentDifficulty, onSelect }: DifficultySelectorProps) {
  const difficulties: { value: Difficulty; label: string; description: string }[] = [
    {
      value: 'beginner',
      label: 'Beginner',
      description: 'Perfect for starting your journey',
    },
    {
      value: 'intermediate',
      label: 'Intermediate',
      description: 'For those with some experience',
    },
    {
      value: 'advanced',
      label: 'Advanced',
      description: 'Challenging exercises for experienced users',
    },
  ]

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Difficulty Level
        </label>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {difficulties.map((difficulty) => (
            <button
              key={difficulty.value}
              onClick={() => onSelect(difficulty.value)}
              className={`relative rounded-lg border p-4 flex flex-col items-center text-center focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                currentDifficulty === difficulty.value
                  ? 'border-indigo-500 bg-indigo-50'
                  : 'border-gray-300 hover:border-indigo-500'
              }`}
            >
              <span
                className={`text-sm font-medium ${
                  currentDifficulty === difficulty.value ? 'text-indigo-600' : 'text-gray-900'
                }`}
              >
                {difficulty.label}
              </span>
              <span className="mt-1 text-xs text-gray-500">{difficulty.description}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
} 