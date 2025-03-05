'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Database } from '@/types/database'
import { useToast } from '@/components/ui/toast'

export interface Comment {
  id: string
  user_id: string
  content: string
  created_at: string
  updated_at: string
  parent_id: string | null
  item_type: 'workout' | 'achievement'
  item_id: string
  user: {
    username: string
    display_name: string
    avatar_url: string | null
  } | null
  replies?: Comment[]
  likes_count: number
  is_liked?: boolean
}

export function useComments() {
  const [comments, setComments] = useState<Comment[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const supabase = createClientComponentClient<Database>()
  const { toast } = useToast()
  
  const fetchComments = useCallback(async (itemType: 'workout' | 'achievement', itemId: string) => {
    try {
      setIsLoading(true)
      setError(null)
      
      const { data: { session } } = await supabase.auth.getSession()
      
      // Fetch all comments for the item
      const { data, error: commentsError } = await supabase
        .from('comments')
        .select(`
          *,
          user:user_id (
            username,
            display_name,
            avatar_url
          )
        `)
        .eq('item_type', itemType)
        .eq('item_id', itemId)
        .order('created_at', { ascending: true })
      
      if (commentsError) throw commentsError
      
      // Fetch likes for the current user if logged in
      let userLikes: Record<string, boolean> = {}
      
      if (session?.user) {
        const { data: likesData, error: likesError } = await supabase
          .from('comment_likes')
          .select('comment_id')
          .eq('user_id', session.user.id)
        
        if (likesError) throw likesError
        
        userLikes = (likesData || []).reduce((acc, like) => {
          acc[like.comment_id] = true
          return acc
        }, {} as Record<string, boolean>)
      }
      
      // Organize comments into a tree structure (top-level comments and replies)
      const commentMap: Record<string, Comment> = {}
      const topLevelComments: Comment[] = []
      
      // First pass: create a map of all comments
      data?.forEach(comment => {
        commentMap[comment.id] = {
          ...comment,
          replies: [],
          is_liked: userLikes[comment.id] || false
        }
      })
      
      // Second pass: organize into parent-child relationships
      data?.forEach(comment => {
        const processedComment = commentMap[comment.id]
        
        if (comment.parent_id === null) {
          // This is a top-level comment
          topLevelComments.push(processedComment)
        } else if (commentMap[comment.parent_id]) {
          // This is a reply, add it to its parent's replies
          commentMap[comment.parent_id].replies?.push(processedComment)
        }
      })
      
      setComments(topLevelComments)
    } catch (err) {
      console.error('Error fetching comments:', err)
      setError('Failed to load comments')
    } finally {
      setIsLoading(false)
    }
  }, [supabase])
  
  const addComment = async (
    itemType: 'workout' | 'achievement',
    itemId: string,
    content: string,
    parentId: string | null = null
  ) => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        throw new Error('You must be logged in to comment')
      }
      
      // Add the comment
      const { data, error } = await supabase
        .from('comments')
        .insert({
          user_id: session.user.id,
          content,
          item_type: itemType,
          item_id: itemId,
          parent_id: parentId,
          likes_count: 0
        })
        .select(`
          *,
          user:user_id (
            username,
            display_name,
            avatar_url
          )
        `)
        .single()
      
      if (error) throw error
      
      // Update the comments state
      if (parentId === null) {
        // This is a new top-level comment
        setComments(prev => [...prev, { ...data, replies: [], is_liked: false }])
      } else {
        // This is a reply to an existing comment
        setComments(prev => {
          return prev.map(comment => {
            if (comment.id === parentId) {
              // Add reply to this comment
              return {
                ...comment,
                replies: [...(comment.replies || []), { ...data, replies: [], is_liked: false }]
              }
            } else if (comment.replies?.some(reply => reply.id === parentId)) {
              // The parent is a reply to this comment
              return {
                ...comment,
                replies: comment.replies.map(reply => {
                  if (reply.id === parentId) {
                    return {
                      ...reply,
                      replies: [...(reply.replies || []), { ...data, replies: [], is_liked: false }]
                    }
                  }
                  return reply
                })
              }
            }
            return comment
          })
        })
      }
      
      // Update comment count on the shared item
      const updateTable = itemType === 'workout' ? 'shared_workouts' : 'shared_achievements'
      await supabase
        .from(updateTable)
        .update({ comments_count: supabase.rpc('increment') })
        .eq('id', itemId)
      
      toast({
        title: 'Comment Added',
        description: parentId ? 'Your reply has been posted.' : 'Your comment has been posted.',
        variant: 'success'
      })
      
      return data
    } catch (err) {
      console.error('Error adding comment:', err)
      
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to post comment. Please try again.',
        variant: 'destructive'
      })
      
      return null
    }
  }
  
  const editComment = async (commentId: string, content: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        throw new Error('You must be logged in to edit a comment')
      }
      
      // First check if the user owns this comment
      const { data: commentData, error: checkError } = await supabase
        .from('comments')
        .select('user_id')
        .eq('id', commentId)
        .single()
      
      if (checkError) throw checkError
      
      if (commentData.user_id !== session.user.id) {
        throw new Error('You can only edit your own comments')
      }
      
      // Update the comment
      const { data, error } = await supabase
        .from('comments')
        .update({ content, updated_at: new Date().toISOString() })
        .eq('id', commentId)
        .select()
        .single()
      
      if (error) throw error
      
      // Update the comments state
      setComments(prev => {
        return prev.map(comment => {
          if (comment.id === commentId) {
            return { ...comment, content, updated_at: data.updated_at }
          } else if (comment.replies?.some(reply => reply.id === commentId)) {
            return {
              ...comment,
              replies: comment.replies.map(reply => 
                reply.id === commentId 
                  ? { ...reply, content, updated_at: data.updated_at }
                  : reply
              )
            }
          }
          return comment
        })
      })
      
      toast({
        title: 'Comment Updated',
        description: 'Your comment has been updated.',
        variant: 'success'
      })
      
      return data
    } catch (err) {
      console.error('Error editing comment:', err)
      
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to update comment. Please try again.',
        variant: 'destructive'
      })
      
      return null
    }
  }
  
  const deleteComment = async (commentId: string, itemType: 'workout' | 'achievement', itemId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        throw new Error('You must be logged in to delete a comment')
      }
      
      // First check if the user owns this comment
      const { data: commentData, error: checkError } = await supabase
        .from('comments')
        .select('user_id, parent_id')
        .eq('id', commentId)
        .single()
      
      if (checkError) throw checkError
      
      if (commentData.user_id !== session.user.id) {
        throw new Error('You can only delete your own comments')
      }
      
      // Delete the comment
      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', commentId)
      
      if (error) throw error
      
      // Update the comments state
      if (commentData.parent_id === null) {
        // This is a top-level comment, remove it and all its replies
        setComments(prev => prev.filter(comment => comment.id !== commentId))
      } else {
        // This is a reply, just remove it from its parent
        setComments(prev => {
          return prev.map(comment => {
            if (comment.id === commentData.parent_id) {
              return {
                ...comment,
                replies: comment.replies?.filter(reply => reply.id !== commentId) || []
              }
            } else if (comment.replies?.some(reply => reply.id === commentData.parent_id)) {
              return {
                ...comment,
                replies: comment.replies.map(reply => {
                  if (reply.id === commentData.parent_id) {
                    return {
                      ...reply,
                      replies: reply.replies?.filter(r => r.id !== commentId) || []
                    }
                  }
                  return reply
                })
              }
            }
            return comment
          })
        })
      }
      
      // Update comment count on the shared item
      const updateTable = itemType === 'workout' ? 'shared_workouts' : 'shared_achievements'
      await supabase
        .from(updateTable)
        .update({ comments_count: supabase.rpc('decrement') })
        .eq('id', itemId)
      
      toast({
        title: 'Comment Deleted',
        description: 'Your comment has been removed.',
        variant: 'success'
      })
      
      return true
    } catch (err) {
      console.error('Error deleting comment:', err)
      
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to delete comment. Please try again.',
        variant: 'destructive'
      })
      
      return false
    }
  }
  
  const likeComment = async (commentId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        throw new Error('You must be logged in to like a comment')
      }
      
      // Check if already liked
      const { data: existingLike, error: checkError } = await supabase
        .from('comment_likes')
        .select('*')
        .eq('user_id', session.user.id)
        .eq('comment_id', commentId)
        .maybeSingle()
      
      if (checkError) throw checkError
      
      if (existingLike) {
        // Already liked, unlike
        const { error: deleteError } = await supabase
          .from('comment_likes')
          .delete()
          .eq('user_id', session.user.id)
          .eq('comment_id', commentId)
        
        if (deleteError) throw deleteError
        
        // Decrement likes count
        await supabase
          .from('comments')
          .update({ likes_count: supabase.rpc('decrement') })
          .eq('id', commentId)
        
        // Update state
        setComments(prev => {
          return prev.map(comment => {
            if (comment.id === commentId) {
              return { 
                ...comment, 
                likes_count: Math.max(0, comment.likes_count - 1),
                is_liked: false 
              }
            } else if (comment.replies?.some(reply => reply.id === commentId)) {
              return {
                ...comment,
                replies: comment.replies.map(reply => 
                  reply.id === commentId 
                    ? { 
                        ...reply, 
                        likes_count: Math.max(0, reply.likes_count - 1),
                        is_liked: false 
                      }
                    : reply
                )
              }
            }
            return comment
          })
        })
        
        return false
      } else {
        // Not liked, like
        const { error: insertError } = await supabase
          .from('comment_likes')
          .insert({
            user_id: session.user.id,
            comment_id: commentId
          })
        
        if (insertError) throw insertError
        
        // Increment likes count
        await supabase
          .from('comments')
          .update({ likes_count: supabase.rpc('increment') })
          .eq('id', commentId)
        
        // Update state
        setComments(prev => {
          return prev.map(comment => {
            if (comment.id === commentId) {
              return { 
                ...comment, 
                likes_count: comment.likes_count + 1,
                is_liked: true 
              }
            } else if (comment.replies?.some(reply => reply.id === commentId)) {
              return {
                ...comment,
                replies: comment.replies.map(reply => 
                  reply.id === commentId 
                    ? { 
                        ...reply, 
                        likes_count: reply.likes_count + 1,
                        is_liked: true 
                      }
                    : reply
                )
              }
            }
            return comment
          })
        })
        
        return true
      }
    } catch (err) {
      console.error('Error liking/unliking comment:', err)
      
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to like comment. Please try again.',
        variant: 'destructive'
      })
      
      return null
    }
  }
  
  return {
    comments,
    isLoading,
    error,
    fetchComments,
    addComment,
    editComment,
    deleteComment,
    likeComment
  }
} 