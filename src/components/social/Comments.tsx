'use client'

import { useState, useEffect, useRef } from 'react'
import { useComments, Comment } from '@/hooks/useComments'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { formatDistanceToNow } from 'date-fns'

interface CommentsProps {
  itemType: 'workout' | 'achievement'
  itemId: string
}

export function Comments({ itemType, itemId }: CommentsProps) {
  const { comments, isLoading, error, fetchComments, addComment, editComment, deleteComment, likeComment } = useComments()
  const { user } = useAuth()
  const [newComment, setNewComment] = useState('')
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyContent, setReplyContent] = useState('')
  const [editingComment, setEditingComment] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')
  const commentInputRef = useRef<HTMLTextAreaElement>(null)
  
  useEffect(() => {
    fetchComments(itemType, itemId)
  }, [fetchComments, itemType, itemId])
  
  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim()) return
    
    const result = await addComment(itemType, itemId, newComment)
    if (result) {
      setNewComment('')
    }
  }
  
  const handleSubmitReply = async (e: React.FormEvent, parentId: string) => {
    e.preventDefault()
    if (!replyContent.trim()) return
    
    const result = await addComment(itemType, itemId, replyContent, parentId)
    if (result) {
      setReplyContent('')
      setReplyingTo(null)
    }
  }
  
  const handleStartEditing = (comment: Comment) => {
    setEditingComment(comment.id)
    setEditContent(comment.content)
  }
  
  const handleSubmitEdit = async (e: React.FormEvent, commentId: string) => {
    e.preventDefault()
    if (!editContent.trim()) return
    
    const result = await editComment(commentId, editContent)
    if (result) {
      setEditingComment(null)
      setEditContent('')
    }
  }
  
  const handleCancelEdit = () => {
    setEditingComment(null)
    setEditContent('')
  }
  
  const handleLikeComment = async (commentId: string) => {
    await likeComment(commentId)
  }
  
  const renderCommentActions = (comment: Comment) => {
    const isOwner = user?.id === comment.user_id
    
    return (
      <div className="flex space-x-2 text-xs text-gray-500">
        <button 
          onClick={() => handleLikeComment(comment.id)}
          className={`flex items-center ${comment.is_liked ? 'text-blue-500' : ''}`}
        >
          <span className="mr-1">{comment.is_liked ? '❤️' : '🤍'}</span>
          {comment.likes_count > 0 && comment.likes_count}
        </button>
        
        {user && (
          <button 
            onClick={() => {
              setReplyingTo(comment.id)
              setReplyContent('')
              // Focus the reply input after state update
              setTimeout(() => {
                const replyInput = document.getElementById(`reply-${comment.id}`)
                if (replyInput) {
                  replyInput.focus()
                }
              }, 0)
            }}
            className="hover:text-blue-500"
          >
            Reply
          </button>
        )}
        
        {isOwner && (
          <>
            <button 
              onClick={() => handleStartEditing(comment)}
              className="hover:text-blue-500"
            >
              Edit
            </button>
            <button 
              onClick={() => deleteComment(comment.id, itemType, itemId)}
              className="hover:text-red-500"
            >
              Delete
            </button>
          </>
        )}
      </div>
    )
  }
  
  const renderComment = (comment: Comment, isReply = false) => {
    const isEditing = editingComment === comment.id
    const displayName = comment.user?.display_name || 'Unknown User'
    const firstLetter = displayName.charAt(0).toUpperCase()
    
    return (
      <div key={comment.id} className={`${isReply ? 'ml-8 mt-2' : 'mt-4'} border-l-2 pl-4 ${isReply ? 'border-gray-200' : 'border-gray-300'}`}>
        <div className="flex items-start space-x-3">
          <Avatar className="w-8 h-8">
            {comment.user?.avatar_url ? (
              <AvatarImage src={comment.user.avatar_url} alt={displayName} />
            ) : (
              <AvatarFallback>{firstLetter}</AvatarFallback>
            )}
          </Avatar>
          
          <div className="flex-1">
            <div className="flex items-center">
              <span className="font-medium text-sm">
                {displayName}
              </span>
              <span className="text-xs text-gray-500 ml-2">
                {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                {comment.updated_at !== comment.created_at && ' (edited)'}
              </span>
            </div>
            
            {isEditing ? (
              <form onSubmit={(e) => handleSubmitEdit(e, comment.id)}>
                <Textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="mt-1 w-full text-sm"
                  rows={2}
                />
                <div className="flex justify-end space-x-2 mt-1">
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm"
                    onClick={handleCancelEdit}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" size="sm">Save</Button>
                </div>
              </form>
            ) : (
              <p className="text-sm mt-1">{comment.content}</p>
            )}
            
            {!isEditing && renderCommentActions(comment)}
            
            {replyingTo === comment.id && (
              <form 
                onSubmit={(e) => handleSubmitReply(e, comment.id)} 
                className="mt-2"
              >
                <Textarea
                  id={`reply-${comment.id}`}
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  placeholder="Write a reply..."
                  className="w-full text-sm"
                  rows={2}
                />
                <div className="flex justify-end space-x-2 mt-1">
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm"
                    onClick={() => setReplyingTo(null)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" size="sm">Reply</Button>
                </div>
              </form>
            )}
            
            {comment.replies && comment.replies.length > 0 && (
              <div className="mt-2">
                {comment.replies.map(reply => renderComment(reply, true))}
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }
  
  if (isLoading) {
    return <div className="py-4 text-center text-gray-500">Loading comments...</div>
  }
  
  if (error) {
    return <div className="py-4 text-center text-red-500">{error}</div>
  }
  
  return (
    <div className="mt-6">
      <h3 className="text-lg font-semibold mb-4">Comments</h3>
      
      {user ? (
        <form onSubmit={handleSubmitComment} className="mb-6">
          <Textarea
            ref={commentInputRef}
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Write a comment..."
            className="w-full"
            rows={3}
          />
          <div className="flex justify-end mt-2">
            <Button type="submit" disabled={!newComment.trim()}>
              Post Comment
            </Button>
          </div>
        </form>
      ) : (
        <div className="bg-gray-50 p-4 rounded-md mb-6 text-center">
          <p className="text-gray-600">Sign in to join the conversation</p>
        </div>
      )}
      
      {comments.length === 0 ? (
        <div className="py-4 text-center text-gray-500">
          No comments yet. Be the first to comment!
        </div>
      ) : (
        <div>
          {comments.map(comment => renderComment(comment))}
        </div>
      )}
    </div>
  )
} 