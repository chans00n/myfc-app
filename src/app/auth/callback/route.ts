import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const error = requestUrl.searchParams.get('error')
  const errorDescription = requestUrl.searchParams.get('error_description')
  const redirectTo = requestUrl.searchParams.get('redirectTo') || '/dashboard'

  // Log the request URL and parameters for debugging
  console.log('Auth callback URL:', request.url)
  console.log('Auth callback params:', { 
    code: code ? 'present' : 'missing', 
    error, 
    errorDescription,
    redirectTo 
  })

  // Handle error case
  if (error) {
    console.error('Auth callback error:', { error, errorDescription })
    
    // Create a more user-friendly error message
    let userErrorMessage = errorDescription || 'An error occurred during authentication';
    
    // Handle specific error cases
    if (error === 'expired_token' || errorDescription?.includes('expired')) {
      userErrorMessage = 'Your verification link has expired. Please request a new one.';
    }
    
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(error)}&error_description=${encodeURIComponent(userErrorMessage)}`, 
      requestUrl.origin)
    )
  }

  if (code) {
    try {
      const supabase = createRouteHandlerClient({ cookies })
      
      // Exchange the code for a session
      const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
      
      if (exchangeError) {
        console.error('Code exchange error:', exchangeError)
        
        // Create a more user-friendly error message
        let userErrorMessage = exchangeError.message;
        
        if (exchangeError.message.includes('expired')) {
          userErrorMessage = 'Your verification link has expired. Please sign up again or request a password reset.';
        }
        
        return NextResponse.redirect(
          new URL(`/login?error=exchange_failed&error_description=${encodeURIComponent(userErrorMessage)}`, 
          requestUrl.origin)
        )
      }
      
      // Check if this is a new or returning user
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session) {
        // Create a Supabase client with service role to bypass RLS
        const serviceRoleClient = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!,
          {
            auth: {
              autoRefreshToken: false,
              persistSession: false
            }
          }
        )
        
        // Check if user has a profile already
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('created_at, email, full_name')
          .eq('id', session.user.id)
          .single()
        
        if (profileError && profileError.code !== 'PGRST116') {
          console.error('Profile fetch error:', profileError)
          
          // If profile doesn't exist, try to create it using user metadata
          if (profileError.code === 'PGRST104') {
            try {
              const userData = session.user.user_metadata;
              
              if (userData && session.user.email) {
                const { error: insertError } = await serviceRoleClient
                  .from('profiles')
                  .insert({
                    id: session.user.id,
                    email: session.user.email,
                    full_name: userData.full_name || '',
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                  })
                
                if (insertError) {
                  console.error('Profile creation error in callback:', insertError)
                } else {
                  console.log('Created profile for user during callback:', session.user.id)
                }
              }
            } catch (err) {
              console.error('Error creating profile in callback:', err)
            }
          }
        }
        
        // If profile exists and was created more than 5 minutes ago, they're likely a returning user
        const isReturningUser = profile && 
          (new Date().getTime() - new Date(profile.created_at).getTime() > 5 * 60 * 1000)
        
        console.log('Auth callback success:', { 
          userId: session.user.id,
          isReturningUser,
          redirectingTo: isReturningUser ? '/dashboard' : redirectTo
        })
        
        // Redirect returning users to dashboard, new users to pricing
        return NextResponse.redirect(new URL(
          isReturningUser ? '/dashboard' : redirectTo, 
          requestUrl.origin
        ))
      } else {
        console.error('No session after code exchange')
        return NextResponse.redirect(new URL('/login?error=no_session&error_description=Your session could not be created. Please try signing in again.', requestUrl.origin))
      }
    } catch (error) {
      console.error('Auth callback unexpected error:', error)
      return NextResponse.redirect(
        new URL('/login?error=unexpected&error_description=An+unexpected+error+occurred.+Please+try+again.', 
        requestUrl.origin)
      )
    }
  }

  // Fallback redirect
  console.log('Auth callback fallback: No code provided')
  return NextResponse.redirect(new URL('/login?error=no_code&error_description=No verification code was provided. Please try signing in again.', requestUrl.origin))
} 