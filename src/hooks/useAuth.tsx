'use client'

import { useState, useEffect, createContext, useContext } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Database } from '@/types/database'

interface User {
  id: string
  email: string
  username: string
  display_name: string
  avatar_url: string | null
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  signIn: (email: string, password: string) => Promise<{ error: any } | null>
  signUp: (email: string, password: string, username: string, displayName: string) => Promise<{ error: any } | null>
  signOut: () => Promise<void>
  updateProfile: (data: Partial<User>) => Promise<{ error: any } | null>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClientComponentClient<Database>()

  useEffect(() => {
    const fetchUser = async () => {
      setIsLoading(true)
      
      try {
        // Get current session
        const { data: { session } } = await supabase.auth.getSession()
        
        if (session?.user) {
          // Get user profile data
          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single()
          
          if (error) {
            console.error('Error fetching user profile:', error)
            setUser(null)
          } else {
            setUser({
              id: session.user.id,
              email: session.user.email || '',
              username: data.username,
              display_name: data.display_name,
              avatar_url: data.avatar_url
            })
          }
        } else {
          setUser(null)
        }
      } catch (error) {
        console.error('Auth error:', error)
        setUser(null)
      } finally {
        setIsLoading(false)
      }
    }

    fetchUser()

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        // Fetch user profile when auth state changes
        supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()
          .then(({ data, error }) => {
            if (error) {
              console.error('Error fetching user profile:', error)
              setUser(null)
            } else {
              setUser({
                id: session.user.id,
                email: session.user.email || '',
                username: data.username,
                display_name: data.display_name,
                avatar_url: data.avatar_url
              })
            }
            setIsLoading(false)
          })
      } else {
        setUser(null)
        setIsLoading(false)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase])

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      })
      
      if (error) {
        return { error }
      }
      
      return null
    } catch (error) {
      console.error('Sign in error:', error)
      return { error }
    }
  }

  const signUp = async (email: string, password: string, username: string, displayName: string) => {
    try {
      // Check if username is already taken
      const { data: existingUser, error: checkError } = await supabase
        .from('profiles')
        .select('username')
        .eq('username', username)
        .single()
      
      if (existingUser) {
        return { error: { message: 'Username is already taken' } }
      }
      
      // Create auth user
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username,
            display_name: displayName
          }
        }
      })
      
      if (error) {
        return { error }
      }
      
      if (data.user) {
        // Create user profile
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: data.user.id,
            username,
            display_name: displayName,
            email
          })
        
        if (profileError) {
          return { error: profileError }
        }
      }
      
      return null
    } catch (error) {
      console.error('Sign up error:', error)
      return { error }
    }
  }

  const signOut = async () => {
    try {
      // Use the server-side sign-out route
      const response = await fetch('/auth/sign-out', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      if (response.ok) {
        // The server will handle the redirect, but we can also force it here
        window.location.href = '/login'
      } else {
        // Fallback to client-side signOut if server route fails
        await supabase.auth.signOut()
        setUser(null)
      }
    } catch (error) {
      console.error('Sign out error:', error)
      // Fallback to client-side signOut
      await supabase.auth.signOut()
      setUser(null)
    }
  }

  const updateProfile = async (data: Partial<User>) => {
    if (!user) {
      return { error: { message: 'Not authenticated' } }
    }
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          username: data.username,
          display_name: data.display_name,
          avatar_url: data.avatar_url
        })
        .eq('id', user.id)
      
      if (error) {
        return { error }
      }
      
      // Update local user state
      setUser(prev => prev ? { ...prev, ...data } : null)
      
      return null
    } catch (error) {
      console.error('Update profile error:', error)
      return { error }
    }
  }

  const value = {
    user,
    isLoading,
    signIn,
    signUp,
    signOut,
    updateProfile
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
} 