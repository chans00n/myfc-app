'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Database } from '@/types/database'
import { useToast } from '@/components/ui/toast'

interface NotificationPreferences {
  id: string
  user_id: string
  workout_reminders: boolean
  achievement_notifications: boolean
  social_notifications: boolean
  email_notifications: boolean
  push_enabled: boolean
  reminder_time: string | null
  created_at: string
  updated_at: string
}

export interface Notification {
  id: string
  user_id: string
  type: 'comment' | 'like' | 'follow' | 'achievement' | 'workout_reminder'
  content: string
  is_read: boolean
  created_at: string
  related_id?: string
  related_type?: 'workout' | 'achievement' | 'comment' | 'profile'
  actor?: {
    id: string
    username: string
    display_name: string
    avatar_url: string | null
  }
}

export function useNotifications() {
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [deviceToken, setDeviceToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const supabase = createClientComponentClient<Database>()
  const { toast } = useToast()
  
  const fetchPreferences = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        throw new Error('No active session')
      }
      
      // Get user's notification preferences
      const { data, error: prefsError } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', session.user.id)
        .single()
      
      if (prefsError) {
        // If preferences don't exist, create default ones
        if (prefsError.code === 'PGRST116') {
          return await createDefaultPreferences(session.user.id)
        }
        throw prefsError
      }
      
      setPreferences(data)
      return data
    } catch (err) {
      console.error('Error fetching notification preferences:', err)
      setError('Failed to load notification preferences')
      return null
    } finally {
      setIsLoading(false)
    }
  }, [supabase])
  
  const fetchNotifications = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        setNotifications([])
        setUnreadCount(0)
        return
      }
      
      // Fetch notifications with actor information
      const { data, error: notificationsError } = await supabase
        .from('notifications')
        .select(`
          *,
          actor:actor_id (
            id,
            username,
            display_name,
            avatar_url
          )
        `)
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })
        .limit(50)
      
      if (notificationsError) throw notificationsError
      
      setNotifications(data || [])
      
      // Count unread notifications
      const unread = data?.filter(notification => !notification.is_read).length || 0
      setUnreadCount(unread)
    } catch (err) {
      console.error('Error fetching notifications:', err)
      setError('Failed to load notifications')
      
      toast({
        title: 'Error',
        description: 'Failed to load notifications. Please try again.',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }, [supabase, toast])
  
  const markAsRead = async (notificationId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        return false
      }
      
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId)
        .eq('user_id', session.user.id)
      
      if (error) throw error
      
      // Update local state
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === notificationId 
            ? { ...notification, is_read: true } 
            : notification
        )
      )
      
      // Update unread count
      setUnreadCount(prev => Math.max(0, prev - 1))
      
      return true
    } catch (err) {
      console.error('Error marking notification as read:', err)
      
      toast({
        title: 'Error',
        description: 'Failed to update notification. Please try again.',
        variant: 'destructive'
      })
      
      return false
    }
  }
  
  const markAllAsRead = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        return false
      }
      
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', session.user.id)
        .eq('is_read', false)
      
      if (error) throw error
      
      // Update local state
      setNotifications(prev => 
        prev.map(notification => ({ ...notification, is_read: true }))
      )
      
      // Reset unread count
      setUnreadCount(0)
      
      toast({
        title: 'Success',
        description: 'All notifications marked as read.',
        variant: 'success'
      })
      
      return true
    } catch (err) {
      console.error('Error marking all notifications as read:', err)
      
      toast({
        title: 'Error',
        description: 'Failed to update notifications. Please try again.',
        variant: 'destructive'
      })
      
      return false
    }
  }
  
  const deleteNotification = async (notificationId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        return false
      }
      
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId)
        .eq('user_id', session.user.id)
      
      if (error) throw error
      
      // Update local state
      const deletedNotification = notifications.find(n => n.id === notificationId)
      setNotifications(prev => prev.filter(n => n.id !== notificationId))
      
      // Update unread count if needed
      if (deletedNotification && !deletedNotification.is_read) {
        setUnreadCount(prev => Math.max(0, prev - 1))
      }
      
      return true
    } catch (err) {
      console.error('Error deleting notification:', err)
      
      toast({
        title: 'Error',
        description: 'Failed to delete notification. Please try again.',
        variant: 'destructive'
      })
      
      return false
    }
  }
  
  const clearAllNotifications = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        return false
      }
      
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('user_id', session.user.id)
      
      if (error) throw error
      
      // Update local state
      setNotifications([])
      setUnreadCount(0)
      
      toast({
        title: 'Success',
        description: 'All notifications cleared.',
        variant: 'success'
      })
      
      return true
    } catch (err) {
      console.error('Error clearing notifications:', err)
      
      toast({
        title: 'Error',
        description: 'Failed to clear notifications. Please try again.',
        variant: 'destructive'
      })
      
      return false
    }
  }
  
  const createDefaultPreferences = async (userId: string) => {
    try {
      const defaultPrefs = {
        user_id: userId,
        workout_reminders: true,
        achievement_notifications: true,
        social_notifications: true,
        email_notifications: false,
        push_enabled: false,
        reminder_time: '18:00' // Default reminder time: 6 PM
      }
      
      const { data, error } = await supabase
        .from('notification_preferences')
        .insert(defaultPrefs)
        .select()
        .single()
      
      if (error) throw error
      
      setPreferences(data)
      return data
    } catch (err) {
      console.error('Error creating default notification preferences:', err)
      setError('Failed to create notification preferences')
      return null
    }
  }
  
  const updatePreferences = async (newPrefs: Partial<NotificationPreferences>) => {
    try {
      if (!preferences) {
        throw new Error('No preferences loaded')
      }
      
      const { data, error } = await supabase
        .from('notification_preferences')
        .update(newPrefs)
        .eq('id', preferences.id)
        .select()
        .single()
      
      if (error) throw error
      
      setPreferences(data)
      
      toast({
        title: 'Preferences Updated',
        description: 'Your notification preferences have been saved.',
        variant: 'success'
      })
      
      return data
    } catch (err) {
      console.error('Error updating notification preferences:', err)
      
      toast({
        title: 'Error',
        description: 'Failed to update notification preferences. Please try again.',
        variant: 'destructive'
      })
      
      return null
    }
  }
  
  const registerDevice = async (token: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        throw new Error('No active session')
      }
      
      // Check if device is already registered
      const { data: existingDevice, error: checkError } = await supabase
        .from('device_tokens')
        .select('*')
        .eq('user_id', session.user.id)
        .eq('token', token)
        .maybeSingle()
      
      if (checkError) throw checkError
      
      // If device is not registered, add it
      if (!existingDevice) {
        const { error: insertError } = await supabase
          .from('device_tokens')
          .insert({
            user_id: session.user.id,
            token,
            platform: getPlatform(),
            is_active: true
          })
        
        if (insertError) throw insertError
      }
      
      // Update preferences to enable push notifications
      if (preferences && !preferences.push_enabled) {
        await updatePreferences({ push_enabled: true })
      }
      
      setDeviceToken(token)
      
      return true
    } catch (err) {
      console.error('Error registering device:', err)
      return false
    }
  }
  
  const unregisterDevice = async () => {
    try {
      if (!deviceToken) return false
      
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        throw new Error('No active session')
      }
      
      // Deactivate the device token
      const { error } = await supabase
        .from('device_tokens')
        .update({ is_active: false })
        .eq('user_id', session.user.id)
        .eq('token', deviceToken)
      
      if (error) throw error
      
      // Update preferences to disable push notifications if no active devices
      const { data: activeDevices, error: countError } = await supabase
        .from('device_tokens')
        .select('id')
        .eq('user_id', session.user.id)
        .eq('is_active', true)
      
      if (countError) throw countError
      
      if (!activeDevices || activeDevices.length === 0) {
        await updatePreferences({ push_enabled: false })
      }
      
      setDeviceToken(null)
      
      return true
    } catch (err) {
      console.error('Error unregistering device:', err)
      return false
    }
  }
  
  const getPlatform = () => {
    // Simple platform detection
    const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera
    
    if (/android/i.test(userAgent)) {
      return 'android'
    }
    
    if (/iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream) {
      return 'ios'
    }
    
    return 'web'
  }
  
  // Request permission for push notifications
  const requestNotificationPermission = async () => {
    try {
      if (!('Notification' in window)) {
        toast({
          title: 'Notifications Not Supported',
          description: 'Your browser does not support push notifications.',
          variant: 'destructive'
        })
        return false
      }
      
      const permission = await Notification.requestPermission()
      
      if (permission === 'granted') {
        // Here you would typically register with your push service
        // and get a token to send to your backend
        const mockToken = `device-${Date.now()}`
        await registerDevice(mockToken)
        
        toast({
          title: 'Notifications Enabled',
          description: 'You will now receive push notifications.',
          variant: 'success'
        })
        
        return true
      } else {
        toast({
          title: 'Permission Denied',
          description: 'You will not receive push notifications.',
          variant: 'destructive'
        })
        
        return false
      }
    } catch (err) {
      console.error('Error requesting notification permission:', err)
      
      toast({
        title: 'Error',
        description: 'Failed to enable notifications. Please try again.',
        variant: 'destructive'
      })
      
      return false
    }
  }
  
  // Set up real-time subscription for new notifications
  useEffect(() => {
    const setupSubscription = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) return
      
      // Subscribe to new notifications
      const channel = supabase
        .channel('notifications')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${session.user.id}`
          },
          async (payload) => {
            // Fetch the complete notification with actor info
            const { data, error } = await supabase
              .from('notifications')
              .select(`
                *,
                actor:actor_id (
                  id,
                  username,
                  display_name,
                  avatar_url
                )
              `)
              .eq('id', payload.new.id)
              .single()
            
            if (!error && data) {
              // Add the new notification to state
              setNotifications(prev => [data, ...prev])
              setUnreadCount(prev => prev + 1)
              
              // Show a toast for the new notification
              toast({
                title: 'New Notification',
                description: data.content,
                variant: 'default'
              })
            }
          }
        )
        .subscribe()
      
      return () => {
        supabase.removeChannel(channel)
      }
    }
    
    const unsubscribe = setupSubscription()
    
    return () => {
      unsubscribe.then(unsub => {
        if (unsub) unsub()
      })
    }
  }, [supabase, toast])
  
  return {
    preferences,
    notifications,
    unreadCount,
    isLoading,
    error,
    fetchPreferences,
    fetchNotifications,
    updatePreferences,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications,
    requestNotificationPermission,
    unregisterDevice
  }
} 