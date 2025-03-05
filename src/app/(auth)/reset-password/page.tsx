'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export default function ResetPasswordPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [validationError, setValidationError] = useState<string | null>(null)
  
  const supabase = createClientComponentClient()

  // Check if we have a valid hash in the URL
  useEffect(() => {
    const hash = window.location.hash
    if (!hash || !hash.includes('type=recovery')) {
      setError('Invalid or expired password reset link. Please request a new one.')
    }
  }, [])

  const validatePassword = () => {
    if (password.length < 8) {
      setValidationError('Password must be at least 8 characters long')
      return false
    }
    
    if (password !== confirmPassword) {
      setValidationError('Passwords do not match')
      return false
    }
    
    setValidationError(null)
    return true
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    if (!validatePassword()) {
      return
    }
    
    setError(null)
    setSuccess(false)
    setLoading(true)
    
    try {
      const { error } = await supabase.auth.updateUser({
        password,
      })
      
      if (error) {
        setError(error.message)
        return
      }
      
      setSuccess(true)
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        router.push('/login')
      }, 3000)
    } catch (err) {
      setError('An unexpected error occurred')
      console.error('Password reset error:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Left side - Reset Password Form */}
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
              Set new password
            </h2>
            <p className="mt-2 text-sm text-nike-gray-500">
              Enter your new password below.
            </p>
          </div>

          {error && (
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
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          {validationError && (
            <div className="rounded-md bg-yellow-50 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                    <path
                      fillRule="evenodd"
                      d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-yellow-700">{validationError}</p>
                </div>
              </div>
            </div>
          )}

          {success && (
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
                  <p className="text-sm text-green-700">
                    Password updated successfully! Redirecting to login...
                  </p>
                </div>
              </div>
            </div>
          )}

          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  New Password
                </label>
                <div className="mt-1">
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="new-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-brand-300 focus:border-brand-300 sm:text-sm"
                    placeholder="New password"
                    disabled={loading || success || !!error}
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700">
                  Confirm New Password
                </label>
                <div className="mt-1">
                  <input
                    id="confirm-password"
                    name="confirm-password"
                    type="password"
                    autoComplete="new-password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-brand-300 focus:border-brand-300 sm:text-sm"
                    placeholder="Confirm new password"
                    disabled={loading || success || !!error}
                  />
                </div>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading || success || !!error}
                className={`group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-nike-black ${
                  loading || success || !!error ? 'bg-brand-200' : 'bg-brand-300 hover:bg-brand-400'
                } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-300`}
              >
                {loading ? 'Updating...' : success ? 'Updated!' : 'Update Password'}
              </button>
            </div>

            <div className="text-left">
              <Link href="/login" className="font-medium text-brand-300 hover:text-brand-400">
                Back to login
              </Link>
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