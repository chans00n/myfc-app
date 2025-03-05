import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { Database } from '@/types/database'

export const createServerSupabaseClient = () =>
  createServerComponentClient<Database>({
    cookies,
  })

export const getCurrentUser = async () => {
  const supabase = createServerSupabaseClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .single()

  return {
    ...session.user,
    ...profile,
  }
}

export const requireAuth = async () => {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error('Authentication required')
  }
  return user
}

export const requireSubscription = async () => {
  const user = await requireAuth()
  if (!user.subscription_status || user.subscription_status !== 'active') {
    throw new Error('Active subscription required')
  }
  return user
} 