'use client'

import { useState, useRef, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { UserCircleIcon } from '@heroicons/react/24/solid'

type AvatarUploadProps = {
  currentAvatarUrl: string | null
  onAvatarUpdate: (url: string) => void
}

export default function AvatarUpload({ currentAvatarUrl, onAvatarUpdate }: AvatarUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(currentAvatarUrl)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClientComponentClient()

  useEffect(() => {
    setAvatarUrl(currentAvatarUrl)
  }, [currentAvatarUrl])

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size must be less than 5MB')
      return
    }

    setIsUploading(true)
    setError(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Upload the file to Supabase Storage using the existing 'chat-images' bucket
      const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg'
      // Force jpg, png, or webp extension for better compatibility
      const safeExt = ['jpg', 'jpeg', 'png', 'webp'].includes(fileExt) ? fileExt : 'jpg'
      const fileName = `avatars/${user.id}-${Date.now()}.${safeExt}`
      
      const { error: uploadError } = await supabase.storage
        .from('chat-images')
        .upload(fileName, file, { upsert: true })

      if (uploadError) {
        console.error('Upload error:', uploadError)
        throw new Error('Failed to upload image. Please try again later.')
      }
        
      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('chat-images')
        .getPublicUrl(fileName)
          
      // Update the profile with the new avatar URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id)

      if (updateError) {
        console.error('Profile update error:', updateError)
        throw new Error('Failed to update profile')
      }

      setAvatarUrl(publicUrl)
      onAvatarUpdate(publicUrl)
    } catch (err) {
      console.error('Avatar upload error:', err)
      setError(err instanceof Error ? err.message : 'Failed to upload avatar')
    } finally {
      setIsUploading(false)
      // Clear the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  return (
    <div className="flex items-center">
      {avatarUrl ? (
        <div className="h-12 w-12 rounded-full overflow-hidden">
          <img
            src={avatarUrl}
            alt="User avatar"
            className="h-full w-full object-cover"
            onError={() => setAvatarUrl(null)}
          />
        </div>
      ) : (
        <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center">
          <UserCircleIcon className="h-8 w-8 text-gray-400" />
        </div>
      )}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
      />
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={isUploading}
        className="ml-4 inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isUploading ? 'Uploading...' : 'Change'}
      </button>
      {error && (
        <p className="ml-4 text-sm text-red-600">{error}</p>
      )}
    </div>
  )
}