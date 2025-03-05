'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Database } from '@/types/database'
import { useToast } from '@/components/ui/toast'

interface SocialProfile {
  id: string
  user_id: string
  username: string
  display_name: string
  bio: string | null
  avatar_url: string | null
  following_count: number
  followers_count: number
  created_at: string
  updated_at: string
}

interface SharedWorkout {
  id: string
  user_id: string
  workout_id: string
  duration_seconds: number
  rating: number | null
  notes: string | null
  shared_at: string
  likes_count: number
  comments_count: number
  created_at: string
  updated_at: string
  user: {
    username: string
    display_name: string
    avatar_url: string | null
  } | null
  workout: {
    title: string
    difficulty: string
    duration_seconds: number
  } | null
}

interface SharedAchievement {
  id: string
  user_id: string
  achievement_id: string
  shared_at: string
  likes_count: number
  comments_count: number
  created_at: string
  updated_at: string
  user: {
    username: string
    display_name: string
    avatar_url: string | null
  } | null
  achievement: {
    name: string
    description: string
    category: string
    reward_points: number
  } | null
}

export function useSocial() {
  const [profile, setProfile] = useState<SocialProfile | null>(null)
  const [feed, setFeed] = useState<(SharedWorkout | SharedAchievement)[]>([])
  const [followers, setFollowers] = useState<SocialProfile[]>([])
  const [following, setFollowing] = useState<SocialProfile[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const supabase = createClientComponentClient<Database>()
  const { toast } = useToast()
  
  const fetchProfile = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        throw new Error('No active session')
      }
      
      // Get user's social profile
      const { data, error: profileError } = await supabase
        .from('social_profiles')
        .select('*')
        .eq('user_id', session.user.id)
        .single()
      
      if (profileError) {
        // If profile doesn't exist, create one
        if (profileError.code === 'PGRST116') {
          return await createProfile(session.user.id)
        }
        throw profileError
      }
      
      setProfile(data)
      return data
    } catch (err) {
      console.error('Error fetching social profile:', err)
      setError('Failed to load social profile')
      return null
    } finally {
      setIsLoading(false)
    }
  }, [supabase])
  
  const createProfile = async (userId: string) => {
    try {
      // Get user's email from auth profile
      const { data: userData, error: userError } = await supabase
        .from('profiles')
        .select('email, full_name')
        .eq('id', userId)
        .single()
      
      if (userError) throw userError
      
      // Generate username from email
      const username = userData.email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '') + 
        Math.floor(Math.random() * 1000).toString()
      
      // Create social profile
      const { data, error } = await supabase
        .from('social_profiles')
        .insert({
          user_id: userId,
          username,
          display_name: userData.full_name || username,
          following_count: 0,
          followers_count: 0
        })
        .select()
        .single()
      
      if (error) throw error
      
      setProfile(data)
      return data
    } catch (err) {
      console.error('Error creating social profile:', err)
      setError('Failed to create social profile')
      return null
    }
  }
  
  const fetchFeed = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        throw new Error('No active session')
      }
      
      // Get list of users the current user is following
      const { data: followingData, error: followingError } = await supabase
        .from('social_follows')
        .select('following_id')
        .eq('follower_id', session.user.id)
      
      if (followingError) throw followingError
      
      // If not following anyone, return empty feed
      if (!followingData || followingData.length === 0) {
        setFeed([])
        return
      }
      
      const followingIds = followingData.map(f => f.following_id)
      
      // Get shared workouts from followed users
      const { data: workoutsData, error: workoutsError } = await supabase
        .from('shared_workouts')
        .select(`
          *,
          user:user_id (
            username,
            display_name,
            avatar_url
          ),
          workout:workout_id (
            title,
            difficulty,
            duration_seconds
          )
        `)
        .in('user_id', followingIds)
        .order('shared_at', { ascending: false })
        .limit(20)
      
      if (workoutsError) throw workoutsError
      
      // Get shared achievements from followed users
      const { data: achievementsData, error: achievementsError } = await supabase
        .from('shared_achievements')
        .select(`
          *,
          user:user_id (
            username,
            display_name,
            avatar_url
          ),
          achievement:achievement_id (
            name,
            description,
            category,
            reward_points
          )
        `)
        .in('user_id', followingIds)
        .order('shared_at', { ascending: false })
        .limit(20)
      
      if (achievementsError) throw achievementsError
      
      // Combine and sort by shared_at date
      const combinedFeed = [
        ...(workoutsData || []),
        ...(achievementsData || [])
      ].sort((a, b) => 
        new Date(b.shared_at).getTime() - new Date(a.shared_at).getTime()
      ).slice(0, 20)
      
      setFeed(combinedFeed)
    } catch (err) {
      console.error('Error fetching social feed:', err)
      setError('Failed to load social feed')
    } finally {
      setIsLoading(false)
    }
  }, [supabase])
  
  const fetchFollowers = useCallback(async () => {
    try {
      if (!profile) return
      
      const { data, error } = await supabase
        .from('social_follows')
        .select(`
          follower:follower_id (
            id,
            user_id,
            username,
            display_name,
            bio,
            avatar_url,
            following_count,
            followers_count,
            created_at,
            updated_at
          )
        `)
        .eq('following_id', profile.user_id)
      
      if (error) throw error
      
      // Properly type the followers data
      const typedFollowers: SocialProfile[] = data?.map(item => item.follower as unknown as SocialProfile) || []
      setFollowers(typedFollowers)
    } catch (err) {
      console.error('Error fetching followers:', err)
    }
  }, [supabase, profile])
  
  const fetchFollowing = useCallback(async () => {
    try {
      if (!profile) return
      
      const { data, error } = await supabase
        .from('social_follows')
        .select(`
          following:following_id (
            id,
            user_id,
            username,
            display_name,
            bio,
            avatar_url,
            following_count,
            followers_count,
            created_at,
            updated_at
          )
        `)
        .eq('follower_id', profile.user_id)
      
      if (error) throw error
      
      // Properly type the following data
      const typedFollowing: SocialProfile[] = data?.map(item => item.following as unknown as SocialProfile) || []
      setFollowing(typedFollowing)
    } catch (err) {
      console.error('Error fetching following:', err)
    }
  }, [supabase, profile])
  
  const followUser = async (userId: string) => {
    try {
      if (!profile) {
        throw new Error('No social profile')
      }
      
      // Check if already following
      const { data: existingFollow, error: checkError } = await supabase
        .from('social_follows')
        .select('*')
        .eq('follower_id', profile.user_id)
        .eq('following_id', userId)
        .maybeSingle()
      
      if (checkError) throw checkError
      
      if (existingFollow) {
        // Already following, unfollow
        const { error: deleteError } = await supabase
          .from('social_follows')
          .delete()
          .eq('follower_id', profile.user_id)
          .eq('following_id', userId)
        
        if (deleteError) throw deleteError
        
        // Update counts
        await supabase.rpc('decrement_following_count', { user_id: profile.user_id })
        await supabase.rpc('decrement_followers_count', { user_id: userId })
        
        toast({
          title: 'Unfollowed',
          description: 'You are no longer following this user.',
          variant: 'success'
        })
        
        // Refresh data
        await Promise.all([fetchProfile(), fetchFollowing()])
        
        return false
      } else {
        // Not following, follow
        const { error: insertError } = await supabase
          .from('social_follows')
          .insert({
            follower_id: profile.user_id,
            following_id: userId
          })
        
        if (insertError) throw insertError
        
        // Update counts
        await supabase.rpc('increment_following_count', { user_id: profile.user_id })
        await supabase.rpc('increment_followers_count', { user_id: userId })
        
        toast({
          title: 'Following',
          description: 'You are now following this user.',
          variant: 'success'
        })
        
        // Refresh data
        await Promise.all([fetchProfile(), fetchFollowing()])
        
        return true
      }
    } catch (err) {
      console.error('Error following/unfollowing user:', err)
      toast({
        title: 'Error',
        description: 'Failed to update follow status. Please try again.',
        variant: 'destructive'
      })
      return null
    }
  }
  
  const shareWorkout = async (workoutId: string, durationSeconds: number, rating?: number, notes?: string) => {
    try {
      if (!profile) {
        throw new Error('No social profile')
      }
      
      const { data, error } = await supabase
        .from('shared_workouts')
        .insert({
          user_id: profile.user_id,
          workout_id: workoutId,
          duration_seconds: durationSeconds,
          rating: rating || null,
          notes: notes || null,
          shared_at: new Date().toISOString(),
          likes_count: 0,
          comments_count: 0
        })
        .select()
      
      if (error) throw error
      
      toast({
        title: 'Workout Shared',
        description: 'Your workout has been shared with your followers.',
        variant: 'success'
      })
      
      return data
    } catch (err) {
      console.error('Error sharing workout:', err)
      toast({
        title: 'Error',
        description: 'Failed to share workout. Please try again.',
        variant: 'destructive'
      })
      return null
    }
  }
  
  const shareAchievement = async (achievementId: string) => {
    try {
      if (!profile) {
        throw new Error('No social profile')
      }
      
      const { data, error } = await supabase
        .from('shared_achievements')
        .insert({
          user_id: profile.user_id,
          achievement_id: achievementId,
          shared_at: new Date().toISOString(),
          likes_count: 0,
          comments_count: 0
        })
        .select()
      
      if (error) throw error
      
      toast({
        title: 'Achievement Shared',
        description: 'Your achievement has been shared with your followers.',
        variant: 'success'
      })
      
      return data
    } catch (err) {
      console.error('Error sharing achievement:', err)
      toast({
        title: 'Error',
        description: 'Failed to share achievement. Please try again.',
        variant: 'destructive'
      })
      return null
    }
  }
  
  const likeSharedItem = async (itemType: 'workout' | 'achievement', itemId: string) => {
    try {
      if (!profile) {
        throw new Error('No social profile')
      }
      
      const table = itemType === 'workout' ? 'shared_workout_likes' : 'shared_achievement_likes'
      const itemIdField = itemType === 'workout' ? 'shared_workout_id' : 'shared_achievement_id'
      
      // Check if already liked
      const { data: existingLike, error: checkError } = await supabase
        .from(table)
        .select('*')
        .eq('user_id', profile.user_id)
        .eq(itemIdField, itemId)
        .maybeSingle()
      
      if (checkError) throw checkError
      
      if (existingLike) {
        // Already liked, unlike
        const { error: deleteError } = await supabase
          .from(table)
          .delete()
          .eq('user_id', profile.user_id)
          .eq(itemIdField, itemId)
        
        if (deleteError) throw deleteError
        
        // Decrement likes count
        const updateTable = itemType === 'workout' ? 'shared_workouts' : 'shared_achievements'
        await supabase
          .from(updateTable)
          .update({ likes_count: supabase.rpc('decrement') })
          .eq('id', itemId)
        
        // Refresh feed
        await fetchFeed()
        
        return false
      } else {
        // Not liked, like
        const { error: insertError } = await supabase
          .from(table)
          .insert({
            user_id: profile.user_id,
            [itemIdField]: itemId
          })
        
        if (insertError) throw insertError
        
        // Increment likes count
        const updateTable = itemType === 'workout' ? 'shared_workouts' : 'shared_achievements'
        await supabase
          .from(updateTable)
          .update({ likes_count: supabase.rpc('increment') })
          .eq('id', itemId)
        
        // Refresh feed
        await fetchFeed()
        
        return true
      }
    } catch (err) {
      console.error('Error liking/unliking item:', err)
      return null
    }
  }
  
  // Initialize data on mount
  useEffect(() => {
    const loadData = async () => {
      const profileData = await fetchProfile()
      if (profileData) {
        await Promise.all([
          fetchFeed(),
          fetchFollowers(),
          fetchFollowing()
        ])
      }
    }
    
    loadData()
  }, [fetchProfile, fetchFeed, fetchFollowers, fetchFollowing])
  
  return {
    profile,
    feed,
    followers,
    following,
    isLoading,
    error,
    fetchProfile,
    fetchFeed,
    fetchFollowers,
    fetchFollowing,
    followUser,
    shareWorkout,
    shareAchievement,
    likeSharedItem
  }
} 