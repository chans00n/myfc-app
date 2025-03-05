import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { NotificationPreferences } from '@/lib/notifications'
import { getNotificationPreferences } from '@/lib/notifications'

export function useNotificationPreferences(
  userId: string,
  onUpdate: (preferences: NotificationPreferences) => void
) {
  const [data, setData] = useState<NotificationPreferences | null>(null)
  const [error, setError] = useState<Error | null>(null)
  const supabase = createClientComponentClient()

  useEffect(() => {
    // Don't fetch if userId is empty
    if (!userId) {
      return
    }

    // Initial fetch
    fetchPreferences()

    // Set up real-time subscription
    const subscription = supabase
      .channel('notification_preferences')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notification_preferences',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const newPreferences = payload.new as NotificationPreferences
          setData(newPreferences)
          onUpdate(newPreferences)
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [userId])

  async function fetchPreferences() {
    try {
      const preferences = await getNotificationPreferences(supabase, userId)
      setData(preferences)
      onUpdate(preferences)
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to fetch notification preferences')
      setError(error)
    }
  }

  return { data, error }
} 