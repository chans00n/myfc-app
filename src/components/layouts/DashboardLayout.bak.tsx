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
} from '@heroicons/react/24/solid'
import { cn } from '@/lib/utils'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useTheme } from '@/contexts/ThemeContext'
import { MoonIcon, SunIcon } from '@heroicons/react/24/solid'
import Image from 'next/image'

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
  const [user, setUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClientComponentClient()
  const profileMenuRef = useRef<HTMLDivElement>(null)
  const mobileProfileMenuRef = useRef<HTMLDivElement>(null)
  const { theme, isDarkMode, setTheme } = useTheme()

  // Preserve theme parameter when navigating
  const getHrefWithTheme = (href: string) => {
    return `${href}?theme=${theme}`
  }

  // Handle theme from URL parameter - this should take priority over everything else
  useEffect(() => {
    const themeParam = searchParams.get('theme')
    
    // Only update if the theme parameter has changed and is not null
    if (themeParam !== null && themeParam !== theme) {
      setTheme(themeParam as 'light' | 'dark' | 'system')
    }
  }, [searchParams, setTheme, theme])

  // Get user data
  useEffect(() => {
    const getUser = async () => {
      setIsLoading(true)
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        
        if (userError) {
          console.error('Error fetching user:', userError)
          // Create a mock user for development
          setUser({
            id: 'mock-user-id',
            email: 'dev@example.com',
            full_name: 'Dev User',
            avatar_url: null
          })
          return
        }
        
        if (user) {
          try {
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
              setUser({ ...user, ...profile })
            }
          } catch (err) {
            console.error('Error in profile fetch:', err)
            setUser(user)
          }
        } else {
          // Create a mock user for development
          setUser({
            id: 'mock-user-id',
            email: 'dev@example.com',
            full_name: 'Dev User',
            avatar_url: null
          })
        }
      } catch (err) {
        console.error('Error in auth flow:', err)
        // Create a mock user for development
        setUser({
          id: 'mock-user-id',
          email: 'dev@example.com',
          full_name: 'Dev User',
          avatar_url: null
        })
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
          // Create a mock user for development
          setUser({
            id: 'mock-user-id',
            email: 'dev@example.com',
            full_name: 'Dev User',
            avatar_url: null
          })
        }
      }
    )
    
    return () => {
      subscription.unsubscribe()
    }
  }, [supabase])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        profileMenuRef.current && 
        !profileMenuRef.current.contains(event.target as Node) &&
        mobileProfileMenuRef.current && 
        !mobileProfileMenuRef.current.contains(event.target as Node)
      ) {
        setProfileMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [profileMenuRef, mobileProfileMenuRef])

  // Theme toggle function
  const handleThemeChange = () => {
    setTheme(isDarkMode ? 'light' : 'dark')
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    window.location.href = '/auth/signin'
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
            <div className="mt-8 h-0 flex-1 overflow-y-auto">
              <nav className="space-y-2 px-4">
                {navigation.map((item) => {
                  const isActive = pathname === item.href
                  return (
                    <Link
                      key={item.name}
                      href={getHrefWithTheme(item.href)}
                      className={cn(
                        isActive
                          ? 'border-l-4 border-brand-300 bg-gray-50 nike-text-primary dark:bg-gray-900 dark:text-white font-bold'
                          : 'nike-text-primary hover:bg-gray-50 hover:nike-text-primary dark:text-gray-300 dark:hover:bg-gray-900 dark:hover:text-white',
                        'group flex items-center px-4 py-3 text-base font-medium transition-all duration-200 rounded-md'
                      )}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <item.icon
                        className={cn(
                          isActive ? 'text-brand-300' : 'text-gray-400 group-hover:text-brand-300 dark:text-gray-500 dark:group-hover:text-gray-300',
                          'mr-4 h-6 w-6 flex-shrink-0'
                        )}
                        aria-hidden="true"
                      />
                      {item.name}
                    </Link>
                  )
                })}
              </nav>
              
              {/* Mobile menu footer */}
              {user && (
                <div className="mt-10 px-4">
                  <div className="border-t border-gray-200 dark:border-gray-800 pt-4">
                    <button
                      className="flex w-full items-center px-4 py-3 text-base nike-text-primary dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors duration-200 rounded-md"
                      onClick={handleThemeChange}
                    >
                      {isDarkMode ? (
                        <>
                          <SunIcon className="mr-4 h-6 w-6 text-brand-300" />
                          Light Mode
                        </>
                      ) : (
                        <>
                          <MoonIcon className="mr-4 h-6 w-6 text-brand-300" />
                          Dark Mode
                        </>
                      )}
                    </button>
                    <button
                      className="flex w-full items-center px-4 py-3 text-base nike-text-primary dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors duration-200 rounded-md mt-2"
                      onClick={handleSignOut}
                    >
                      <ArrowRightOnRectangleIcon className="mr-4 h-6 w-6 text-brand-300" />
                      Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Mobile header */}
      <div className="sticky top-0 z-10 flex h-16 flex-shrink-0 bg-white dark:bg-black border-b border-gray-200 dark:border-gray-800 md:hidden">
        <button
          type="button"
          className="px-4 nike-text-primary dark:text-gray-400 focus:outline-none md:hidden"
          onClick={() => setMobileMenuOpen(true)}
        >
          <span className="sr-only">Open sidebar</span>
          <Bars3Icon className="h-6 w-6" aria-hidden="true" />
        </button>
        <div className="flex flex-1 justify-between px-4">
          <div className="flex flex-1 items-center">
            <Link href={getHrefWithTheme('/dashboard')} className="flex items-center">
              <h1 className="text-xl font-bold nike-text-primary dark:text-white uppercase tracking-tight">
                {navigation.find((item) => pathname === item.href)?.name || 'Dashboard'}
              </h1>
            </Link>
          </div>
          <div className="flex items-center">
            {/* Mobile profile dropdown */}
            {isLoading ? (
              <div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-800 animate-pulse"></div>
            ) : (
              <div className="relative ml-3" ref={mobileProfileMenuRef}>
                <div>
                  <button
                    className="flex items-center text-sm focus:outline-none"
                    onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                  >
                    <span className="sr-only">Open user menu</span>
                    <div className="flex items-center">
                      {user?.avatar_url ? (
                        <img
                          className="h-8 w-8 rounded-full border-2 border-brand-300"
                          src={user.avatar_url}
                          alt={user.full_name || 'User'}
                        />
                      ) : (
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 dark:bg-brand-900 border-2 border-brand-300">
                          <UserCircleIcon className="h-5 w-5 text-brand-500 dark:text-brand-400" />
                        </div>
                      )}
                    </div>
                  </button>
                </div>
                {/* Mobile profile dropdown menu */}
                {profileMenuOpen && (
                  <div 
                    className="absolute right-0 mt-2 w-56 origin-top-right bg-white dark:bg-black py-1 shadow-lg border border-gray-200 dark:border-gray-800 focus:outline-none z-50 rounded-md"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-800">
                      <p className="text-sm font-bold nike-text-primary dark:text-white">
                        {user?.full_name || 'User'}
                      </p>
                      <p className="text-xs nike-text-primary dark:text-gray-400 opacity-70 truncate">
                        {user?.email}
                      </p>
                    </div>
                    <Link
                      href={getHrefWithTheme('/settings')}
                      className="flex items-center px-4 py-2 text-sm nike-text-primary dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors duration-200"
                      role="menuitem"
                      onClick={() => setProfileMenuOpen(false)}
                    >
                      <Cog6ToothIcon className="mr-3 h-5 w-5 text-brand-300" />
                      Settings
                    </Link>
                    <button
                      className="flex w-full items-center px-4 py-2 text-sm nike-text-primary dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors duration-200"
                      role="menuitem"
                      onClick={handleThemeChange}
                    >
                      {isDarkMode ? (
                        <>
                          <SunIcon className="mr-3 h-5 w-5 text-brand-300" />
                          Light Mode
                        </>
                      ) : (
                        <>
                          <MoonIcon className="mr-3 h-5 w-5 text-brand-300" />
                          Dark Mode
                        </>
                      )}
                    </button>
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
            )}
          </div>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden md:fixed md:inset-y-0 md:flex md:w-64 md:flex-col">
        <div className="flex min-h-0 flex-1 flex-col border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-black">
          <div className="flex flex-1 flex-col overflow-y-auto pt-5 pb-4">
            <div className="flex flex-shrink-0 items-center px-4 mb-5">
              <Link href={getHrefWithTheme('/dashboard')} className="flex items-center">
                {isDarkMode ? (
                  <Image
                    src="/images/logo_white.png"
                    alt="My Face Coach"
                    width={150}
                    height={40}
                    className="w-[150px] h-auto"
                  />
                ) : (
                  <Image
                    src="/images/logo.png"
                    alt="My Face Coach"
                    width={150}
                    height={40}
                    className="w-[150px] h-auto"
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
                        ? 'border-l-4 border-brand-300 bg-gray-50 nike-text-primary dark:bg-gray-900 dark:text-white font-bold'
                        : 'nike-text-primary hover:bg-gray-50 hover:nike-text-primary dark:text-gray-300 dark:hover:bg-gray-900 dark:hover:text-white',
                      'group flex items-center px-2 py-2 text-sm font-medium transition-all duration-200'
                    )}
                  >
                    <item.icon
                      className={cn(
                        isActive ? 'text-brand-300' : 'text-gray-400 group-hover:text-brand-300 dark:text-gray-500 dark:group-hover:text-gray-300',
                        'mr-3 h-5 w-5 flex-shrink-0'
                      )}
                      aria-hidden="true"
                    />
                    {item.name}
                  </Link>
                )
              })}
            </nav>
          </div>
          {/* Desktop user profile */}
          {isLoading ? (
            <div className="flex flex-shrink-0 border-t border-gray-200 dark:border-gray-800 p-4">
              <div className="flex items-center">
                <div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-800 animate-pulse"></div>
                <div className="ml-3">
                  <div className="h-4 w-24 bg-gray-200 dark:bg-gray-800 rounded animate-pulse"></div>
                  <div className="h-3 w-32 bg-gray-200 dark:bg-gray-800 rounded mt-1 animate-pulse"></div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-shrink-0 border-t border-gray-200 dark:border-gray-800 p-4">
              <div className="flex items-center" ref={profileMenuRef}>
                <div>
                  <button
                    className="flex max-w-xs items-center text-sm focus:outline-none"
                    onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                  >
                    <div className="flex items-center">
                      {user?.avatar_url ? (
                        <img
                          className="h-8 w-8 rounded-full border-2 border-brand-300"
                          src={user.avatar_url}
                          alt={user?.full_name || 'User'}
                        />
                      ) : (
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 dark:bg-brand-900 border-2 border-brand-300">
                          <UserCircleIcon className="h-5 w-5 text-brand-500 dark:text-brand-400" />
                        </div>
                      )}
                      <div className="ml-3">
                        <p className="text-sm font-bold nike-text-primary dark:text-gray-200">
                          {user?.full_name || 'User'}
                        </p>
                        <p className="text-xs nike-text-primary dark:text-gray-400 opacity-70 truncate max-w-[140px]">
                          {user?.email}
                        </p>
                      </div>
                      <ChevronUpIcon
                        className={cn(
                          "ml-2 h-4 w-4 nike-text-primary dark:text-gray-400 opacity-70 transition-transform",
                          profileMenuOpen ? "rotate-180" : ""
                        )}
                      />
                    </div>
                  </button>
                </div>
                {/* Desktop profile dropdown menu */}
                {profileMenuOpen && (
                  <div 
                    className="absolute bottom-16 left-4 w-56 origin-bottom-left bg-white dark:bg-black py-1 shadow-lg border border-gray-200 dark:border-gray-800 focus:outline-none z-50 rounded-md"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Link
                      href={getHrefWithTheme('/settings')}
                      className="flex items-center px-4 py-2 text-sm nike-text-primary dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors duration-200"
                      role="menuitem"
                      onClick={() => setProfileMenuOpen(false)}
                    >
                      <Cog6ToothIcon className="mr-3 h-5 w-5 text-brand-300" />
                      Settings
                    </Link>
                    <button
                      className="flex w-full items-center px-4 py-2 text-sm nike-text-primary dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors duration-200"
                      role="menuitem"
                      onClick={handleThemeChange}
                    >
                      {isDarkMode ? (
                        <>
                          <SunIcon className="mr-3 h-5 w-5 text-brand-300" />
                          Light Mode
                        </>
                      ) : (
                        <>
                          <MoonIcon className="mr-3 h-5 w-5 text-brand-300" />
                          Dark Mode
                        </>
                      )}
                    </button>
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
          )}
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-1 flex-col md:pl-64">
        {/* Desktop top header */}
        <div className="sticky top-0 z-10 bg-white dark:bg-black border-b border-gray-200 dark:border-gray-800 pl-1 pt-1 sm:pl-3 sm:pt-3 md:hidden"></div>
        <main className="flex-1">
          <div className="py-6">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
} 