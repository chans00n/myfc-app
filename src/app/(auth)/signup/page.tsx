'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function SignUpPage() {
  const router = useRouter()
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [cooldown, setCooldown] = useState(0)
  const [selectedPlan, setSelectedPlan] = useState('')

  useEffect(() => {
    // Get the selected plan from localStorage
    const plan = localStorage.getItem('selectedPlan')
    if (plan) {
      setSelectedPlan(plan)
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    setSuccess(false)
    setIsLoading(true)

    const formData = new FormData(e.currentTarget)
    const selectedPlan = localStorage.getItem('selectedPlan')
    if (selectedPlan) {
      formData.append('selectedPlan', selectedPlan)
    }

    try {
      const response = await fetch('/auth/sign-up', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        if (response.status === 429) {
          // Handle rate limit error
          setError(data.error)
          setCooldown(300) // 5 minutes cooldown
          const timer = setInterval(() => {
            setCooldown((prev) => {
              if (prev <= 1) {
                clearInterval(timer)
                return 0
              }
              return prev - 1
            })
          }, 1000)
          return
        }
        throw new Error(data.error || 'Failed to create account')
      }

      setSuccess(true)
      localStorage.removeItem('selectedPlan')
      
      // Show success message with instructions to check email
      setError('')
      
      // Wait 5 seconds before redirecting to login page
      setTimeout(() => {
        router.push('/login?signup=success')
      }, 5000)
    } catch (err) {
      console.error('Signup error:', err)
      setError(err instanceof Error ? err.message : 'An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Left side - Signup Form */}
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
              Create your account
            </h2>
            <p className="mt-2 text-sm text-nike-gray-500">
              Or{' '}
              <Link href="/login" className="font-medium text-brand-300 hover:text-brand-400">
                sign in to your account
              </Link>
            </p>
          </div>

          <form className="mt-8 space-y-6" onSubmit={handleSubmit} method="POST" action="/auth/sign-up">
            <input type="hidden" name="remember" value="true" />
            <div className="rounded-md shadow-sm -space-y-px">
              <div>
                <label htmlFor="full-name" className="sr-only">
                  Full Name
                </label>
                <input
                  id="full-name"
                  name="full-name"
                  type="text"
                  required
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-brand-300 focus:border-brand-300 focus:z-10 sm:text-sm"
                  placeholder="Full Name"
                />
              </div>
              <div>
                <label htmlFor="email-address" className="sr-only">
                  Email address
                </label>
                <input
                  id="email-address"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-brand-300 focus:border-brand-300 focus:z-10 sm:text-sm"
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
                  autoComplete="new-password"
                  required
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-brand-300 focus:border-brand-300 focus:z-10 sm:text-sm"
                  placeholder="Password"
                />
              </div>
            </div>

            <div className="flex items-center">
              <input
                id="terms"
                name="terms"
                type="checkbox"
                required
                className="h-4 w-4 text-brand-300 focus:ring-brand-300 border-gray-300 rounded"
              />
              <label htmlFor="terms" className="ml-2 block text-sm text-gray-900">
                I agree to the{' '}
                <Link href="/terms" className="font-medium text-brand-300 hover:text-brand-400">
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link href="/privacy" className="font-medium text-brand-300 hover:text-brand-400">
                  Privacy Policy
                </Link>
              </label>
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
                      Account created successfully! Please check your email to confirm your account. 
                      <br />
                      <span className="font-medium">Important:</span> You must click the verification link in your email to activate your account.
                      <br />
                      Redirecting to login page in 5 seconds...
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={isLoading || cooldown > 0}
                className={`group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-nike-black ${
                  isLoading || cooldown > 0
                    ? 'bg-brand-200 cursor-not-allowed'
                    : 'bg-brand-300 hover:bg-brand-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-300'
                }`}
              >
                {isLoading ? (
                  'Creating account...'
                ) : cooldown > 0 ? (
                  `Please wait ${Math.floor(cooldown / 60)}:${(cooldown % 60).toString().padStart(2, '0')}`
                ) : (
                  'Create account'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
      
      {/* Right side - Image */}
      <div className="hidden md:flex md:w-1/2 relative">
        <Image
          src="/images/bg/A7Rii0259_(2).jpg"
          alt="Fitness background"
          fill
          className="object-cover"
          priority
        />
      </div>
    </div>
  )
} 