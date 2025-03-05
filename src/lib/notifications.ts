export type NotificationType = 'achievement' | 'friend_request' | 'friend_activity' | 'streak' | 'milestone'

export type Notification = {
  id: string
  user_id: string
  type: NotificationType
  title: string
  message: string
  data: Record<string, any>
  read: boolean
  created_at: string
}

export type NotificationPreferences = {
  user_id: string
  achievement_notifications: boolean
  friend_request_notifications: boolean
  friend_activity_notifications: boolean
  streak_notifications: boolean
  milestone_notifications: boolean
}

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  user_id: '',
  achievement_notifications: true,
  friend_request_notifications: true,
  friend_activity_notifications: true,
  streak_notifications: true,
  milestone_notifications: true,
}

export async function createNotification(
  supabase: any,
  notification: Omit<Notification, 'id' | 'created_at' | 'read'>
) {
  const { data, error } = await supabase
    .from('notifications')
    .insert({
      ...notification,
      read: false,
      created_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function markNotificationAsRead(supabase: any, notificationId: string) {
  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('id', notificationId)

  if (error) throw error
}

export async function getUnreadNotifications(supabase: any, userId: string) {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .eq('read', false)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

export async function getNotificationPreferences(supabase: any, userId: string) {
  const { data, error } = await supabase
    .from('notification_preferences')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error) throw error
  return data || { ...DEFAULT_NOTIFICATION_PREFERENCES, user_id: userId }
}

export async function updateNotificationPreferences(
  supabase: any,
  userId: string,
  preferences: Partial<NotificationPreferences>
) {
  const { error } = await supabase
    .from('notification_preferences')
    .upsert({
      user_id: userId,
      ...preferences,
    })

  if (error) throw error
} 