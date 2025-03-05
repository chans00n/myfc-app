'use client'

import { useEffect, useState, useRef } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { formatDate } from '@/lib/utils'
import type { FC } from 'react'
import { 
  ChevronUpIcon,
  ChevronDownIcon,
  ArrowUturnLeftIcon as ReplyIcon,
  TrashIcon
} from '@heroicons/react/24/outline'
import { ArrowsUpDownIcon, MagnifyingGlassIcon, FunnelIcon, XMarkIcon, PaperAirplaneIcon, PhotoIcon } from '@heroicons/react/24/solid'

type Message = {
  id: string
  content: string
  created_at: string
  user_id: string
  channel: string
  parent_id: string | null
  vote_count: number
  image_url?: string | null
  profiles?: {
    full_name: string | null
    avatar_url: string | null
  } | null
  userVote?: number | null // 1 for upvote, -1 for downvote, null for no vote
  replies: Message[] // Make replies non-optional with default empty array
}

type ChatMessagesProps = {
  initialMessages: Message[]
  channel: string
}

export default function ChatMessages({ initialMessages, channel }: ChatMessagesProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages || [])
  const [newMessage, setNewMessage] = useState('')
  const [replyTo, setReplyTo] = useState<Message | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [votingEnabled, setVotingEnabled] = useState<boolean | null>(null) // null = checking, true = enabled, false = disabled
  const [sortOrder, setSortOrder] = useState<'best' | 'top' | 'new' | 'old'>('best')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Message[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [searchFilters, setSearchFilters] = useState({
    onlyTopLevel: false,
    onlyReplies: false,
    fromDate: '',
    toDate: '',
    minVotes: '',
    authorName: ''
  })
  const [shouldScrollToBottom, setShouldScrollToBottom] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClientComponentClient()
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [user, setUser] = useState<any>(null)

  // Fetch user data
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data, error } = await supabase.auth.getUser()
        if (error) {
          console.error('Error fetching user:', error)
          return
        }
        setUser(data.user)
      } catch (error) {
        console.error('Error in auth state change:', error)
      }
    }
    
    fetchUser()
    
    // Set up auth state change listener
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          setUser(session.user)
        } else {
          setUser(null)
        }
      }
    )
    
    return () => {
      authListener?.subscription.unsubscribe()
    }
  }, [supabase.auth])

  // Check if message_votes table exists
  useEffect(() => {
    async function checkMessageVotesTable() {
      try {
        console.log('Checking if message_votes table exists...')
        setVotingEnabled(null) // Set to checking
        
        // Try to query the message_votes table
        const { data, error } = await supabase
          .from('message_votes')
          .select('id')
          .limit(1)
        
        if (error) {
          if (error.code === '42P01' || error.message?.includes('Not Acceptable')) {
            console.error('The message_votes table does not exist or has issues:', error)
            setVotingEnabled(false)
            return false
          } else {
            console.error('Error checking message_votes table:', error)
            setVotingEnabled(false)
            return false
          }
        }
        
        console.log('message_votes table exists and is accessible!')
        
        // Check the structure of the message_votes table
        try {
          const { data: structureData, error: structureError } = await supabase
            .from('message_votes')
            .select('id, message_id, user_id, vote_type, created_at')
            .limit(1)
          
          if (structureError) {
            console.error('Error checking message_votes table structure:', structureError)
            setVotingEnabled(false)
            return false
          }
          
          console.log('message_votes table structure is correct!')
          console.log('Sample data:', structureData)
          
          // Check if the RLS policies are working
          const { data: { user } } = await supabase.auth.getUser()
          if (user) {
            console.log('Checking RLS policies for user:', user.id)
            
            // Try to insert a test vote
            const testMessageId = '00000000-0000-0000-0000-000000000000' // A non-existent message ID
            const { error: insertError } = await supabase
              .from('message_votes')
              .insert({
                message_id: testMessageId,
                user_id: user.id,
                vote_type: 1
              })
            
            // We expect an error because the message doesn't exist, but it should be a foreign key error, not an RLS error
            if (insertError) {
              if (insertError.code === '23503') { // Foreign key violation
                console.log('RLS policies are working correctly! (Foreign key violation as expected)')
                
                // Try to select votes for the current user
                const { data: userVotes, error: selectError } = await supabase
                  .from('message_votes')
                  .select('id, message_id, vote_type')
                  .eq('user_id', user.id)
                  .limit(5)
                
                if (selectError) {
                  console.error('Error selecting user votes:', selectError)
                  setVotingEnabled(false)
                } else {
                  console.log('User votes:', userVotes)
                  setVotingEnabled(true)
                }
                
                return true
              } else if (insertError.code === '42501') { // Permission denied
                console.error('RLS policies are not configured correctly:', insertError)
                setVotingEnabled(false)
                return false
              } else {
                console.error('Unexpected error testing RLS policies:', insertError)
                setVotingEnabled(false)
                return false
              }
            } else {
              // This shouldn't happen since the message ID doesn't exist
              console.warn('Unexpectedly inserted a vote for a non-existent message')
              
              // Clean up the test vote
              await supabase
                .from('message_votes')
                .delete()
                .eq('message_id', testMessageId)
                .eq('user_id', user.id)
              
              setVotingEnabled(true)
              return true
            }
          }
          
          setVotingEnabled(true)
          return true
        } catch (structureErr) {
          console.error('Error checking message_votes table structure:', structureErr)
          setVotingEnabled(false)
          return false
        }
      } catch (err) {
        console.error('Error checking message_votes table:', err)
        setVotingEnabled(false)
        return false
      }
    }
    
    checkMessageVotesTable()
  }, [supabase])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    if (shouldScrollToBottom) {
    scrollToBottom()
      setShouldScrollToBottom(false)
    }
  }, [messages, shouldScrollToBottom])

  // Organize messages into a tree structure
  const organizeMessages = (msgs: Message[]): Message[] => {
    console.log(`Organizing messages into tree structure: ${msgs.length} messages`)
    
    // Create a map of message IDs to their indices in the array
    const messageMap = new Map<string, number>()
    msgs.forEach((msg, index) => {
      messageMap.set(msg.id, index)
    })
    
    // Find replies and add them to their parent messages
    let replyCount = 0
    const topLevelMessages: Message[] = []
    
    msgs.forEach(msg => {
      // Ensure replies array exists
      if (!msg.replies) {
        msg.replies = []
      }
      
      if (msg.parent_id && messageMap.has(msg.parent_id)) {
        // This is a reply, add it to its parent
        const parentIndex = messageMap.get(msg.parent_id)!
        if (!msgs[parentIndex].replies) {
          msgs[parentIndex].replies = []
        }
        msgs[parentIndex].replies.push(msg)
        replyCount++
      } else {
        // This is a top-level message
        topLevelMessages.push(msg)
      }
    })
    
    console.log(`Found ${replyCount} replies out of ${msgs.length} messages`)
    
    // Sort replies by created_at
    const sortReplies = (messages: Message[]) => {
      for (const message of messages) {
        if (message.replies && message.replies.length > 0) {
          message.replies.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
          sortReplies(message.replies)
        }
      }
    }
    
    sortReplies(topLevelMessages)
    
    // Sort top-level messages based on the selected sort order
    switch (sortOrder) {
      case 'best':
        topLevelMessages.sort((a, b) => (b.vote_count || 0) - (a.vote_count || 0))
        break
      case 'top':
        topLevelMessages.sort((a, b) => {
          // Count only upvotes (this is an approximation since we don't store upvotes separately)
          const aUpvotes = (a.vote_count || 0) > 0 ? a.vote_count : 0
          const bUpvotes = (b.vote_count || 0) > 0 ? b.vote_count : 0
          return bUpvotes - aUpvotes
        })
        break
      case 'new':
        topLevelMessages.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        break
      case 'old':
        topLevelMessages.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
        break
    }
    
    console.log(`Organized into ${topLevelMessages.length} top-level messages`)
    
    // Debug log for each top-level message and its replies
    topLevelMessages.forEach(msg => {
      console.log(`Top-level message ${msg.id} has ${msg.replies.length} replies`)
    })
    
    return topLevelMessages
  }

  // Add a function to handle sort order changes
  const handleSortChange = (newSortOrder: 'best' | 'top' | 'new' | 'old') => {
    // Don't trigger auto-scroll when sorting
    setShouldScrollToBottom(false)
    
    setSortOrder(newSortOrder)
    // Re-organize messages with the new sort order
    setMessages(prev => {
      // Create a flat array of all messages
      const flatMessages: Message[] = []
      const flattenMessages = (msgs: Message[]) => {
        msgs.forEach(msg => {
          const msgCopy = { ...msg, replies: [] }
          flatMessages.push(msgCopy)
          if (msg.replies && msg.replies.length > 0) {
            flattenMessages(msg.replies)
          }
        })
      }
      flattenMessages(prev)
      
      // Re-organize with the new sort order
      return organizeMessages(flatMessages)
    })
  }

  // Fetch messages when channel changes
  useEffect(() => {
    async function fetchMessages() {
      console.log('Fetching messages for channel:', channel)
      try {
        // First fetch messages
        const { data: messagesData, error: messagesError } = await supabase
          .from('messages')
          .select('*')
          .eq('channel', channel)
          .order('created_at', { ascending: true })
          .limit(100)

        if (messagesError) throw messagesError
        
        console.log('Raw messages data:', messagesData)
        
        // Check for messages with parent_id
        const repliesCount = messagesData.filter(m => m.parent_id !== null).length
        console.log(`Found ${repliesCount} replies out of ${messagesData.length} messages in raw data`)

        // Then fetch profiles for those messages
        const messagesWithProfiles = await Promise.all(
          messagesData.map(async (message) => {
            const { data: profileData } = await supabase
              .from('profiles')
              .select('full_name, avatar_url')
              .eq('id', message.user_id)
              .single()

            // Get user's vote on this message if logged in
            const { data: { user } } = await supabase.auth.getUser()
            let userVote = null
            
            if (user) {
              try {
                // Check if message_votes table exists and get vote data
                const { data: voteData, error: voteError } = await supabase
                  .from('message_votes')
                  .select('vote_type')
                  .eq('message_id', message.id)
                  .eq('user_id', user.id)
                  .maybeSingle() // Use maybeSingle instead of single to avoid errors
                
                if (!voteError) {
                  userVote = voteData?.vote_type || null
                } else if (voteError.code === '42P01' || voteError.message?.includes('Not Acceptable')) {
                  // Table doesn't exist or has issues, just continue with null userVote
                  console.warn('message_votes table does not exist or has issues:', voteError)
                } else {
                  console.error('Error fetching vote data:', voteError)
                }
              } catch (err) {
                console.error('Error fetching vote data:', err)
                // Continue with null userVote
              }
            }

            return {
              ...message,
              profiles: profileData || { full_name: null, avatar_url: null },
              userVote,
              replies: [] // Initialize with empty array
            } as Message
          })
        )

        console.log('Fetched messages with profiles:', messagesWithProfiles)
        
        // Log parent-child relationships
        messagesWithProfiles.forEach(msg => {
          if (msg.parent_id) {
            console.log(`Message ${msg.id} is a reply to ${msg.parent_id}`)
          }
        })
        
        // Organize into tree structure
        const organizedMessages = organizeMessages(messagesWithProfiles)
        console.log('Final organized messages structure:', organizedMessages)
        setMessages(organizedMessages)
      } catch (err) {
        console.error('Error fetching messages:', err)
      }
    }

    fetchMessages()
  }, [channel, supabase])

  // Set up real-time subscription
  useEffect(() => {
    console.log('Setting up real-time subscription for channel:', channel)
    const subscription = supabase
      .channel('messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `channel=eq.${channel}`,
        },
        async (payload) => {
          console.log('Received real-time update:', payload)
          try {
            // Ensure payload.new has all required Message properties
            if (!payload.new.id || !payload.new.content || !payload.new.created_at || 
                !payload.new.user_id || !payload.new.channel) {
              console.error('Payload missing required fields:', payload.new)
              return
            }
            
            // Skip if this is our own message (already added via optimistic update)
            const { data: { user } } = await supabase.auth.getUser()
            if (user && payload.new.user_id === user.id) {
              console.log('Skipping own message from real-time update:', payload.new.id)
              return
            }
            
            // Fetch the complete message with all fields
            const { data: completeMessage, error: messageError } = await supabase
              .from('messages')
              .select('*')
              .eq('id', payload.new.id)
              .single()
              
            if (messageError || !completeMessage) {
              console.error('Error fetching complete message:', messageError)
              return
            }
            
            // Fetch the profile data separately
            const { data: profileData } = await supabase
              .from('profiles')
              .select('full_name, avatar_url')
              .eq('id', completeMessage.user_id)
              .single()

            // Combine message with profile data
            const messageWithProfile: Message = {
              ...completeMessage,
              profiles: profileData || { full_name: null, avatar_url: null },
              userVote: null,
              replies: [] // Initialize with empty array
            }

            console.log('Message with profile from real-time update:', messageWithProfile)
            
            setMessages(prevMessages => {
              const newMessages = [...prevMessages]
              
              // Check if this is a reply
              if (messageWithProfile.parent_id) {
                const addReply = (messages: Message[]): boolean => {
                  for (let i = 0; i < messages.length; i++) {
                    if (messages[i].id === messageWithProfile.parent_id) {
                      if (!messages[i].replies) {
                        messages[i].replies = []
                      }
                      messages[i].replies.push(messageWithProfile)
                      return true
                    }
                    if (messages[i].replies && messages[i].replies.length > 0) {
                      if (addReply(messages[i].replies)) {
                        return true
                      }
                    }
                  }
                  return false
                }
                
                if (!addReply(newMessages)) {
                  // If parent not found, add as top-level message
                  newMessages.push(messageWithProfile)
                }
              } else {
                // Add as top-level message
                newMessages.push(messageWithProfile)
              }
              
              // Set flag to scroll to bottom for new messages
              setShouldScrollToBottom(true)
              
              return organizeMessages(newMessages)
            })
          } catch (err) {
            console.error('Error processing real-time message:', err)
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `channel=eq.${channel}`,
        },
        async (payload) => {
          console.log('Received message update:', payload)
          
          // Fetch the complete updated message with profile
          const { data: updatedMessage } = await supabase
            .from('messages')
            .select('*')
            .eq('id', payload.new.id)
            .single()
            
          if (!updatedMessage) {
            console.error('Could not fetch updated message')
            return
          }
          
          // Fetch profile data
          const { data: profileData } = await supabase
            .from('profiles')
            .select('full_name, avatar_url')
            .eq('id', updatedMessage.user_id)
            .single()
            
          // Create complete message object
          const messageWithProfile: Message = {
            ...updatedMessage,
            profiles: profileData || { full_name: null, avatar_url: null },
            userVote: null,
            replies: [] // Will be populated from existing state
          }
          
          setMessages((prev) => {
            // First, find and remove the message from its current location
            let existingReplies: Message[] = []
            let messageFound = false
            
            const removeMessage = (messages: Message[]): Message[] => {
              return messages.filter(m => {
                if (m.id === messageWithProfile.id) {
                  // Save any existing replies before removing
                  existingReplies = m.replies || []
                  messageFound = true
                  return false
                }
                if (m.replies.length > 0) {
                  m.replies = removeMessage(m.replies)
                }
                return true
              })
            }
            
            let updatedMessages = removeMessage([...prev])
            
            // Add replies to the updated message
            messageWithProfile.replies = existingReplies
            
            // If it has a parent_id, try to add it to the parent's replies
            if (messageWithProfile.parent_id) {
              const addToParent = (messages: Message[]): boolean => {
                for (let i = 0; i < messages.length; i++) {
                  if (messages[i].id === messageWithProfile.parent_id) {
                    messages[i].replies.push(messageWithProfile)
                    return true
                  }
                  if (messages[i].replies.length > 0) {
                    if (addToParent(messages[i].replies)) {
                      return true
                    }
                  }
                }
                return false
              }
              
              if (addToParent(updatedMessages)) {
                return updatedMessages
              }
            }
            
            // If no parent or parent not found, add as top-level message
            return [...updatedMessages, messageWithProfile]
          })
        }
      )
      .subscribe((status) => {
        console.log('Subscription status:', status)
      })

    return () => {
      console.log('Cleaning up subscription for channel:', channel)
      supabase.removeChannel(subscription)
    }
  }, [channel, supabase])

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      
      // Check file size (limit to 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size must be less than 5MB')
        return
      }
      
      // Check file type
      if (!file.type.match('image.*')) {
        setError('Only image files are allowed')
        return
      }
      
      setSelectedImage(file)
      
      // Create preview URL
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreviewUrl(reader.result as string)
      }
      reader.readAsDataURL(file)
      
      setError('')
    }
  }
  
  const clearSelectedImage = () => {
    setSelectedImage(null)
    setImagePreviewUrl(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if ((!newMessage.trim() && !selectedImage) || isLoading) {
      return
    }
    
    if (!user) {
      alert('You must be logged in to post a message')
      return
    }
    
    setIsLoading(true)
    
    try {
      let finalContent = newMessage.trim()
      let imageUrl = null
      
      // Upload image if selected
      if (selectedImage) {
        // Use a fixed bucket name that you've already created in the Supabase dashboard
        const bucketName = 'chat-images';
        
        // Create a unique filename with timestamp
        const fileName = `${Date.now()}_${selectedImage.name.replace(/\s+/g, '_')}`;
        // Use a path structure with user ID as a folder for better permissions
        const filePath = `${user.id}/${fileName}`;
        
        try {
          // Upload to the bucket
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from(bucketName)
            .upload(filePath, selectedImage);
          
          if (uploadError) {
            console.error('Error uploading image:', uploadError);
            
            if (confirm(`Image upload failed: ${uploadError.message || 'Unknown error'}. Do you want to send the message without the image?`)) {
              // Continue with message submission
            } else {
              setIsLoading(false);
              return; // Stop submission if user cancels
            }
          } else if (uploadData) {
            // Get the public URL
            const { data: publicUrlData } = supabase.storage
              .from(bucketName)
              .getPublicUrl(filePath);
            
            if (publicUrlData) {
              imageUrl = publicUrlData.publicUrl;
              // Add image URL to content
              finalContent += finalContent ? `\n\n[Image: ${imageUrl}]` : `[Image: ${imageUrl}]`;
            }
          }
        } catch (error) {
          console.error('Unexpected error during image upload:', error);
          if (confirm('An unexpected error occurred during image upload. Do you want to send the message without the image?')) {
            // Continue with message submission
          } else {
            setIsLoading(false);
            return; // Stop submission if user cancels
          }
        }
      }
      
      // Prepare message data
      const messagePayload = {
        content: finalContent,
        channel: channel,
        user_id: user.id,
        parent_id: replyTo?.id || null,
      }
      
      // Insert message
      const { data: insertedMessage, error: messageError } = await supabase
        .from('messages')
        .insert(messagePayload)
        .select('*') // Just select the message data without trying to join with profiles
        .single()
      
      if (messageError) {
        console.error('Error posting message:', messageError)
        alert(`Error posting message: ${messageError.message}`)
        return
      }
      
      // Fetch user profile separately if needed
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      
      // Combine message with profile data
      const messageWithProfile = {
        ...insertedMessage,
        profiles: profileData || null
      }
      
      // Clear form
      setNewMessage('')
      clearSelectedImage()
      setReplyTo(null)
      
      // Update messages state
      if (replyTo) {
        // Add reply to the parent message
        setMessages(prevMessages => {
          const updatedMessages = JSON.parse(JSON.stringify(prevMessages))
          
          // Function to find the parent message and add the reply
          const addReply = (messages: Message[], reply: Message): boolean => {
            for (let i = 0; i < messages.length; i++) {
              if (messages[i].id === reply.parent_id) {
                if (!messages[i].replies) {
                  messages[i].replies = []
                }
                messages[i].replies.push(reply)
                return true
              }
              
              if (messages[i].replies && messages[i].replies.length > 0) {
                if (addReply(messages[i].replies, reply)) {
                  return true
                }
              }
            }
            return false
          }
          
          // Cast the inserted message to Message type
          const newReply = messageWithProfile as unknown as Message
          addReply(updatedMessages, newReply)
          return updatedMessages
        })
      } else {
        // Add new top-level message
        setMessages(prevMessages => {
          // Cast the inserted message to Message type and add required properties
          const newMessage = {
            ...messageWithProfile,
            replies: [],
            vote_count: 0,
            userVote: null
          } as Message
          
          return [...prevMessages, newMessage]
        })
      }
      
      // Set flag to scroll to bottom after new message is added
      setShouldScrollToBottom(true)
    } catch (error) {
      console.error('Error in submission:', error)
      alert('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const handleVote = async (messageId: string, voteType: number) => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError) throw userError
      if (!user) throw new Error('You must be logged in to vote')

      console.log(`Attempting to vote on message: ${messageId} with vote type: ${voteType}`)

      // Update UI optimistically first
      setMessages((prev) => {
        const updateVote = (messages: Message[]) => {
          for (let i = 0; i < messages.length; i++) {
            if (messages[i].id === messageId) {
              const currentVote = messages[i].userVote || null;
              let newVoteCount = messages[i].vote_count || 0;
              
              if (currentVote === voteType) {
                // Removing vote
                newVoteCount -= voteType;
                messages[i] = { 
                  ...messages[i], 
                  userVote: null,
                  vote_count: newVoteCount
                };
              } else if (currentVote === null) {
                // New vote
                newVoteCount += voteType;
                messages[i] = { 
                  ...messages[i], 
                  userVote: voteType,
                  vote_count: newVoteCount
                };
              } else {
                // Changing vote
                newVoteCount = newVoteCount - currentVote + voteType;
                messages[i] = { 
                  ...messages[i], 
                  userVote: voteType,
                  vote_count: newVoteCount
                };
              }
              return true;
            }
            if (messages[i].replies.length > 0) {
              if (updateVote(messages[i].replies)) {
                return true;
              }
            }
          }
          return false;
        }
        
        const updatedMessages = [...prev]
        updateVote(updatedMessages)
        return updatedMessages
      })

      // Store the current vote state for rollback if needed
      let originalMessages: Message[] = [];
      setMessages(prev => {
        originalMessages = JSON.parse(JSON.stringify(prev));
        return prev;
      });

      // Try to check if the message exists
      try {
        const { data: messageExists, error: messageCheckError } = await supabase
          .from('messages')
          .select('id')
          .eq('id', messageId)
          .single()
        
        if (messageCheckError) {
          console.error(`Error checking if message ${messageId} exists:`, messageCheckError)
          if (messageCheckError.code === 'PGRST116') {
            throw new Error(`Message ${messageId} does not exist in the database`)
          }
        }

        if (!messageExists) {
          throw new Error(`Message ${messageId} not found in the database`)
        }
      } catch (err) {
        console.error('Error checking message existence:', err)
        // Continue anyway - we'll handle database errors below
      }

      // Try to get existing vote
      let existingVote = null;
      try {
        const { data: voteData, error: voteCheckError } = await supabase
          .from('message_votes')
          .select('*')
          .eq('message_id', messageId)
          .eq('user_id', user.id)
          .maybeSingle()
        
        if (voteCheckError && !voteCheckError.message?.includes('Not Acceptable')) {
          console.error('Error checking existing vote:', voteCheckError)
        } else if (voteData) {
          existingVote = voteData;
          console.log(`Existing vote found:`, existingVote)
        }
      } catch (err) {
        console.error('Error checking existing vote:', err)
        // Continue with optimistic UI update
      }

      // Try to update the database based on the vote action
      try {
        if (existingVote) {
          if (existingVote.vote_type === voteType) {
            // User is clicking the same vote button again, remove their vote
            console.log(`Removing vote (ID: ${existingVote.id})`)
            const { error: deleteError } = await supabase
              .from('message_votes')
              .delete()
              .eq('id', existingVote.id)
              
            if (deleteError) {
              console.error('Error deleting vote:', deleteError)
              throw deleteError
            }
          } else {
            // User is changing their vote
            console.log(`Changing vote from ${existingVote.vote_type} to ${voteType}`)
            const { error: updateError } = await supabase
              .from('message_votes')
              .update({ vote_type: voteType })
              .eq('id', existingVote.id)
              
            if (updateError) {
              console.error('Error updating vote:', updateError)
              throw updateError
            }
          }
        } else {
          // User is voting for the first time
          console.log(`Creating new vote for message ${messageId} with vote type ${voteType}`)
          const { error: insertError } = await supabase
            .from('message_votes')
            .insert({
              message_id: messageId,
              user_id: user.id,
              vote_type: voteType
            })
            
          if (insertError) {
            console.error('Error inserting vote:', insertError)
            
            // If we get a 409 Conflict or foreign key violation, the message might not exist
            if (insertError.code === '23503' || insertError.code === '409') {
              console.error(`Foreign key violation: Message ${messageId} might not exist in the database`)
              throw new Error(`Cannot vote on this message. It may have been deleted.`)
            }
            
            // For 406 Not Acceptable, the table might not be set up correctly
            if (insertError.code === '406' || insertError.message?.includes('Not Acceptable')) {
              console.error('The message_votes table might not be set up correctly')
              throw new Error('Voting functionality is not fully set up. Please contact the administrator.')
            }
            
            throw insertError
          }
        }
      } catch (err) {
        console.error('Database operation failed:', err)
        
        // Rollback the optimistic UI update
        setMessages(originalMessages)
        
        // Show error to user
        setError(err instanceof Error ? err.message : 'Failed to vote on message')
      }
    } catch (err) {
      console.error('Error in handleVote:', err)
      setError(err instanceof Error ? err.message : 'Failed to vote on message')
    }
  }

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + F to focus search
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault()
        searchInputRef.current?.focus()
      }
      
      // Escape to clear search
      if (e.key === 'Escape' && isSearching) {
        e.preventDefault()
        setSearchQuery('')
        searchInputRef.current?.blur()
      }
      
      // Enter to select first result
      if (e.key === 'Enter' && isSearching && searchResults.length > 0 && document.activeElement === searchInputRef.current) {
        e.preventDefault()
        const firstResult = searchResults[0]
        const messageElement = document.getElementById(`message-${firstResult.id}`)
        if (messageElement) {
          messageElement.scrollIntoView({ behavior: 'smooth' })
          messageElement.classList.add('bg-blue-100')
          setTimeout(() => {
            messageElement.classList.remove('bg-blue-100')
          }, 2000)
        }
      }
      
      // Arrow keys to navigate results
      if (isSearching && searchResults.length > 0) {
        const resultElements = document.querySelectorAll('.search-result-item')
        const currentIndex = Array.from(resultElements).findIndex(el => el.classList.contains('bg-blue-50'))
        
        if (e.key === 'ArrowDown' && document.activeElement === searchInputRef.current) {
          e.preventDefault()
          const nextIndex = currentIndex < 0 ? 0 : (currentIndex + 1) % resultElements.length
          resultElements.forEach(el => el.classList.remove('bg-blue-50'))
          resultElements[nextIndex]?.classList.add('bg-blue-50')
          resultElements[nextIndex]?.scrollIntoView({ block: 'nearest' })
        }
        
        if (e.key === 'ArrowUp' && document.activeElement === searchInputRef.current) {
          e.preventDefault()
          const prevIndex = currentIndex < 0 ? resultElements.length - 1 : (currentIndex - 1 + resultElements.length) % resultElements.length
          resultElements.forEach(el => el.classList.remove('bg-blue-50'))
          resultElements[prevIndex]?.classList.add('bg-blue-50')
          resultElements[prevIndex]?.scrollIntoView({ block: 'nearest' })
        }
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isSearching, searchResults])

  // Enhanced search functionality with filters
  useEffect(() => {
    if (searchQuery.trim() === '' && !Object.values(searchFilters).some(value => 
      typeof value === 'boolean' ? value : value !== '')) {
      setIsSearching(false)
      setSearchResults([])
      return
    }

    setIsSearching(true)
    const query = searchQuery.toLowerCase()
    
    // Flatten all messages for searching
    const flattenMessages = (msgs: Message[]): Message[] => {
      let result: Message[] = []
      
      for (const msg of msgs) {
        result.push(msg)
        if (msg.replies && msg.replies.length > 0) {
          result = result.concat(flattenMessages(msg.replies))
        }
      }
      
      return result
    }
    
    // Get all messages in a flat array
    const allMessages = flattenMessages(messages)
    
    // Apply filters
    let results = allMessages.filter(msg => {
      // Text search
      const contentMatch = msg.content.toLowerCase().includes(query)
      const authorMatch = msg.profiles?.full_name?.toLowerCase().includes(query) || false
      const textMatch = contentMatch || authorMatch
      
      if (searchQuery.trim() !== '' && !textMatch) {
        return false
      }
      
      // Filter by message type (top-level or replies)
      if (searchFilters.onlyTopLevel && msg.parent_id !== null) {
        return false
      }
      
      if (searchFilters.onlyReplies && msg.parent_id === null) {
        return false
      }
      
      // Filter by date range
      if (searchFilters.fromDate && new Date(msg.created_at) < new Date(searchFilters.fromDate)) {
        return false
      }
      
      if (searchFilters.toDate) {
        // Add one day to include the end date fully
        const toDate = new Date(searchFilters.toDate)
        toDate.setDate(toDate.getDate() + 1)
        if (new Date(msg.created_at) > toDate) {
          return false
        }
      }
      
      // Filter by minimum votes
      if (searchFilters.minVotes && msg.vote_count < parseInt(searchFilters.minVotes)) {
        return false
      }
      
      // Filter by author name
      if (searchFilters.authorName && 
          (!msg.profiles?.full_name || 
           !msg.profiles.full_name.toLowerCase().includes(searchFilters.authorName.toLowerCase()))) {
        return false
      }
      
      return true
    })
    
    console.log(`Search found ${results.length} matching messages`)
    setSearchResults(results)
  }, [searchQuery, messages, searchFilters])

  // Reset filters
  const resetFilters = () => {
    setSearchFilters({
      onlyTopLevel: false,
      onlyReplies: false,
      fromDate: '',
      toDate: '',
      minVotes: '',
      authorName: ''
    })
  }

  // Helper function to extract image URL from message content
  const extractImageUrl = (content: string): { text: string, imageUrl: string | null } => {
    // Check if content contains an image URL in markdown format
    const markdownImageRegex = /!\[.*?\]\((.*?)\)/;
    const markdownMatch = content.match(markdownImageRegex);
    
    if (markdownMatch && markdownMatch[1]) {
      // Return the text with image markdown removed and the image URL
      return {
        text: content.replace(markdownImageRegex, '').trim(),
        imageUrl: markdownMatch[1]
      };
    }
    
    // Check if content contains an image URL in [Image: url] format
    const shortcodeImageRegex = /\[Image:\s*(https?:\/\/[^\]]+)\]/i;
    const shortcodeMatch = content.match(shortcodeImageRegex);
    
    if (shortcodeMatch && shortcodeMatch[1]) {
      // Return the text with image shortcode removed and the image URL
      return {
        text: content.replace(shortcodeImageRegex, '').trim(),
        imageUrl: shortcodeMatch[1]
      };
    }
    
    // Return original content if no image found
    return {
      text: content,
      imageUrl: null
    };
  };

  // Helper function to highlight search terms in text
  const highlightSearchTerm = (text: string, searchTerm: string): string => {
    if (!searchTerm.trim()) return text;
    
    const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return text.replace(regex, '<mark class="bg-yellow-200 rounded px-1">$1</mark>');
  };

  // Recursive component for rendering messages and their replies
  const MessageItem = ({ message, depth = 0 }: { message: Message, depth?: number }) => {
    const [showReplies, setShowReplies] = useState(true)
    const [isReplying, setIsReplying] = useState(false)
    const messageRef = useRef<HTMLDivElement>(null)
    const isCurrentUserMessage = user && message.user_id === user.id
    
    // Get image URL either from the image_url field or embedded in content
    const { text: messageText, imageUrl: embeddedImageUrl } = extractImageUrl(message.content);
    const displayImageUrl = message.image_url || embeddedImageUrl;
    
    useEffect(() => {
      if (messageRef.current && searchResults.some(result => result.id === message.id)) {
        messageRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
        messageRef.current.classList.add('highlight-message')
        setTimeout(() => {
          messageRef.current?.classList.remove('highlight-message')
        }, 2000)
      }
    }, [searchResults])

  return (
      <div 
        id={`message-${message.id}`}
        ref={messageRef}
        className={`message ${depth > 0 ? 'pl-4 border-l border-gray-200' : ''} ${
          searchResults.some(result => result.id === message.id) ? 'bg-yellow-50' : ''
        }`}
      >
        <div className="flex items-start gap-2 mb-1">
            <div className="flex-shrink-0">
            {message.profiles?.avatar_url ? (
                <img
                  src={message.profiles.avatar_url}
                  alt={message.profiles.full_name || 'User'}
                className="w-8 h-8 rounded-full"
                />
              ) : (
              <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                <span className="text-gray-600 text-sm">
                  {message.profiles?.full_name?.[0] || 'U'}
                  </span>
                </div>
              )}
            </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-2">
              <span className="font-medium text-gray-900">
                {message.profiles?.full_name || 'Anonymous User'}
              </span>
              <span className="text-xs text-gray-500">
                {formatDate(message.created_at)}
              </span>
              </div>
            <div className="mt-1 text-gray-800 whitespace-pre-wrap break-words">
              {searchQuery ? (
                <div dangerouslySetInnerHTML={{ __html: highlightSearchTerm(messageText, searchQuery) }} />
              ) : (
                messageText
              )}
            </div>
            
            {/* Display image if available */}
            {displayImageUrl && (
              <div className="mt-2 max-w-sm">
                <img 
                  src={displayImageUrl} 
                  alt="Attached image" 
                  className="rounded-lg border border-gray-200 max-h-64 w-full object-contain"
                  onClick={() => window.open(displayImageUrl, '_blank')}
                  style={{ cursor: 'pointer' }}
                />
          </div>
            )}
            
            <div className="flex items-center gap-4 mt-2">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleVote(message.id, 1)}
                  className={`p-1 rounded hover:bg-gray-100 ${
                    message.userVote === 1 ? 'text-green-600' : 'text-gray-500'
                  }`}
                  aria-label="Upvote"
                >
                  <ChevronUpIcon className="w-4 h-4" />
                </button>
                <span className="text-sm font-medium text-gray-700 min-w-[20px] text-center">
                  {message.vote_count}
                </span>
                <button
                  onClick={() => handleVote(message.id, -1)}
                  className={`p-1 rounded hover:bg-gray-100 ${
                    message.userVote === -1 ? 'text-red-600' : 'text-gray-500'
                  }`}
                  aria-label="Downvote"
                >
                  <ChevronDownIcon className="w-4 h-4" />
                </button>
              </div>
              <button
                onClick={() => {
                  setIsReplying(!isReplying)
                  if (!isReplying) {
                    setReplyTo(message)
                  } else {
                    setReplyTo(null)
                  }
                }}
                className={`flex items-center gap-1 text-sm ${
                  isReplying
                    ? 'text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <ReplyIcon className="w-4 h-4" />
                <span>{isReplying ? 'Cancel' : 'Reply'}</span>
              </button>
              <DeleteButton messageId={message.id} userId={message.user_id} />
            </div>
          </div>
        </div>
        
        {message.replies && message.replies.length > 0 && (
          <div className="mt-2">
            <button
              onClick={() => setShowReplies(!showReplies)}
              className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-2"
            >
              <span>{showReplies ? 'Hide' : 'Show'} {message.replies.length} {message.replies.length === 1 ? 'reply' : 'replies'}</span>
            </button>
            {showReplies && (
              <div className="space-y-4 mt-2">
                {message.replies.map(reply => (
                  <MessageItem key={reply.id} message={reply} depth={depth + 1} />
                ))}
      </div>
            )}
          </div>
        )}
      </div>
    )
  }

  // Component to handle delete button visibility
  const DeleteButton = ({ messageId, userId }: { messageId: string, userId: string }) => {
    const [isDeleting, setIsDeleting] = useState(false)
    
    // Only show delete button if the message belongs to the current user or if the user is an admin
    if (!user || (user.id !== userId && !user.app_metadata?.isAdmin)) {
      return null
    }
    
    const handleDelete = async () => {
      if (!confirm('Are you sure you want to delete this message?')) {
        return
      }
      
      setIsDeleting(true)
      try {
        const { error } = await supabase
          .from('messages')
          .delete()
          .eq('id', messageId)
        
        if (error) {
          console.error('Error deleting message:', error)
          alert('Failed to delete message')
        } else {
          // Remove the message from the local state
          setMessages(prevMessages => 
            prevMessages.filter(msg => msg.id !== messageId)
          );
        }
      } catch (error) {
        console.error('Error in delete operation:', error)
        alert('An unexpected error occurred')
      } finally {
        setIsDeleting(false)
      }
    }
    
    return (
      <button
        onClick={handleDelete}
        disabled={isDeleting}
        className="flex items-center gap-1 text-sm text-gray-500 hover:text-red-600"
        aria-label="Delete message"
      >
        <TrashIcon className="w-4 h-4" />
        <span>{isDeleting ? 'Deleting...' : 'Delete'}</span>
      </button>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Error alert */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4" role="alert">
          <p>{error}</p>
            </div>
      )}
      
      {/* Notice about voting functionality */}
      {votingEnabled === false && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded mb-4" role="alert">
          <p className="font-medium">Voting functionality is not fully set up</p>
          <p>Please contact the administrator to enable the message_votes table.</p>
            </div>
      )}
      
      {/* Search and sort UI */}
      <div className="mb-4 space-y-2">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-500" />
          </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search messages..."
              className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  setSearchQuery('')
                  setSearchResults([])
                }
              }}
              ref={searchInputRef}
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('')
                  setSearchResults([])
                }}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            )}
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`p-2 rounded-md ${showFilters ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'} hover:bg-blue-100 hover:text-blue-700`}
            title="Toggle search filters"
          >
            <FunnelIcon className="h-5 w-5" />
          </button>
        </div>
        
        {/* Search filters */}
        {showFilters && (
          <div className="bg-gray-50 border border-gray-200 rounded-md p-3 space-y-3">
            <div className="flex flex-wrap gap-3">
              <label className="flex items-center gap-1 text-gray-700">
                <input
                  type="checkbox"
                  checked={searchFilters.onlyTopLevel}
                  onChange={(e) => setSearchFilters({...searchFilters, onlyTopLevel: e.target.checked, onlyReplies: false})}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <span>Only top-level messages</span>
          </label>
              <label className="flex items-center gap-1 text-gray-700">
                <input
                  type="checkbox"
                  checked={searchFilters.onlyReplies}
                  onChange={(e) => setSearchFilters({...searchFilters, onlyReplies: e.target.checked, onlyTopLevel: false})}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <span>Only replies</span>
              </label>
            </div>
            
            <div className="flex flex-wrap gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">From date</label>
                <input
                  type="date"
                  value={searchFilters.fromDate}
                  onChange={(e) => setSearchFilters({...searchFilters, fromDate: e.target.value})}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">To date</label>
                <input
                  type="date"
                  value={searchFilters.toDate}
                  onChange={(e) => setSearchFilters({...searchFilters, toDate: e.target.value})}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Min votes</label>
                <input
                  type="number"
                  value={searchFilters.minVotes}
                  onChange={(e) => setSearchFilters({...searchFilters, minVotes: e.target.value})}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  min="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Author name</label>
          <input
            type="text"
                  value={searchFilters.authorName}
                  onChange={(e) => setSearchFilters({...searchFilters, authorName: e.target.value})}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  placeholder="Filter by author"
                />
              </div>
            </div>
            
            <div className="flex justify-end">
              <button
                onClick={resetFilters}
                className="px-3 py-1 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
              >
                Reset filters
              </button>
            </div>
          </div>
        )}
        
        {/* Sort buttons */}
        <div className="flex gap-2">
          <div
            onClick={() => handleSortChange('best')}
            className={`px-3 py-1 rounded-md cursor-pointer ${
              sortOrder === 'best' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Best
          </div>
          <div
            onClick={() => handleSortChange('top')}
            className={`px-3 py-1 rounded-md cursor-pointer ${
              sortOrder === 'top' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Top
          </div>
          <div
            onClick={() => handleSortChange('new')}
            className={`px-3 py-1 rounded-md cursor-pointer ${
              sortOrder === 'new' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            New
          </div>
          <div
            onClick={() => handleSortChange('old')}
            className={`px-3 py-1 rounded-md cursor-pointer ${
              sortOrder === 'old' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Old
          </div>
        </div>
      </div>
      
      {/* Search results */}
      {searchResults.length > 0 && (
        <div className="mb-4 bg-white border border-gray-200 rounded-md p-3">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-medium text-gray-900">
              {searchResults.length} {searchResults.length === 1 ? 'result' : 'results'} found
            </h3>
            <button
              onClick={() => setSearchResults([])}
              className="text-gray-500 hover:text-gray-700"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {searchResults.map(result => (
              <button
                key={result.id}
                className="w-full text-left p-2 hover:bg-gray-50 rounded-md flex items-start gap-2"
                onClick={() => {
                  const element = document.getElementById(`message-${result.id}`)
                  if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'center' })
                    element.classList.add('highlight-message')
                    setTimeout(() => {
                      element.classList.remove('highlight-message')
                    }, 2000)
                  }
                }}
              >
                <div className="flex-shrink-0 mt-1">
                  {result.parent_id && (
                    <span className="text-gray-400 text-xs">↪</span>
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900">
                      {result.profiles?.full_name || 'Anonymous User'}
                    </span>
                    <span className="text-xs text-gray-500">
                      {formatDate(result.created_at)}
                    </span>
                    {result.vote_count !== 0 && (
                      <span className={`text-xs ${result.vote_count > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {result.vote_count > 0 ? '+' : ''}{result.vote_count}
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-gray-700 line-clamp-2">
                    <div dangerouslySetInnerHTML={{ __html: highlightSearchTerm(extractImageUrl(result.content).text, searchQuery) }} />
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
      
      {/* Reply indicator */}
      {replyTo && (
        <div className="mb-4 bg-blue-50 border border-blue-200 rounded-md p-3 flex justify-between items-start">
          <div>
            <div className="text-sm text-blue-700 font-medium mb-1">
              Replying to {replyTo.profiles?.full_name || 'Anonymous User'}
            </div>
            <div className="text-sm text-gray-700 line-clamp-1">
              {extractImageUrl(replyTo.content).text}
            </div>
          </div>
          <button
            onClick={() => setReplyTo(null)}
            className="text-gray-500 hover:text-gray-700"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
      )}
      
      {/* Message input */}
      <form onSubmit={handleSubmit} className="mt-auto">
        <div className="border border-gray-300 rounded-md overflow-hidden">
          <textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
            className="w-full p-3 focus:outline-none text-gray-900 resize-none"
            rows={3}
          />
          
          {/* Image preview */}
          {imagePreviewUrl && (
            <div className="p-3 border-t border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Image preview</span>
                <button
                  type="button"
                  onClick={clearSelectedImage}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
        </div>
              <div className="relative">
                <img
                  src={imagePreviewUrl}
                  alt="Preview"
                  className="max-h-40 w-full rounded-md object-contain"
                />
              </div>
            </div>
          )}
          
          <div className="flex justify-between items-center p-2 bg-gray-50 border-t border-gray-200">
            <div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-2 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                title="Attach image"
              >
                <PhotoIcon className="h-5 w-5" />
              </button>
              
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageChange}
                accept="image/*"
                className="hidden"
              />
            </div>
            
        <button
          type="submit"
              disabled={isLoading || (!newMessage.trim() && !selectedImage)}
              className={`px-4 py-2 rounded-md flex items-center gap-1 ${
                isLoading || (!newMessage.trim() && !selectedImage)
                  ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
        >
          {isLoading ? 'Sending...' : 'Send'}
              <PaperAirplaneIcon className="h-4 w-4" />
        </button>
          </div>
        </div>
      </form>
      
      {/* Messages list */}
      <div className="flex-1 overflow-y-auto my-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No messages yet. Be the first to post!
          </div>
        ) : (
          organizeMessages(messages).map(message => (
            <MessageItem key={message.id} message={message} />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
    </div>
  )
} 