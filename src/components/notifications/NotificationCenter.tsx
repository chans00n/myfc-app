'use client'

import { useState, useEffect } from 'react'
import { useNotifications, Notification } from '@/hooks/useNotifications'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { formatDistanceToNow } from 'date-fns'
import Link from 'next/link'

export function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'all' | 'unread'>('all')
  const { 
    notifications, 
    unreadCount, 
    isLoading, 
    error, 
    fetchNotifications, 
    markAsRead, 
    markAllAsRead, 
    deleteNotification, 
    clearAllNotifications 
  } = useNotifications()
  
  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])
  
  const toggleNotifications = () => {
    setIsOpen(!isOpen)
  }
  
  const handleMarkAsRead = async (notificationId: string) => {
    await markAsRead(notificationId)
  }
  
  const handleMarkAllAsRead = async () => {
    await markAllAsRead()
  }
  
  const handleDeleteNotification = async (notificationId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    await deleteNotification(notificationId)
  }
  
  const handleClearAll = async () => {
    await clearAllNotifications()
  }
  
  const filteredNotifications = activeTab === 'unread'
    ? notifications.filter(notification => !notification.is_read)
    : notifications
  
  const getNotificationLink = (notification: Notification) => {
    if (!notification.related_id || !notification.related_type) {
      return '#'
    }
    
    switch (notification.related_type) {
      case 'workout':
        return `/workouts/${notification.related_id}`
      case 'achievement':
        return `/achievements/${notification.related_id}`
      case 'profile':
        return `/profile/${notification.related_id}`
      case 'comment':
        // For comments, we need to know what they're on
        // This is simplified - you might need more complex logic
        return `/social/${notification.related_id}`
      default:
        return '#'
    }
  }
  
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'comment':
        return '💬'
      case 'like':
        return '❤️'
      case 'follow':
        return '👤'
      case 'achievement':
        return '🏆'
      case 'workout_reminder':
        return '⏰'
      default:
        return '📣'
    }
  }
  
  return (
    <div className="relative">
      <button 
        onClick={toggleNotifications}
        className="relative p-2 text-gray-700 hover:text-blue-600 focus:outline-none"
        aria-label="Notifications"
      >
        <span className="text-xl">🔔</span>
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-500 rounded-full">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>
      
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-lg shadow-lg overflow-hidden z-50 border border-gray-200">
          <div className="p-3 border-b border-gray-200 flex justify-between items-center">
            <h3 className="font-semibold">Notifications</h3>
            <div className="flex space-x-2">
              <button 
                onClick={handleMarkAllAsRead}
                className="text-xs text-blue-600 hover:text-blue-800"
                disabled={unreadCount === 0}
              >
                Mark all as read
              </button>
              <button 
                onClick={handleClearAll}
                className="text-xs text-red-600 hover:text-red-800"
                disabled={notifications.length === 0}
              >
                Clear all
              </button>
            </div>
          </div>
          
          <div className="flex border-b border-gray-200">
            <button
              className={`flex-1 py-2 text-sm font-medium ${activeTab === 'all' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600'}`}
              onClick={() => setActiveTab('all')}
            >
              All
            </button>
            <button
              className={`flex-1 py-2 text-sm font-medium ${activeTab === 'unread' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600'}`}
              onClick={() => setActiveTab('unread')}
            >
              Unread {unreadCount > 0 && `(${unreadCount})`}
            </button>
          </div>
          
          <div className="max-h-96 overflow-y-auto">
            {isLoading ? (
              <div className="p-4 text-center text-gray-500">Loading notifications...</div>
            ) : error ? (
              <div className="p-4 text-center text-red-500">{error}</div>
            ) : filteredNotifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                {activeTab === 'all' ? 'No notifications' : 'No unread notifications'}
              </div>
            ) : (
              <div>
                {filteredNotifications.map(notification => (
                  <div 
                    key={notification.id}
                    className={`p-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer ${!notification.is_read ? 'bg-blue-50' : ''}`}
                    onClick={() => {
                      if (!notification.is_read) {
                        handleMarkAsRead(notification.id)
                      }
                    }}
                  >
                    <div className="flex items-start">
                      <div className="flex-shrink-0 mr-3">
                        {notification.actor ? (
                          <Avatar className="h-8 w-8">
                            {notification.actor.avatar_url ? (
                              <AvatarImage src={notification.actor.avatar_url} alt={notification.actor.display_name} />
                            ) : (
                              <AvatarFallback>{notification.actor.display_name.charAt(0).toUpperCase()}</AvatarFallback>
                            )}
                          </Avatar>
                        ) : (
                          <div className="h-8 w-8 flex items-center justify-center bg-gray-100 rounded-full text-lg">
                            {getNotificationIcon(notification.type)}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <Link href={getNotificationLink(notification)} className="block">
                          <p className="text-sm text-gray-900">{notification.content}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                          </p>
                        </Link>
                      </div>
                      <button
                        onClick={(e) => handleDeleteNotification(notification.id, e)}
                        className="ml-2 text-gray-400 hover:text-gray-600"
                        aria-label="Delete notification"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
} 