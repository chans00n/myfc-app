'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import SessionManager from '@/components/auth/SessionManager'

type AuthContextType = {
  user: any
  loading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signOut: async () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClientComponentClient()

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session?.user) {
        // Get user profile data
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()
        
        if (!error && data) {
          setUser({
            ...session.user,
            ...data
          })
        } else {
          console.error('Error fetching user profile:', error)
          setUser(session.user)
        }
      } else {
        setUser(null)
      }
      
      setLoading(false)
    }

    fetchUser()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        // Get user profile data
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()
        
        if (!error && data) {
          setUser({
            ...session.user,
            ...data
          })
        } else {
          console.error('Error fetching user profile:', error)
          setUser(session.user)
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null)
      }
      
      setLoading(false)
      router.refresh()
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase, router])

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
        router.push('/login')
      }
    } catch (error) {
      console.error('Sign out error:', error)
      // Fallback to client-side signOut
      await supabase.auth.signOut()
      setUser(null)
      router.push('/login')
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, signOut }}>
      <SessionManager />
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  return useContext(AuthContext)
} 