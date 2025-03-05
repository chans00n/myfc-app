import { getCurrentUser } from '@/lib/auth'
import DashboardLayout from '@/components/layouts/DashboardLayout'
import { createServerSupabaseClient } from '@/lib/auth'
import { formatDate } from '@/lib/utils'
import ProfileSettings from '@/components/settings/ProfileSettings'
import NotificationSettings from '@/components/settings/NotificationSettings'
import NotificationPreferences from '@/components/settings/NotificationPreferences'
import SubscriptionSettings from '@/components/settings/SubscriptionSettings'

async function getUserProfile() {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return profile
}

export default async function SettingsPage() {
  const user = await getCurrentUser()
  const profile = await getUserProfile()

  if (!user || !profile) {
    return null
  }

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage your account settings and preferences
          </p>
        </div>

        <div className="space-y-8">
          <div className="bg-white shadow rounded-lg p-6">
            <NotificationPreferences />
          </div>

          {/* Profile Settings */}
          <div className="bg-white shadow sm:rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h4 className="text-sm font-medium text-gray-500">Profile Settings</h4>
              <ProfileSettings
                initialData={{
                  full_name: profile.full_name,
                  email: profile.email,
                  avatar_url: profile.avatar_url,
                }}
              />
            </div>
          </div>

          {/* Subscription Settings */}
          <div className="bg-white shadow sm:rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h4 className="text-sm font-medium text-gray-500">Subscription</h4>
              <SubscriptionSettings
                subscriptionPlan={profile.subscription_plan}
                subscriptionStatus={profile.subscription_status}
                trialEndDate={profile.trial_end_date}
              />
            </div>
          </div>

          {/* Notification Settings */}
          <div className="bg-white shadow sm:rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h4 className="text-sm font-medium text-gray-500">Notification Settings</h4>
              <NotificationSettings
                initialData={{
                  email_notifications: profile.email_notifications || false,
                  push_notifications: profile.push_notifications || false,
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
} 