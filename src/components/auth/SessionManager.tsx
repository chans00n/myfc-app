'use client'

import { useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

/**
 * SessionManager component handles session persistence based on the "Remember Me" preference.
 * It sets up an event listener to sign out the user when the browser is closed if "Remember Me" is not checked.
 */
export default function SessionManager() {
  useEffect(() => {
    const handleBeforeUnload = async () => {
      // Check if the session should be cleared when the browser is closed
      if (sessionStorage.getItem('session_persistence') === 'session') {
        const supabase = createClientComponentClient()
        // Sign out the user when the browser is closed
        await supabase.auth.signOut()
        // Clear the session persistence preference
        sessionStorage.removeItem('session_persistence')
      }
    }

    // Add event listener for beforeunload event
    window.addEventListener('beforeunload', handleBeforeUnload)

    // Clean up the event listener when the component is unmounted
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [])

  // This component doesn't render anything
  return null
} 