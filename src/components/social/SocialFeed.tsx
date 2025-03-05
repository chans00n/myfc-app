'use client'

import { useState, useEffect } from 'react'
import { useSocial } from '@/hooks/useSocial'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
// Temporarily use simple emoji icons instead of Heroicons due to import issues
// import { HeartIcon as HeartOutlineIcon, ChatBubbleOvalLeftIcon, ShareIcon } from '@heroicons/react/24/outline'
// import { HeartIcon } from '@heroicons/react/24/solid'
import { formatDistanceToNow } from 'date-fns'

export default function SocialFeed() {
  const { 
    feed, 
    isLoading, 
    error, 
    fetchFeed, 
    likeSharedItem 
  } = useSocial()
  const [activeTab, setActiveTab] = useState('all')
  const [likedItems, setLikedItems] = useState<Record<string, boolean>>({})

  useEffect(() => {
    // Initialize liked status for each item
    const initialLikedState: Record<string, boolean> = {}
    feed.forEach(item => {
      initialLikedState[item.id] = false // We would need to fetch actual liked status from the backend
    })
    setLikedItems(initialLikedState)
  }, [feed])

  const handleLike = async (itemType: 'workout' | 'achievement', itemId: string) => {
    const result = await likeSharedItem(itemType, itemId)
    if (result !== null) {
      setLikedItems(prev => ({
        ...prev,
        [itemId]: result
      }))
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2)
  }

  const formatTimeAgo = (dateString: string) => {
    return formatDistanceToNow(new Date(dateString), { addSuffix: true })
  }

  const filteredFeed = activeTab === 'all' 
    ? feed 
    : activeTab === 'workouts' 
      ? feed.filter(item => 'workout_id' in item) 
      : feed.filter(item => 'achievement_id' in item)

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-full" />
        {[1, 2, 3].map(i => (
          <Card key={i} className="w-full">
            <CardHeader className="flex flex-row items-center gap-4">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
            </CardHeader>
            <CardContent>
              <Skeleton className="h-16 w-full" />
            </CardContent>
            <CardFooter>
              <Skeleton className="h-8 w-full" />
            </CardFooter>
          </Card>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 text-center">
        <p className="text-red-500">Error loading social feed. Please try again later.</p>
        <Button 
          onClick={() => fetchFeed()} 
          variant="outline" 
          className="mt-2"
        >
          Retry
        </Button>
      </div>
    )
  }

  if (feed.length === 0) {
    return (
      <div className="p-8 text-center">
        <h3 className="text-xl font-semibold mb-2">Your feed is empty</h3>
        <p className="text-muted-foreground mb-4">
          Follow other users to see their workouts and achievements here.
        </p>
        <Button variant="default">Find People to Follow</Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-3 mb-4">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="workouts">Workouts</TabsTrigger>
          <TabsTrigger value="achievements">Achievements</TabsTrigger>
        </TabsList>
      </Tabs>

      {filteredFeed.map(item => {
        const isWorkout = 'workout_id' in item
        const itemType = isWorkout ? 'workout' : 'achievement'
        
        return (
          <Card key={item.id} className="w-full">
            <CardHeader className="flex flex-row items-center gap-4 pb-2">
              <Avatar>
                <AvatarImage src={item.user?.avatar_url || undefined} />
                <AvatarFallback>
                  {getInitials(item.user?.display_name || 'User')}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-semibold">{item.user?.display_name}</h3>
                <p className="text-sm text-muted-foreground">
                  {formatTimeAgo(item.shared_at)}
                </p>
              </div>
            </CardHeader>
            
            <CardContent>
              {isWorkout ? (
                <div className="space-y-2">
                  <h4 className="font-medium">
                    Completed: {(item as any).workout?.title}
                  </h4>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="px-2 py-1 bg-muted rounded-md">
                      {(item as any).workout?.difficulty || 'Unknown'} difficulty
                    </span>
                    <span>
                      {Math.floor((item as any).duration_seconds / 60)} minutes
                    </span>
                  </div>
                  {(item as any).notes && (
                    <p className="text-sm mt-2 italic">
                      "{(item as any).notes}"
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">🏆</span>
                    <h4 className="font-medium">
                      Earned: {(item as any).achievement?.name}
                    </h4>
                  </div>
                  <p className="text-sm">
                    {(item as any).achievement?.description}
                  </p>
                  <div className="text-sm px-2 py-1 bg-muted rounded-md inline-block">
                    +{(item as any).achievement?.reward_points} points
                  </div>
                </div>
              )}
            </CardContent>
            
            <CardFooter className="flex justify-between pt-2">
              <div className="flex items-center gap-1">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="flex items-center gap-1"
                  onClick={() => handleLike(itemType, item.id)}
                >
                  {likedItems[item.id] ? (
                    <span className="text-red-500">❤️</span>
                  ) : (
                    <span>🤍</span>
                  )}
                  <span>{item.likes_count}</span>
                </Button>
                <Button variant="ghost" size="sm" className="flex items-center gap-1">
                  <span>💬</span>
                  <span>{item.comments_count}</span>
                </Button>
              </div>
              <Button variant="ghost" size="sm">
                <span>↗️</span>
              </Button>
            </CardFooter>
          </Card>
        )
      })}
    </div>
  )
} 