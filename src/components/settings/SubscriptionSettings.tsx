'use client'

import { formatDate } from '@/lib/utils'

interface SubscriptionSettingsProps {
  subscriptionPlan?: string
  subscriptionStatus?: string
  trialEndDate?: string
}

export default function SubscriptionSettings({
  subscriptionPlan,
  subscriptionStatus,
  trialEndDate,
}: SubscriptionSettingsProps) {
  const handleManageSubscription = async () => {
    const response = await fetch('/api/create-portal-session', {
      method: 'POST',
    })
    const { url } = await response.json()
    window.location.href = url
  }

  return (
    <div className="mt-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-900">
            {subscriptionPlan || 'No active subscription'}
          </p>
          <p className="text-sm text-gray-500">
            {subscriptionStatus
              ? `Status: ${subscriptionStatus.charAt(0).toUpperCase()}${subscriptionStatus.slice(1)}`
              : 'Subscribe to access all features'}
          </p>
          {trialEndDate && (
            <p className="text-sm text-gray-500">
              Trial ends on {formatDate(trialEndDate)}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={handleManageSubscription}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Manage subscription
        </button>
      </div>
    </div>
  )
} 