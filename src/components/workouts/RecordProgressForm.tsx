'use client'

import { useState } from 'react'
import { useProgress } from '@/hooks/useProgress'

// Common metrics that users might want to track
const COMMON_METRICS = [
  { name: 'weight', label: 'Weight (lbs)' },
  { name: 'body_fat', label: 'Body Fat %' },
  { name: 'chest', label: 'Chest (inches)' },
  { name: 'waist', label: 'Waist (inches)' },
  { name: 'hips', label: 'Hips (inches)' },
  { name: 'biceps', label: 'Biceps (inches)' },
  { name: 'thighs', label: 'Thighs (inches)' },
  { name: 'resting_heart_rate', label: 'Resting Heart Rate (bpm)' },
]

interface RecordProgressFormProps {
  onSuccess?: () => void
}

export default function RecordProgressForm({ onSuccess }: RecordProgressFormProps) {
  const [metricName, setMetricName] = useState('')
  const [customMetricName, setCustomMetricName] = useState('')
  const [metricValue, setMetricValue] = useState('')
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  
  const { recordProgress } = useProgress()
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)
    setSuccess(false)
    
    try {
      const finalMetricName = metricName === 'custom' ? customMetricName : metricName
      
      if (!finalMetricName) {
        throw new Error('Please select or enter a metric name')
      }
      
      if (!metricValue || isNaN(Number(metricValue))) {
        throw new Error('Please enter a valid numeric value')
      }
      
      const result = await recordProgress(
        finalMetricName,
        Number(metricValue),
        notes || undefined
      )
      
      if (!result) {
        throw new Error('Failed to record progress')
      }
      
      // Reset form
      setMetricName('')
      setCustomMetricName('')
      setMetricValue('')
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
      <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Record New Progress</h2>
      
      {error && (
        <div className="mb-4 bg-red-50 dark:bg-red-900 p-4 rounded-md">
          <p className="text-sm text-red-700 dark:text-red-200">{error}</p>
        </div>
      )}
      
      {success && (
        <div className="mb-4 bg-green-50 dark:bg-green-900 p-4 rounded-md">
          <p className="text-sm text-green-700 dark:text-green-200">Progress recorded successfully!</p>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="metricName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Metric
          </label>
          <select
            id="metricName"
            value={metricName}
            onChange={(e) => setMetricName(e.target.value)}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-700 dark:bg-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
            required
          >
            <option value="">Select a metric</option>
            {COMMON_METRICS.map((metric) => (
              <option key={metric.name} value={metric.name}>
                {metric.label}
              </option>
            ))}
            <option value="custom">Custom metric...</option>
          </select>
        </div>
        
        {metricName === 'custom' && (
          <div>
            <label htmlFor="customMetricName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Custom Metric Name
            </label>
            <input
              type="text"
              id="customMetricName"
              value={customMetricName}
              onChange={(e) => setCustomMetricName(e.target.value)}
              className="mt-1 block w-full border-gray-300 dark:border-gray-700 dark:bg-gray-900 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="e.g., Vertical Jump"
              required
            />
          </div>
        )}
        
        <div>
          <label htmlFor="metricValue" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Value
          </label>
          <input
            type="number"
            id="metricValue"
            value={metricValue}
            onChange={(e) => setMetricValue(e.target.value)}
            step="any"
            className="mt-1 block w-full border-gray-300 dark:border-gray-700 dark:bg-gray-900 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            placeholder="Enter a number"
            required
          />
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
            placeholder="Add any additional notes here"
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
            {isSubmitting ? 'Recording...' : 'Record Progress'}
          </button>
        </div>
      </form>
    </div>
  )
} 