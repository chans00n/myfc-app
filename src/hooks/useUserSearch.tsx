'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Database } from '@/types/database'
import { useToast } from '@/components/ui/toast'

export interface UserProfile {
  id: string
  username: string
  display_name: string
  avatar_url: string | null
  bio: string | null
  is_following?: boolean
}

export function useUserSearch() {
  const [searchResults, setSearchResults] = useState<UserProfile[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const supabase = createClientComponentClient<Database>()
  const { toast } = useToast()
  
  const searchUsers = useCallback(async (query: string) => {
    if (!query || query.trim().length < 2) {
      setSearchResults([])
      return
    }
    
    try {
      setIsLoading(true)
      setError(null)
      
      const { data: { session } } = await supabase.auth.getSession()
      const currentUserId = session?.user?.id
      
      // Search for users by username or display name
      const { data, error: searchError } = await supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url, bio')
        .or(`username.ilike.%${query}%, display_name.ilike.%${query}%`)
        .limit(20)
      
      if (searchError) throw searchError
      
      // If user is logged in, check which users they are following
      let followingMap: Record<string, boolean> = {}
      
      if (currentUserId) {
        const { data: followingData, error: followingError } = await supabase
          .from('followers')
          .select('following_id')
          .eq('follower_id', currentUserId)
        
        if (followingError) throw followingError
        
        followingMap = (followingData || []).reduce((acc, item) => {
          acc[item.following_id] = true
          return acc
        }, {} as Record<string, boolean>)
      }
      
      // Add following status to search results
      const resultsWithFollowingStatus = data?.map(user => ({
        ...user,
        is_following: followingMap[user.id] || false
      })) || []
      
      // Filter out the current user from results
      const filteredResults = currentUserId 
        ? resultsWithFollowingStatus.filter(user => user.id !== currentUserId)
        : resultsWithFollowingStatus
      
      setSearchResults(filteredResults)
    } catch (err) {
      console.error('Error searching users:', err)
      setError('Failed to search users')
      
      toast({
        title: 'Search Error',
        description: 'Failed to search users. Please try again.',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }, [supabase, toast])
  
  const followUser = async (userId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        toast({
          title: 'Authentication Required',
          description: 'You must be logged in to follow users.',
          variant: 'destructive'
        })
        return false
      }
      
      const { error } = await supabase
        .from('followers')
        .insert({
          follower_id: session.user.id,
          following_id: userId
        })
      
      if (error) throw error
      
      // Update the search results to reflect the new following status
      setSearchResults(prev => 
        prev.map(user => 
          user.id === userId 
            ? { ...user, is_following: true } 
            : user
        )
      )
      
      toast({
        title: 'Success',
        description: 'You are now following this user.',
        variant: 'success'
      })
      
      return true
    } catch (err) {
      console.error('Error following user:', err)
      
      toast({
        title: 'Error',
        description: 'Failed to follow user. Please try again.',
        variant: 'destructive'
      })
      
      return false
    }
  }
  
  const unfollowUser = async (userId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        toast({
          title: 'Authentication Required',
          description: 'You must be logged in to unfollow users.',
          variant: 'destructive'
        })
        return false
      }
      
      const { error } = await supabase
        .from('followers')
        .delete()
        .eq('follower_id', session.user.id)
        .eq('following_id', userId)
      
      if (error) throw error
      
      // Update the search results to reflect the new following status
      setSearchResults(prev => 
        prev.map(user => 
          user.id === userId 
            ? { ...user, is_following: false } 
            : user
        )
      )
      
      toast({
        title: 'Success',
        description: 'You have unfollowed this user.',
        variant: 'success'
      })
      
      return true
    } catch (err) {
      console.error('Error unfollowing user:', err)
      
      toast({
        title: 'Error',
        description: 'Failed to unfollow user. Please try again.',
        variant: 'destructive'
      })
      
      return false
    }
  }
  
  return {
    searchResults,
    isLoading,
    error,
    searchUsers,
    followUser,
    unfollowUser
  }
} 