'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const error = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')
  const signupSuccess = searchParams.get('signup') === 'success'
  
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  
  // Create Supabase client with default configuration
  const supabase = createClientComponentClient()

  useEffect(() => {
    // Check if "Remember Me" was previously set
    const savedRememberMe = localStorage.getItem('rememberMe') === 'true'
    setRememberMe(savedRememberMe)
    
    // Handle error from URL parameters
    if (error) {
      if (error === 'access_denied' && errorDescription?.includes('expired')) {
        setFormError('Your email verification link has expired. Please sign up again.')
      } else if (error === 'exchange_failed' && errorDescription?.includes('expired')) {
        setFormError('Your verification link has expired. Please sign up again or request a password reset.')
      } else if (error === 'no_code') {
        setFormError('No verification code was provided. Please check your email for the verification link or sign up again.')
      } else if (error === 'no_session') {
        setFormError('Your session could not be created. Please try signing in again.')
      } else if (errorDescription) {
        setFormError(errorDescription)
      } else {
        setFormError(`Authentication error: ${error}`)
      }
    }
    
    // Handle signup success
    if (signupSuccess) {
      setSuccessMessage('Account created successfully! Please check your email to verify your account before signing in.')
    }
  }, [error, errorDescription, signupSuccess])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setFormError(null)
    setSuccessMessage(null)
    setLoading(true)
    
    try {
      // Sign in with password
      const { error, data } = await supabase.auth.signInWithPassword({
        email,
        password
      })
      
      if (error) {
        if (error.message.includes('Email not confirmed')) {
          setFormError('Your email has not been verified. Please check your inbox and click the verification link.')
        } else if (error.message.includes('Invalid login credentials')) {
          setFormError('Invalid email or password. Please try again.')
        } else {
          setFormError(error.message)
        }
        return
      }
      
      // Store the "Remember Me" preference in localStorage
      if (rememberMe) {
        localStorage.setItem('rememberMe', 'true')
      } else {
        localStorage.removeItem('rememberMe')
        // If "Remember Me" is not checked, we'll manually sign out when the browser is closed
        // We'll set up an event listener for this in a separate component
        sessionStorage.setItem('session_persistence', 'session')
      }
      
      // Redirect to dashboard on successful login
      router.push('/dashboard')
      router.refresh()
    } catch (err) {
      setFormError('An unexpected error occurred')
      console.error('Login error:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Left side - Login Form */}
      <div className="w-full md:w-1/2 flex items-center justify-center bg-white p-4 md:p-12 lg:p-16 min-h-screen">
        <div className="w-full max-w-md space-y-8">
          {/* Logo */}
          <div className="flex justify-start">
            <Image 
              src="/images/logo.png" 
              alt="MYFC Logo" 
              width={100} 
              height={33} 
              className="h-auto"
              priority
            />
          </div>
          
          <div className="text-left">
            <h2 className="mt-6 text-2xl font-extrabold text-nike-black">
              Sign in to your account
            </h2>
            <p className="mt-2 text-sm text-nike-gray-500">
              Or{' '}
              <Link href="/signup" className="font-medium text-brand-300 hover:text-brand-400">
                create a new account
              </Link>
            </p>
          </div>

          {formError && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{formError}</p>
                  {(formError.includes('expired') || formError.includes('not been verified')) && (
                    <p className="text-sm text-red-700 mt-2">
                      <Link href="/signup" className="font-medium underline">
                        Sign up again
                      </Link>
                      {' or '}
                      <Link href="/forgot-password" className="font-medium underline">
                        reset your password
                      </Link>
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {successMessage && (
            <div className="rounded-md bg-green-50 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-green-700">{successMessage}</p>
                </div>
              </div>
            </div>
          )}

          <form className="mt-8 space-y-6" onSubmit={handleSubmit} method="POST">
            <input type="hidden" name="remember" value="true" />
            <div className="rounded-md shadow-sm -space-y-px">
              <div>
                <label htmlFor="email" className="sr-only">
                  Email address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-brand-300 focus:border-brand-300 focus:z-10 sm:text-sm"
                  placeholder="Email address"
                />
              </div>
              <div>
                <label htmlFor="password" className="sr-only">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-brand-300 focus:border-brand-300 focus:z-10 sm:text-sm"
                  placeholder="Password"
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 text-brand-300 focus:ring-brand-300 border-gray-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                  Remember me
                </label>
              </div>

              <div className="text-sm">
                <Link href="/forgot-password" className="font-medium text-brand-300 hover:text-brand-400">
                  Forgot your password?
                </Link>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className={`group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-nike-black ${
                  loading ? 'bg-brand-200' : 'bg-brand-300 hover:bg-brand-400'
                } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-300`}
              >
                {loading ? 'Signing in...' : 'Sign in'}
              </button>
            </div>
          </form>
        </div>
      </div>
      
      {/* Right side - Image */}
      <div className="hidden md:flex md:w-1/2 relative">
        <Image
          src="/images/bg/DSC00784.jpg"
          alt="Fitness background"
          fill
          className="object-cover"
          priority
        />
      </div>
    </div>
  )
} 