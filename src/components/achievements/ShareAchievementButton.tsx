'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useSocial } from '@/hooks/useSocial'
import { useToast } from '@/components/ui/toast'

interface ShareAchievementButtonProps {
  achievementId: string
  achievementName: string
  isEarned: boolean
}

export default function ShareAchievementButton({
  achievementId,
  achievementName,
  isEarned
}: ShareAchievementButtonProps) {
  const [isSharing, setIsSharing] = useState(false)
  const { shareAchievement } = useSocial()
  const { toast } = useToast()

  const handleShare = async () => {
    if (!isEarned) {
      toast({
        title: 'Cannot Share',
        description: 'You can only share achievements you have earned.',
        variant: 'destructive'
      })
      return
    }

    setIsSharing(true)
    try {
      await shareAchievement(achievementId)
      toast({
        title: 'Achievement Shared',
        description: `You've shared your "${achievementName}" achievement with your followers.`,
        variant: 'success'
      })
    } catch (error) {
      console.error('Error sharing achievement:', error)
      toast({
        title: 'Error',
        description: 'Failed to share achievement. Please try again.',
        variant: 'destructive'
      })
    } finally {
      setIsSharing(false)
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleShare}
      disabled={isSharing || !isEarned}
      className="flex items-center gap-1"
    >
      <span>🔄</span>
      {isSharing ? 'Sharing...' : 'Share'}
    </Button>
  )
} 