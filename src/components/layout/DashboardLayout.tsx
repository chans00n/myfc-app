'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { NotificationCenter } from '@/components/notifications/NotificationCenter'
import { ToastProvider } from '@/components/ui/toast'

type DashboardLayoutProps = {
  children: React.ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const pathname = usePathname()
  const supabase = createClientComponentClient()

  const navigation = [
    { name: 'Dashboard', href: '/dashboard' },
    { name: 'Workouts', href: '/workouts' },
    { name: 'Progress', href: '/progress' },
    { name: 'Movement Library', href: '/movement-library' },
    { name: 'Social', href: '/social' },
    { name: 'Find Friends', href: '/search' },
    { name: 'Settings', href: '/settings' },
  ]

  const handleSignOut = async () => {
    try {
      // Use the server-side sign-out route
      const response = await fetch(`${window.location.origin}/auth/sign-out`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      if (response.ok) {
        // The server will handle the redirect
        window.location.href = '/login'
      } else {
        console.error('Sign out failed:', await response.text())
        // Fallback to client-side signOut
        await supabase.auth.signOut()
        window.location.href = '/login'
      }
    } catch (error) {
      console.error('Sign out error:', error)
      // Fallback to client-side signOut
      await supabase.auth.signOut()
      window.location.href = '/login'
    }
  }

  return (
    <ToastProvider>
      <div className="min-h-screen bg-gray-100">
        {/* Sidebar for mobile */}
        <div className={`fixed inset-0 z-40 lg:hidden ${isSidebarOpen ? '' : 'hidden'}`}>
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setIsSidebarOpen(false)} />
          <div className="fixed inset-y-0 left-0 flex w-64 flex-col bg-white">
            <div className="flex h-16 flex-shrink-0 items-center justify-between border-b border-gray-200 px-4">
              <Link href="/dashboard" className="text-xl font-bold text-blue-600">
                My Face Coach
              </Link>
              <button
                type="button"
                className="rounded-md p-2 text-gray-400 hover:text-gray-500 hover:bg-gray-100"
                onClick={() => setIsSidebarOpen(false)}
              >
                <span className="sr-only">Close sidebar</span>
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <nav className="flex-1 space-y-1 px-2 py-4">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`group flex items-center rounded-md px-2 py-2 text-sm font-medium ${
                    pathname === item.href
                      ? 'bg-gray-100 text-gray-900'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                  onClick={() => setIsSidebarOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
            </nav>
            <div className="border-t border-gray-200 p-4">
              <button
                onClick={handleSignOut}
                className="w-full rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>

        {/* Static sidebar for desktop */}
        <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
          <div className="flex min-h-0 flex-1 flex-col border-r border-gray-200 bg-white">
            <div className="flex flex-shrink-0 items-center px-4 py-4">
              <Link href="/dashboard" className="text-xl font-bold text-blue-600">
                My Face Coach
              </Link>
            </div>
            <nav className="mt-5 flex-1 space-y-1 bg-white px-2">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`group flex items-center rounded-md px-2 py-2 text-sm font-medium ${
                    pathname === item.href
                      ? 'bg-gray-100 text-gray-900'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  {item.name}
                </Link>
              ))}
            </nav>
            <div className="flex flex-shrink-0 border-t border-gray-200 p-4">
              <button
                onClick={handleSignOut}
                className="w-full rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="flex flex-1 flex-col lg:pl-64">
          <div className="sticky top-0 z-10 bg-white shadow-sm">
            <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
              <div className="lg:hidden">
                <button
                  type="button"
                  className="-ml-0.5 -mt-0.5 inline-flex h-12 w-12 items-center justify-center rounded-md text-gray-500 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
                  onClick={() => setIsSidebarOpen(true)}
                >
                  <span className="sr-only">Open sidebar</span>
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
              </div>
              <div className="flex items-center">
                <NotificationCenter />
              </div>
            </div>
          </div>

          <main className="flex-1">
            {children}
          </main>
        </div>
      </div>
    </ToastProvider>
  )
} 