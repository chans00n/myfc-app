'use client'

import { UserSearch } from '@/components/social/UserSearch'
import { AuthProvider } from '@/hooks/useAuth'
import { ToastProvider } from '@/components/ui/toast'

export default function SearchPage() {
  return (
    <AuthProvider>
      <ToastProvider>
        <div className="container mx-auto py-8">
          <h1 className="text-2xl font-bold mb-6">Find Friends</h1>
          <p className="text-gray-600 mb-8">
            Search for other users to follow and connect with. Share your fitness journey together!
          </p>
          
          <UserSearch />
        </div>
      </ToastProvider>
    </AuthProvider>
  )
} 