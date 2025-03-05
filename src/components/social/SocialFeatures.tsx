'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Achievement } from '@/lib/achievements'

type Friend = {
  id: string
  full_name: string
  avatar_url: string | null
  current_streak: number
  total_workouts: number
  achievements: Achievement[]
}

type SocialFeaturesProps = {
  currentUser: {
    id: string
    full_name: string
    avatar_url: string | null
  }
  achievements: Achievement[]
}

export default function SocialFeatures({ currentUser, achievements }: SocialFeaturesProps) {
  const [friends, setFriends] = useState<Friend[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAddFriend, setShowAddFriend] = useState(false)
  const [friendEmail, setFriendEmail] = useState('')
  const supabase = createClientComponentClient()

  useEffect(() => {
    fetchFriends()
  }, [])

  async function fetchFriends() {
    try {
      const { data: friendConnections, error: connectionsError } = await supabase
        .from('friend_connections')
        .select('friend_id')
        .eq('user_id', currentUser.id)

      if (connectionsError) throw connectionsError

      if (friendConnections && friendConnections.length > 0) {
        const friendIds = friendConnections.map(fc => fc.friend_id)
        
        const { data: friendsData, error: friendsError } = await supabase
          .from('profiles')
          .select(`
            id,
            full_name,
            avatar_url,
            workout_progress (
              completed_at
            ),
            user_achievements (
              achievement_id
            )
          `)
          .in('id', friendIds)

        if (friendsError) throw friendsError

        const processedFriends = friendsData.map(friend => {
          const workouts = friend.workout_progress || []
          const streak = calculateStreak(workouts.map(w => w.completed_at))
          const totalWorkouts = workouts.length

          return {
            id: friend.id,
            full_name: friend.full_name,
            avatar_url: friend.avatar_url,
            current_streak: streak,
            total_workouts: totalWorkouts,
            achievements: friend.user_achievements
              .map(ua => achievements.find(a => a.id === ua.achievement_id))
              .filter((a): a is Achievement => a !== undefined)
          }
        })

        setFriends(processedFriends)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch friends')
    } finally {
      setLoading(false)
    }
  }

  function calculateStreak(dates: string[]): number {
    if (dates.length === 0) return 0

    const sortedDates = dates
      .map(d => new Date(d))
      .sort((a, b) => b.getTime() - a.getTime())

    let streak = 1
    for (let i = 1; i < sortedDates.length; i++) {
      const dayDiff = Math.floor(
        (sortedDates[i - 1].getTime() - sortedDates[i].getTime()) / (1000 * 60 * 60 * 24)
      )
      if (dayDiff === 1) {
        streak++
      } else {
        break
      }
    }
    return streak
  }

  async function handleAddFriend(e: React.FormEvent) {
    e.preventDefault()
    try {
      const { data: friendProfile, error: userError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', friendEmail)
        .single()
      
      if (userError) throw userError
      if (!friendProfile) throw new Error('User not found')

      const { error: connectionError } = await supabase
        .from('friend_connections')
        .insert({
          user_id: currentUser.id,
          friend_id: friendProfile.id
        })

      if (connectionError) throw connectionError

      setFriendEmail('')
      setShowAddFriend(false)
      fetchFriends()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add friend')
    }
  }

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-gray-200 rounded"></div>
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">Friends</h3>
        <button
          onClick={() => setShowAddFriend(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
        >
          Add Friend
        </button>
      </div>

      {showAddFriend && (
        <form onSubmit={handleAddFriend} className="bg-white p-4 rounded-lg shadow">
          <div className="flex space-x-2">
            <input
              type="email"
              value={friendEmail}
              onChange={(e) => setFriendEmail(e.target.value)}
              placeholder="Enter friend's email"
              className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              required
            />
            <button
              type="submit"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
            >
              Add
            </button>
            <button
              type="button"
              onClick={() => setShowAddFriend(false)}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {friends.map((friend) => (
          <div key={friend.id} className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                {friend.avatar_url ? (
                  <img
                    className="h-10 w-10 rounded-full"
                    src={friend.avatar_url}
                    alt={friend.full_name}
                  />
                ) : (
                  <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                    <span className="text-gray-500">
                      {friend.full_name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>
              <div>
                <h4 className="font-medium text-gray-900">{friend.full_name}</h4>
                <div className="flex space-x-4 text-sm text-gray-500">
                  <span>{friend.current_streak} day streak</span>
                  <span>{friend.total_workouts} workouts</span>
                </div>
              </div>
            </div>

            <div className="mt-4">
              <h5 className="text-sm font-medium text-gray-900">Recent Achievements</h5>
              <div className="mt-2 flex flex-wrap gap-2">
                {friend.achievements.slice(0, 3).map((achievement) => (
                  <span
                    key={achievement.id}
                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800"
                  >
                    {achievement.icon} {achievement.title}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {friends.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No friends added yet. Add some friends to compete!</p>
        </div>
      )}
    </div>
  )
} 