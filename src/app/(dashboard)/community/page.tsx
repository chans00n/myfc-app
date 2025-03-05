import { getCurrentUser } from '@/lib/auth'
import DashboardLayout from '@/components/layouts/DashboardLayout'
import { createServerSupabaseClient } from '@/lib/auth'
import ChatMessages from '@/components/chat/ChatMessages'
import { UserGroupIcon } from '@heroicons/react/24/solid'
import Image from 'next/image'

async function getMessages(channel: string) {
  const supabase = createServerSupabaseClient()
  const { data: messages } = await supabase
    .from('messages')
    .select(`
      *,
      profiles:user_id (
        full_name,
        avatar_url
      )
    `)
    .eq('channel', channel)
    .order('created_at', { ascending: true })
    .limit(50)

  return messages
}

export default async function CommunityPage({
  searchParams,
}: {
  searchParams: { channel?: string }
}) {
  const user = await getCurrentUser()
  const currentChannel = searchParams.channel || 'general'
  const messages = await getMessages(currentChannel)

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header Section */}
        <div className="relative">
          {/* Image Header */}
          <div className="relative h-64 sm:h-80 rounded-xl overflow-hidden" 
               style={{ background: 'linear-gradient(rgba(0, 0, 0, 0.3) 0%, rgb(0, 0, 0) 100%)' }}>
            {/* Background Image */}
            <div className="absolute inset-0">
              <Image
                src="/images/fp5S7YUycHmDLFhl1967C0Eyp6M.jpg"
                alt="Community background" 
                fill
                className="object-cover mix-blend-overlay"
                priority
              />
            </div>
            
            {/* Avatar positioned to overlap the bottom of the image */}
            <div className="absolute bottom-0 left-0 right-0">
              <div className="container mx-auto px-6 sm:px-8 lg:px-10">
                <div className="relative">
                  <div className="absolute -bottom-12 z-10">
                    <div className="h-24 w-24 rounded-full bg-white p-1 shadow-lg flex items-center justify-center">
                      <UserGroupIcon className="h-16 w-16 text-brand-600" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Content directly on the gray background */}
          <div className="bg-background-light dark:bg-background-dark pt-5 pb-6">
            <div className="container mx-auto px-6 sm:px-8 lg:px-10">
              <div className="pl-0 md:pl-32">
                <h1 className="text-3xl font-bold text-text-primary dark:text-text-primary-dark sm:text-4xl text-left">Community</h1>
                <p className="mt-2 max-w-2xl text-lg text-text-secondary dark:text-text-secondary-dark text-left">
                  Connect with other members and trainers in our community. Share your progress, ask questions, and get support on your fitness journey.
                </p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Chat Channels */}
        <div className="bg-card-light dark:bg-card-dark shadow sm:rounded-xl">
          <div className="px-4 py-5 sm:p-6">
            <h4 className="text-sm font-medium text-text-secondary dark:text-text-secondary-dark">Channels</h4>
            <div className="mt-4 flex flex-wrap gap-2">
              {['general', 'support', 'workouts'].map((channel) => (
                <a
                  key={channel}
                  href={`/community?channel=${channel}`}
                  className={`inline-flex items-center px-3 py-1.5 border shadow-sm text-sm font-medium rounded-md ${
                    currentChannel === channel
                      ? 'border-brand-500 text-brand-700 dark:text-brand-300 bg-brand-50 dark:bg-brand-900/30'
                      : 'border-border-light dark:border-border-dark text-text-primary dark:text-text-primary-dark bg-card-light dark:bg-card-dark hover:bg-muted-light dark:hover:bg-muted-dark'
                  } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500`}
                >
                  {channel.charAt(0).toUpperCase() + channel.slice(1)}
                </a>
              ))}
            </div>
          </div>
        </div>
        
        {/* Chat Messages */}
        <div className="bg-card-light dark:bg-card-dark shadow sm:rounded-xl">
          <div className="px-4 py-5 sm:p-6">
            <ChatMessages initialMessages={messages || []} channel={currentChannel} />
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
} 