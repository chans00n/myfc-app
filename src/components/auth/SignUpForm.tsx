'use client'

import { useState } from 'react'
import Link from 'next/link'
import { validateForm, ValidationError } from '@/lib/validation'

export default function SignUpForm() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<ValidationError[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors([])
    setIsLoading(true)

    const validationErrors = validateForm(email, password, fullName)
    if (validationErrors.length > 0) {
      setErrors(validationErrors)
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch('/auth/sign-up', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          'full-name': fullName,
          email,
          password,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to create account')
      }

      window.location.href = '/'
    } catch (error) {
      setErrors([
        {
          field: 'form',
          message: error instanceof Error ? error.message : 'An error occurred',
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  const getFieldError = (field: string) => {
    return errors.find((error) => error.field === field)?.message
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-6">
      {errors.some((error) => error.field === 'form') && (
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
              <p className="text-sm text-red-700">
                {errors.find((error) => error.field === 'form')?.message}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="rounded-md shadow-sm -space-y-px">
        <div>
          <label htmlFor="full-name" className="sr-only">
            Full name
          </label>
          <input
            id="full-name"
            name="full-name"
            type="text"
            autoComplete="name"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className={`appearance-none rounded-none relative block w-full px-3 py-2 border ${
              getFieldError('full-name')
                ? 'border-red-300 placeholder-red-500 text-red-900'
                : 'border-gray-300 placeholder-gray-500 text-gray-900'
            } rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm`}
            placeholder="Full name"
          />
          {getFieldError('full-name') && (
            <p className="mt-1 text-sm text-red-600">{getFieldError('full-name')}</p>
          )}
        </div>
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
            className={`appearance-none rounded-none relative block w-full px-3 py-2 border ${
              getFieldError('email')
                ? 'border-red-300 placeholder-red-500 text-red-900'
                : 'border-gray-300 placeholder-gray-500 text-gray-900'
            } focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm`}
            placeholder="Email address"
          />
          {getFieldError('email') && (
            <p className="mt-1 text-sm text-red-600">{getFieldError('email')}</p>
          )}
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
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={`appearance-none rounded-none relative block w-full px-3 py-2 border ${
              getFieldError('password')
                ? 'border-red-300 placeholder-red-500 text-red-900'
                : 'border-gray-300 placeholder-gray-500 text-gray-900'
            } rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm`}
            placeholder="Password"
          />
          {getFieldError('password') && (
            <p className="mt-1 text-sm text-red-600">{getFieldError('password')}</p>
          )}
        </div>
      </div>

      <div className="flex items-center">
        <input
          id="terms"
          name="terms"
          type="checkbox"
          required
          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
        />
        <label htmlFor="terms" className="ml-2 block text-sm text-gray-900">
          I agree to the{' '}
          <Link href="/terms" className="font-medium text-indigo-600 hover:text-indigo-500">
            Terms of Service
          </Link>{' '}
          and{' '}
          <Link href="/privacy" className="font-medium text-indigo-600 hover:text-indigo-500">
            Privacy Policy
          </Link>
        </label>
      </div>

      <div>
        <button
          type="submit"
          disabled={isLoading}
          className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Creating account...' : 'Create account'}
        </button>
      </div>
    </form>
  )
} 