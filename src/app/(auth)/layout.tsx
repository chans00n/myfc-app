import { createServerSupabaseClient } from '@/lib/auth'

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = createServerSupabaseClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (session) {
    return null // Let the middleware handle the redirect
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {children}
    </div>
  )
} 