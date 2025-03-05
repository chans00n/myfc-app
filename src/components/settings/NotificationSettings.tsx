'use client'

import { useState } from 'react'
import { useNotifications } from '@/hooks/useNotifications'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'

export default function NotificationSettings() {
  const {
    preferences,
    isLoading,
    error,
    updatePreferences,
    requestNotificationPermission
  } = useNotifications()
  
  const [isSaving, setIsSaving] = useState(false)
  
  const handleToggleChange = async (field: string, value: boolean) => {
    if (!preferences) return
    
    setIsSaving(true)
    await updatePreferences({ [field]: value })
    setIsSaving(false)
  }
  
  const handleTimeChange = async (time: string) => {
    if (!preferences) return
    
    setIsSaving(true)
    await updatePreferences({ reminder_time: time })
    setIsSaving(false)
  }
  
  const handleEnablePush = async () => {
    await requestNotificationPermission()
  }
  
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-full" />
        </CardHeader>
        <CardContent className="space-y-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="flex items-center justify-between">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-6 w-12" />
            </div>
          ))}
        </CardContent>
      </Card>
    )
  }
  
  if (error || !preferences) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Notification Settings</CardTitle>
          <CardDescription>
            There was an error loading your notification preferences.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-red-500 mb-4">{error || 'Failed to load preferences'}</p>
          <Button onClick={() => window.location.reload()}>
            Retry
          </Button>
        </CardContent>
      </Card>
    )
  }
  
  // Generate time options (every 30 minutes)
  const timeOptions = []
  for (let hour = 0; hour < 24; hour++) {
    for (let minute of [0, 30]) {
      const formattedHour = hour.toString().padStart(2, '0')
      const formattedMinute = minute.toString().padStart(2, '0')
      const time = `${formattedHour}:${formattedMinute}`
      const displayTime = new Date(`2000-01-01T${time}:00`).toLocaleTimeString([], {
        hour: 'numeric',
        minute: '2-digit'
      })
      timeOptions.push({ value: time, label: displayTime })
    }
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Notification Settings</CardTitle>
        <CardDescription>
          Manage how and when you receive notifications from My Face Coach
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="workout-reminders" className="font-medium">
                Workout Reminders
              </Label>
              <p className="text-sm text-muted-foreground">
                Receive reminders for scheduled workouts
              </p>
            </div>
            <Switch
              id="workout-reminders"
              checked={preferences.workout_reminders}
              onCheckedChange={(checked: boolean) => handleToggleChange('workout_reminders', checked)}
              disabled={isSaving}
            />
          </div>
          
          {preferences.workout_reminders && (
            <div className="ml-6 border-l-2 pl-4 border-muted">
              <Label htmlFor="reminder-time" className="mb-2 block">
                Default Reminder Time
              </Label>
              <Select
                value={preferences.reminder_time || '18:00'}
                onValueChange={handleTimeChange}
                disabled={isSaving}
              >
                <SelectTrigger id="reminder-time" className="w-full sm:w-40">
                  <SelectValue placeholder="Select time" />
                </SelectTrigger>
                <SelectContent>
                  {timeOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground mt-2">
                You'll receive reminders at this time for workouts scheduled for the next day
              </p>
            </div>
          )}
        </div>
        
        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="achievement-notifications" className="font-medium">
              Achievement Notifications
            </Label>
            <p className="text-sm text-muted-foreground">
              Get notified when you earn new achievements
            </p>
          </div>
          <Switch
            id="achievement-notifications"
            checked={preferences.achievement_notifications}
            onCheckedChange={(checked: boolean) => handleToggleChange('achievement_notifications', checked)}
            disabled={isSaving}
          />
        </div>
        
        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="social-notifications" className="font-medium">
              Social Notifications
            </Label>
            <p className="text-sm text-muted-foreground">
              Receive updates about likes, comments, and new followers
            </p>
          </div>
          <Switch
            id="social-notifications"
            checked={preferences.social_notifications}
            onCheckedChange={(checked: boolean) => handleToggleChange('social_notifications', checked)}
            disabled={isSaving}
          />
        </div>
        
        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="email-notifications" className="font-medium">
              Email Notifications
            </Label>
            <p className="text-sm text-muted-foreground">
              Receive weekly summaries and important updates via email
            </p>
          </div>
          <Switch
            id="email-notifications"
            checked={preferences.email_notifications}
            onCheckedChange={(checked: boolean) => handleToggleChange('email_notifications', checked)}
            disabled={isSaving}
          />
        </div>
        
        <div className="pt-4 border-t">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-medium">Push Notifications</h3>
              <p className="text-sm text-muted-foreground">
                Receive notifications on your device even when the app is closed
              </p>
            </div>
            <Switch
              checked={preferences.push_enabled}
              disabled={true}
            />
          </div>
          
          {!preferences.push_enabled ? (
            <Button onClick={handleEnablePush} className="w-full">
              Enable Push Notifications
            </Button>
          ) : (
            <p className="text-sm text-green-600">
              Push notifications are enabled for this device
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
} 