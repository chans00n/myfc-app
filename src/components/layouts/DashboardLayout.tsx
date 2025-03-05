'use client'

import { ReactNode, useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import {
  HomeIcon,
  VideoCameraIcon,
  BookOpenIcon,
  ChatBubbleLeftRightIcon,
  UserCircleIcon,
  Bars3Icon,
  XMarkIcon,
  ChevronUpIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  SwatchIcon,
  MoonIcon,
  SunIcon,
  ComputerDesktopIcon,
} from '@heroicons/react/24/solid'
import { cn } from '@/lib/utils'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useTheme } from '@/contexts/ThemeContext'
import Image from 'next/image'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
  { name: 'Daily Workout', href: '/workouts', icon: VideoCameraIcon },
  { name: 'Movement Library', href: '/movement-library', icon: BookOpenIcon },
  { name: 'Community', href: '/community', icon: ChatBubbleLeftRightIcon },
  { name: 'Design System', href: '/design', icon: SwatchIcon },
  { name: 'Settings', href: '/settings', icon: Cog6ToothIcon },
]

interface DashboardLayoutProps {
  children: ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)
  const [themeMenuOpen, setThemeMenuOpen] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClientComponentClient()
  const profileMenuRef = useRef<HTMLDivElement>(null)
  const themeMenuRef = useRef<HTMLDivElement>(null)
  const mobileMenuRef = useRef<HTMLDivElement>(null)
  const { theme, isDarkMode, setTheme } = useTheme()

  // Preserve theme parameter when navigating
  const getHrefWithTheme = (href: string) => {
    return `${href}?theme=${theme}`
  }

  // Handle theme from URL parameter
  useEffect(() => {
    const themeParam = searchParams.get('theme')
    if (themeParam && (themeParam === 'light' || themeParam === 'dark' || themeParam === 'system')) {
      setTheme(themeParam)
    }
  }, [searchParams, setTheme])

  // Get user data
  useEffect(() => {
    const getUser = async () => {
      setIsLoading(true)
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        
        if (userError) {
          console.error('Error fetching user:', userError)
          setUser(null)
          // Redirect to login if not authenticated
          window.location.href = `${window.location.origin}/login`
          return
        }
        
        if (user) {
          try {
            // Log the user object to debug
            console.log('Auth user:', user)
            
            const { data: profile, error: profileError } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', user.id)
              .single()
            
            if (profileError) {
              console.error('Error fetching profile:', profileError)
              // Use user metadata if profile fetch fails
              setUser({
                ...user,
                full_name: user.user_metadata?.full_name || 'User',
                avatar_url: user.user_metadata?.avatar_url || null
              })
            } else {
              // Log the profile to debug
              console.log('User profile:', profile)
              
              setUser({
                ...user,
                ...profile,
                // Ensure avatar_url is properly set from the profile
                full_name: profile.display_name || user.user_metadata?.full_name || 'User',
                avatar_url: profile.avatar_url || user.user_metadata?.avatar_url || null
              })
            }
          } catch (err) {
            console.error('Error in profile fetch:', err)
            setUser(user)
          }
        } else {
          // Redirect to login if not authenticated
          window.location.href = `${window.location.origin}/login`
        }
      } catch (err) {
        console.error('Error in auth flow:', err)
        setUser(null)
        // Redirect to login if not authenticated
        window.location.href = `${window.location.origin}/login`
      } finally {
        setIsLoading(false)
      }
    }
    
    getUser()
    
    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          try {
            const { data: profile, error: profileError } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .single()
            
            if (profileError) {
              console.error('Error fetching profile on auth change:', profileError)
              setUser({
                ...session.user,
                full_name: session.user.user_metadata?.full_name || 'User',
                avatar_url: session.user.user_metadata?.avatar_url || null
              })
            } else {
              setUser({ ...session.user, ...profile })
            }
          } catch (err) {
            console.error('Error in profile fetch on auth change:', err)
            setUser(session.user)
          }
        } else if (event === 'SIGNED_OUT') {
          setUser(null)
          // Redirect to login when signed out
          window.location.href = `${window.location.origin}/login`
        }
      }
    )
    
    return () => {
      subscription.unsubscribe()
    }
  }, [supabase])

  // Close menus when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setProfileMenuOpen(false)
      }
      if (themeMenuRef.current && !themeMenuRef.current.contains(event.target as Node)) {
        setThemeMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [profileMenuRef, themeMenuRef])

  const handleSignOut = async () => {
    try {
      // Clear local user state first
      setUser(null)
      
      // Sign out from Supabase
      const { error } = await supabase.auth.signOut()
      
      if (error) {
        console.error('Sign out error:', error)
      }
      
      // Force redirect to login page
      window.location.href = `${window.location.origin}/login`
    } catch (error) {
      console.error('Sign out error:', error)
      // Still try to redirect even if there's an error
      window.location.href = `${window.location.origin}/login`
    }
  }

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      {/* Mobile menu overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 flex md:hidden">
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-black bg-opacity-80 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Mobile menu */}
          <div className="relative flex w-full max-w-xs flex-1 flex-col bg-white dark:bg-black pt-5 pb-4 shadow-xl">
            <div className="absolute top-0 right-0 -mr-12 pt-2">
              <button
                type="button"
                className="ml-1 flex h-10 w-10 items-center justify-center rounded-full focus:outline-none"
                onClick={() => setMobileMenuOpen(false)}
              >
                <span className="sr-only">Close sidebar</span>
                <XMarkIcon className="h-6 w-6 text-white" aria-hidden="true" />
              </button>
            </div>

            <div className="flex flex-shrink-0 items-center px-6">
              <Link href={getHrefWithTheme('/dashboard')} className="flex items-center text-xl font-bold nike-text-primary">
                {isDarkMode ? (
                  <Image
                    src="/images/logo_white.png"
                    alt="My Face Coach"
                    width={120}
                    height={40}
                    className="w-[120px] h-auto"
                  />
                ) : (
                  <Image
                    src="/images/logo.png"
                    alt="My Face Coach"
                    width={120}
                    height={40}
                    className="w-[120px] h-auto"
                  />
                )}
              </Link>
            </div>

            <div className="mt-5 flex flex-1 flex-col">
              <nav className="flex-1 space-y-1 px-2">
                {navigation.map((item) => {
                  const isActive = pathname === item.href
                  return (
                    <Link
                      key={item.name}
                      href={getHrefWithTheme(item.href)}
                      className={cn(
                        isActive
                          ? 'bg-brand-50 text-brand-600 dark:bg-brand-900 dark:text-brand-300'
                          : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-900 dark:hover:text-gray-100',
                        'group flex items-center px-4 py-3 text-base font-medium rounded-md transition-colors duration-200'
                      )}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <item.icon
                        className={cn(
                          isActive
                            ? 'text-brand-500 dark:text-brand-400'
                            : 'text-gray-400 group-hover:text-gray-500 dark:text-gray-500 dark:group-hover:text-gray-400',
                          'mr-4 h-6 w-6 flex-shrink-0'
                        )}
                        aria-hidden="true"
                      />
                      {item.name}
                    </Link>
                  )
                })}
              </nav>
            </div>

            <div className="mt-10 px-4">
              <div className="border-t border-gray-200 dark:border-gray-800 pt-4">
                <div className="relative">
                  <button
                    type="button"
                    className="flex items-center rounded-full bg-white dark:bg-gray-800 p-1 text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                    onClick={() => setThemeMenuOpen(!themeMenuOpen)}
                  >
                    <span className="sr-only">Open theme menu</span>
                    {theme === 'dark' ? (
                      <MoonIcon className="h-6 w-6 text-gray-400" aria-hidden="true" />
                    ) : theme === 'light' ? (
                      <SunIcon className="h-6 w-6 text-gray-400" aria-hidden="true" />
                    ) : (
                      <ComputerDesktopIcon className="h-6 w-6 text-gray-400" aria-hidden="true" />
                    )}
                  </button>
                  
                  {themeMenuOpen && (
                    <div
                      ref={mobileMenuRef}
                      className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white dark:bg-gray-800 py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none"
                    >
                      <button
                        onClick={() => setTheme('light')}
                        className={`flex w-full items-center px-4 py-2 text-sm ${
                          theme === 'light' 
                            ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white' 
                            : 'text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        <SunIcon className="mr-3 h-5 w-5 text-gray-400" aria-hidden="true" />
                        Light
                      </button>
                      <button
                        onClick={() => setTheme('dark')}
                        className={`flex w-full items-center px-4 py-2 text-sm ${
                          theme === 'dark' 
                            ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white' 
                            : 'text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        <MoonIcon className="mr-3 h-5 w-5 text-gray-400" aria-hidden="true" />
                        Dark
                      </button>
                      <button
                        onClick={() => setTheme('system')}
                        className={`flex w-full items-center px-4 py-2 text-sm ${
                          theme === 'system' 
                            ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white' 
                            : 'text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        <ComputerDesktopIcon className="mr-3 h-5 w-5 text-gray-400" aria-hidden="true" />
                        System
                      </button>
                    </div>
                  )}
                </div>
                
                <button
                  className="flex w-full items-center px-4 py-3 text-base nike-text-primary dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors duration-200 rounded-md mt-4"
                  onClick={handleSignOut}
                >
                  <ArrowRightOnRectangleIcon className="mr-4 h-6 w-6 text-brand-300" />
                  Sign out
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Static sidebar for desktop */}
      <div className="hidden md:fixed md:inset-y-0 md:flex md:w-64 md:flex-col">
        <div className="flex min-h-0 flex-1 flex-col border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-black">
          <div className="flex flex-1 flex-col overflow-y-auto pt-5 pb-4">
            <div className="flex flex-shrink-0 items-center px-4 mb-5">
              <Link href={getHrefWithTheme('/dashboard')} className="flex items-center text-xl font-bold nike-text-primary">
                {isDarkMode ? (
                  <Image
                    src="/images/logo_white.png"
                    alt="My Face Coach"
                    width={120}
                    height={40}
                    className="w-[120px] h-auto"
                  />
                ) : (
                  <Image
                    src="/images/logo.png"
                    alt="My Face Coach"
                    width={120}
                    height={40}
                    className="w-[120px] h-auto"
                  />
                )}
              </Link>
            </div>
            <nav className="mt-5 flex-1 space-y-1 px-2">
              {navigation.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.name}
                    href={getHrefWithTheme(item.href)}
                    className={cn(
                      isActive
                        ? 'bg-brand-50 text-brand-600 dark:bg-brand-900 dark:text-brand-300'
                        : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-900 dark:hover:text-gray-100',
                      'group flex items-center px-4 py-3 text-base font-medium rounded-md transition-colors duration-200'
                    )}
                  >
                    <item.icon
                      className={cn(
                        isActive
                          ? 'text-brand-500 dark:text-brand-400'
                          : 'text-gray-400 group-hover:text-gray-500 dark:text-gray-500 dark:group-hover:text-gray-400',
                        'mr-4 h-6 w-6 flex-shrink-0'
                      )}
                      aria-hidden="true"
                    />
                    {item.name}
                  </Link>
                )
              })}
            </nav>
          </div>
          
          {/* Desktop profile section - visible only on desktop */}
          <div className="hidden md:flex flex-shrink-0 border-t border-gray-200 dark:border-gray-800 p-4">
            <div className="flex items-center">
              <div>
                {user?.avatar_url ? (
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={user.avatar_url} alt={user?.full_name || 'User'} />
                    <AvatarFallback>{user?.full_name?.charAt(0).toUpperCase() || 'U'}</AvatarFallback>
                  </Avatar>
                ) : (
                  <UserCircleIcon className="h-10 w-10 text-gray-400 dark:text-gray-500" />
                )}
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium nike-text-primary dark:text-white">
                  {user?.full_name || 'User'}
                </p>
                <button
                  className="text-xs nike-text-secondary dark:text-gray-400 hover:text-brand-500 dark:hover:text-brand-400"
                  onClick={handleSignOut}
                >
                  Sign out
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-1 flex-col md:pl-64">
        {/* Top navigation */}
        <div className="sticky top-0 z-10 bg-white dark:bg-black shadow-sm dark:shadow-gray-800">
          <div className="flex h-16 items-center justify-between px-4 md:px-6">
            <div className="flex items-center">
              <button
                type="button"
                className="md:hidden -ml-0.5 -mt-0.5 inline-flex h-12 w-12 items-center justify-center rounded-md text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
                onClick={() => setMobileMenuOpen(true)}
              >
                <span className="sr-only">Open sidebar</span>
                <Bars3Icon className="h-6 w-6" aria-hidden="true" />
              </button>
            </div>
            <div className="flex items-center">
              {/* Theme toggle */}
              <div className="relative ml-4">
                <button
                  type="button"
                  className="flex items-center rounded-full bg-white dark:bg-gray-800 p-1 text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                  onClick={() => setThemeMenuOpen(!themeMenuOpen)}
                >
                  <span className="sr-only">Toggle theme</span>
                  {theme === 'dark' ? (
                    <MoonIcon className="h-6 w-6" aria-hidden="true" />
                  ) : theme === 'light' ? (
                    <SunIcon className="h-6 w-6" aria-hidden="true" />
                  ) : (
                    <ComputerDesktopIcon className="h-6 w-6" aria-hidden="true" />
                  )}
                </button>
                
                {themeMenuOpen && (
                  <div
                    ref={themeMenuRef}
                    className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white dark:bg-gray-800 py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none"
                  >
                    <button
                      onClick={() => setTheme('light')}
                      className={`flex w-full items-center px-4 py-2 text-sm ${
                        theme === 'light' 
                          ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white' 
                          : 'text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      <SunIcon className="mr-3 h-5 w-5 text-gray-400" aria-hidden="true" />
                      Light
                    </button>
                    <button
                      onClick={() => setTheme('dark')}
                      className={`flex w-full items-center px-4 py-2 text-sm ${
                        theme === 'dark' 
                          ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white' 
                          : 'text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      <MoonIcon className="mr-3 h-5 w-5 text-gray-400" aria-hidden="true" />
                      Dark
                    </button>
                    <button
                      onClick={() => setTheme('system')}
                      className={`flex w-full items-center px-4 py-2 text-sm ${
                        theme === 'system' 
                          ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white' 
                          : 'text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      <ComputerDesktopIcon className="mr-3 h-5 w-5 text-gray-400" aria-hidden="true" />
                      System
                    </button>
                  </div>
                )}
              </div>
              
              {/* Profile dropdown - visible on both mobile and desktop */}
              <div className="relative ml-4">
                <button
                  type="button"
                  className="flex items-center rounded-full bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                  onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                >
                  <span className="sr-only">Open user menu</span>
                  {user?.avatar_url ? (
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.avatar_url} alt={user?.full_name || 'User'} />
                      <AvatarFallback>{user?.full_name?.charAt(0).toUpperCase() || 'U'}</AvatarFallback>
                    </Avatar>
                  ) : (
                    <UserCircleIcon className="h-8 w-8 text-gray-400 dark:text-gray-500" />
                  )}
                </button>
                
                {profileMenuOpen && (
                  <div
                    ref={profileMenuRef}
                    className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white dark:bg-gray-800 py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none"
                  >
                    <div className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300">
                      <div className="font-medium">{user?.full_name || 'User'}</div>
                      <div className="truncate">{user?.email || 'user@example.com'}</div>
                    </div>
                    <Link
                      href={getHrefWithTheme('/settings')}
                      className="flex items-center px-4 py-2 text-sm nike-text-primary dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors duration-200"
                      role="menuitem"
                    >
                      <Cog6ToothIcon className="mr-3 h-5 w-5 text-brand-300" />
                      Settings
                    </Link>
                    <button
                      className="flex w-full items-center px-4 py-2 text-sm nike-text-primary dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors duration-200"
                      role="menuitem"
                      onClick={handleSignOut}
                    >
                      <ArrowRightOnRectangleIcon className="mr-3 h-5 w-5 text-brand-300" />
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Main content area */}
        <main className="flex-1 p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  )
} 