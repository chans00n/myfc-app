'use client'

import { useState } from 'react'
import { useSocial } from '@/hooks/useSocial'
import SocialFeed from '@/components/social/SocialFeed'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'

export default function SocialPage() {
  const { profile, followers, following, isLoading, error } = useSocial()
  const [activeTab, setActiveTab] = useState('feed')

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2)
  }

  if (isLoading) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="md:col-span-1">
            <Card>
              <CardHeader>
                <Skeleton className="h-8 w-32 mb-2" />
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-center">
                  <Skeleton className="h-24 w-24 rounded-full" />
                </div>
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-10 w-full" />
              </CardContent>
            </Card>
          </div>
          <div className="md:col-span-3">
            <Skeleton className="h-12 w-full mb-4" />
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-48 w-full" />
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto py-6">
        <div className="p-6 text-center">
          <h2 className="text-2xl font-bold text-red-500 mb-2">Error</h2>
          <p className="mb-4">{error}</p>
          <Button>Retry</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Profile Sidebar */}
        <div className="md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>My Profile</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-center">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={profile?.avatar_url || undefined} />
                  <AvatarFallback>
                    {getInitials(profile?.display_name || 'User')}
                  </AvatarFallback>
                </Avatar>
              </div>
              
              <div className="text-center">
                <h3 className="font-bold text-lg">{profile?.display_name}</h3>
                <p className="text-muted-foreground">@{profile?.username}</p>
              </div>
              
              <div className="flex justify-center space-x-4 text-center">
                <div>
                  <p className="font-bold">{profile?.followers_count || 0}</p>
                  <p className="text-sm text-muted-foreground">Followers</p>
                </div>
                <div>
                  <p className="font-bold">{profile?.following_count || 0}</p>
                  <p className="text-sm text-muted-foreground">Following</p>
                </div>
              </div>
              
              <Button className="w-full">Edit Profile</Button>
            </CardContent>
          </Card>
        </div>
        
        {/* Main Content */}
        <div className="md:col-span-3">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full grid grid-cols-3 mb-6">
              <TabsTrigger value="feed">Feed</TabsTrigger>
              <TabsTrigger value="followers">Followers</TabsTrigger>
              <TabsTrigger value="following">Following</TabsTrigger>
            </TabsList>
            
            <TabsContent value="feed" className="space-y-4">
              <SocialFeed />
            </TabsContent>
            
            <TabsContent value="followers" className="space-y-4">
              {followers.length === 0 ? (
                <Card>
                  <CardContent className="p-6 text-center">
                    <h3 className="text-xl font-semibold mb-2">No followers yet</h3>
                    <p className="text-muted-foreground">
                      Share your workouts and achievements to attract followers.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {followers.map(follower => (
                    <Card key={follower.id}>
                      <CardContent className="p-4 flex items-center gap-4">
                        <Avatar>
                          <AvatarImage src={follower.avatar_url || undefined} />
                          <AvatarFallback>
                            {getInitials(follower.display_name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <h4 className="font-semibold">{follower.display_name}</h4>
                          <p className="text-sm text-muted-foreground">@{follower.username}</p>
                        </div>
                        <Button variant="outline" size="sm">
                          View
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="following" className="space-y-4">
              {following.length === 0 ? (
                <Card>
                  <CardContent className="p-6 text-center">
                    <h3 className="text-xl font-semibold mb-2">Not following anyone</h3>
                    <p className="text-muted-foreground mb-4">
                      Follow other users to see their workouts and achievements.
                    </p>
                    <Button>Find People</Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {following.map(follow => (
                    <Card key={follow.id}>
                      <CardContent className="p-4 flex items-center gap-4">
                        <Avatar>
                          <AvatarImage src={follow.avatar_url || undefined} />
                          <AvatarFallback>
                            {getInitials(follow.display_name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <h4 className="font-semibold">{follow.display_name}</h4>
                          <p className="text-sm text-muted-foreground">@{follow.username}</p>
                        </div>
                        <Button variant="outline" size="sm">
                          View
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
} 