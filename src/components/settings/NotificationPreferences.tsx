'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { NotificationPreferences } from '@/lib/notifications'
import { updateNotificationPreferences } from '@/lib/notifications'
import { useNotificationPreferences } from '@/hooks/useNotificationPreferences'

export default function NotificationPreferences() {
  const [userId, setUserId] = useState<string | null>(null)
  const [tempPreferences, setTempPreferences] = useState<NotificationPreferences | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const supabase = createClientComponentClient()

  useEffect(() => {
    async function getUserId() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          setUserId(user.id)
        } else {
          setError('You must be logged in to view notification preferences')
          setLoading(false)
        }
      } catch (err) {
        setError('Failed to get user information')
        setLoading(false)
      }
    }
    getUserId()
  }, [])

  const { data: preferences, error: fetchError } = useNotificationPreferences(
    userId || '',
    (newPreferences) => {
      setTempPreferences(newPreferences)
      setLoading(false)
    }
  )

  useEffect(() => {
    if (preferences) {
      setTempPreferences(preferences)
      setLoading(false)
    }
  }, [preferences])

  useEffect(() => {
    if (fetchError) {
      setError(fetchError.message)
      setLoading(false)
    }
  }, [fetchError])

  function handleTogglePreference(key: keyof NotificationPreferences) {
    if (!tempPreferences) return

    setTempPreferences({
      ...tempPreferences,
      [key]: !tempPreferences[key],
    })
  }

  async function handleSaveAll() {
    if (!tempPreferences || !userId) return

    try {
      setSaving(true)
      setError(null)
      setSuccess(false)

      await updateNotificationPreferences(supabase, userId, tempPreferences)
      setSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update preferences')
    } finally {
      setSaving(false)
    }
  }

  function handleReset() {
    if (preferences) {
      setTempPreferences(preferences)
    }
  }

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-12 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-md bg-red-50 p-4">
        <div className="text-sm text-red-700">{error}</div>
      </div>
    )
  }

  if (!preferences || !tempPreferences) return null

  const hasChanges = JSON.stringify(preferences) !== JSON.stringify(tempPreferences)

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-lg font-medium text-gray-900">Notification Preferences</h2>
          <p className="mt-1 text-sm text-gray-500">
            Choose which notifications you want to receive
          </p>
        </div>
        <div className="flex space-x-3">
          {hasChanges && (
            <>
              <button
                onClick={handleReset}
                className="px-3 py-1 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Reset
              </button>
              <button
                onClick={handleSaveAll}
                disabled={saving}
                className="px-3 py-1 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save All Changes'}
              </button>
            </>
          )}
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="px-3 py-1 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            {showPreview ? 'Hide Preview' : 'Show Preview'}
          </button>
        </div>
      </div>

      {showPreview && (
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-gray-900 mb-2">Notification Preview</h3>
          <div className="space-y-2">
            {tempPreferences.achievement_notifications && (
              <div className="text-sm text-gray-600">🏆 Achievement unlocked: "First Workout"</div>
            )}
            {tempPreferences.friend_request_notifications && (
              <div className="text-sm text-gray-600">👋 New friend request from John Doe</div>
            )}
            {tempPreferences.friend_activity_notifications && (
              <div className="text-sm text-gray-600">👥 Jane completed a 30-minute workout</div>
            )}
            {tempPreferences.streak_notifications && (
              <div className="text-sm text-gray-600">🔥 5-day workout streak!</div>
            )}
            {tempPreferences.milestone_notifications && (
              <div className="text-sm text-gray-600">🎯 Reached 100 total workouts!</div>
            )}
          </div>
        </div>
      )}

      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 bg-white rounded-lg shadow">
          <div>
            <h3 className="text-sm font-medium text-gray-900">Achievement Notifications</h3>
            <p className="text-sm text-gray-500">Get notified when you unlock new achievements</p>
          </div>
          <button
            onClick={() => handleTogglePreference('achievement_notifications')}
            disabled={saving}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2 ${
              tempPreferences.achievement_notifications ? 'bg-indigo-600' : 'bg-gray-200'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                tempPreferences.achievement_notifications ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        <div className="flex items-center justify-between p-4 bg-white rounded-lg shadow">
          <div>
            <h3 className="text-sm font-medium text-gray-900">Friend Request Notifications</h3>
            <p className="text-sm text-gray-500">Get notified when someone sends you a friend request</p>
          </div>
          <button
            onClick={() => handleTogglePreference('friend_request_notifications')}
            disabled={saving}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2 ${
              tempPreferences.friend_request_notifications ? 'bg-indigo-600' : 'bg-gray-200'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                tempPreferences.friend_request_notifications ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        <div className="flex items-center justify-between p-4 bg-white rounded-lg shadow">
          <div>
            <h3 className="text-sm font-medium text-gray-900">Friend Activity Notifications</h3>
            <p className="text-sm text-gray-500">Get notified when your friends complete workouts</p>
          </div>
          <button
            onClick={() => handleTogglePreference('friend_activity_notifications')}
            disabled={saving}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2 ${
              tempPreferences.friend_activity_notifications ? 'bg-indigo-600' : 'bg-gray-200'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                tempPreferences.friend_activity_notifications ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        <div className="flex items-center justify-between p-4 bg-white rounded-lg shadow">
          <div>
            <h3 className="text-sm font-medium text-gray-900">Streak Notifications</h3>
            <p className="text-sm text-gray-500">Get notified about your workout streaks</p>
          </div>
          <button
            onClick={() => handleTogglePreference('streak_notifications')}
            disabled={saving}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2 ${
              tempPreferences.streak_notifications ? 'bg-indigo-600' : 'bg-gray-200'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                tempPreferences.streak_notifications ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        <div className="flex items-center justify-between p-4 bg-white rounded-lg shadow">
          <div>
            <h3 className="text-sm font-medium text-gray-900">Milestone Notifications</h3>
            <p className="text-sm text-gray-500">Get notified when you reach important milestones</p>
          </div>
          <button
            onClick={() => handleTogglePreference('milestone_notifications')}
            disabled={saving}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2 ${
              tempPreferences.milestone_notifications ? 'bg-indigo-600' : 'bg-gray-200'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                tempPreferences.milestone_notifications ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>

      {success && (
        <div className="rounded-md bg-green-50 p-4">
          <div className="text-sm text-green-700">Preferences updated successfully</div>
        </div>
      )}
    </div>
  )
} 