'use client'

import { useState, useEffect, useRef } from 'react'
import { useUserSearch, UserProfile } from '@/hooks/useUserSearch'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import Link from 'next/link'

export function UserSearch() {
  const [query, setQuery] = useState('')
  const { searchResults, isLoading, searchUsers, followUser, unfollowUser } = useUserSearch()
  const searchTimeout = useRef<NodeJS.Timeout | null>(null)
  
  useEffect(() => {
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current)
    }
    
    if (query.trim().length >= 2) {
      searchTimeout.current = setTimeout(() => {
        searchUsers(query)
      }, 300)
    }
    
    return () => {
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current)
      }
    }
  }, [query, searchUsers])
  
  const handleFollowToggle = async (user: UserProfile) => {
    if (user.is_following) {
      await unfollowUser(user.id)
    } else {
      await followUser(user.id)
    }
  }
  
  return (
    <div className="w-full max-w-md mx-auto">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search users by name or username..."
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {isLoading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="animate-spin h-5 w-5 border-2 border-blue-500 rounded-full border-t-transparent"></div>
          </div>
        )}
      </div>
      
      {query.trim().length < 2 ? (
        <p className="text-center text-gray-500 mt-4">Enter at least 2 characters to search</p>
      ) : searchResults.length === 0 && !isLoading ? (
        <p className="text-center text-gray-500 mt-4">No users found</p>
      ) : (
        <div className="mt-4 space-y-3">
          {searchResults.map(user => (
            <div key={user.id} className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm border border-gray-100">
              <Link href={`/social?username=${user.username}`} className="flex items-center space-x-3 flex-1">
                <Avatar className="h-10 w-10">
                  {user.avatar_url ? (
                    <AvatarImage src={user.avatar_url} alt={user.display_name} />
                  ) : (
                    <AvatarFallback>{user.display_name.charAt(0).toUpperCase()}</AvatarFallback>
                  )}
                </Avatar>
                <div>
                  <h3 className="font-medium">{user.display_name}</h3>
                  <p className="text-sm text-gray-500">@{user.username}</p>
                </div>
              </Link>
              <Button
                variant={user.is_following ? 'outline' : 'default'}
                size="sm"
                onClick={() => handleFollowToggle(user)}
              >
                {user.is_following ? 'Unfollow' : 'Follow'}
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
} 