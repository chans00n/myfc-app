import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-02-24.acacia',
})

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const fullName = formData.get('full-name') as string
    const selectedPlan = formData.get('selectedPlan') as string
    const redirectTo = formData.get('redirectTo') as string || '/dashboard'

    if (!email || !password || !fullName) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Log the received data (remove in production)
    console.log('Signup attempt:', { email, fullName, selectedPlan })

    const supabase = createRouteHandlerClient({ cookies })

    // First check if the email already exists
    const { data: existingUser } = await supabase
      .from('profiles')
      .select('email')
      .eq('email', email)
      .single()

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 400 }
      )
    }

    // Get the app URL from environment variable
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    console.log('Using app URL for email verification:', appUrl)

    // Sign up the user
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
        emailRedirectTo: `${appUrl}/auth/callback?redirectTo=${encodeURIComponent(redirectTo)}`,
      },
    })

    if (signUpError) {
      console.error('Signup error:', signUpError)
      
      // Handle rate limit errors
      if (signUpError.message.includes('rate limit')) {
        return NextResponse.json(
          { 
            error: 'Too many signup attempts. Please wait a few minutes before trying again.',
            code: 'RATE_LIMIT'
          },
          { status: 429 }
        )
      }

      return NextResponse.json(
        { error: signUpError.message },
        { status: 400 }
      )
    }

    if (!signUpData.user) {
      return NextResponse.json(
        { error: 'Failed to create user' },
        { status: 500 }
      )
    }

    // Create a Stripe customer
    let stripeCustomerId: string | undefined
    try {
      const customer = await stripe.customers.create({
        email,
        name: fullName,
        metadata: {
          supabase_user_id: signUpData.user.id,
        },
      })
      stripeCustomerId = customer.id
      console.log('Created Stripe customer:', stripeCustomerId)
    } catch (stripeError) {
      console.error('Stripe customer creation error:', stripeError)
      // Don't fail the signup if Stripe customer creation fails
      // We'll create the customer later when they subscribe
    }

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

    // Check if profile already exists before creating a new one
    const { data: existingProfile } = await serviceRoleClient
      .from('profiles')
      .select('id')
      .eq('id', signUpData.user.id)
      .single()

    // Only create profile if it doesn't exist
    if (!existingProfile) {
      try {
        const { error: profileError } = await serviceRoleClient
          .from('profiles')
          .insert({
            id: signUpData.user.id,
            email,
            full_name: fullName,
            stripe_customer_id: stripeCustomerId,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })

        if (profileError) {
          console.error('Profile creation error:', profileError)
          
          // If profile creation fails, we should clean up the user
          try {
            await serviceRoleClient.auth.admin.deleteUser(signUpData.user.id)
            console.log('Cleaned up user after profile creation failure')
            
            // If we created a Stripe customer, we should delete it too
            if (stripeCustomerId) {
              await stripe.customers.del(stripeCustomerId)
              console.log('Cleaned up Stripe customer after profile creation failure')
            }
            
            return NextResponse.json(
              { error: 'Failed to create user profile. Please try again.' },
              { status: 500 }
            )
          } catch (cleanupError) {
            console.error('Error cleaning up after profile creation failure:', cleanupError)
            // Continue with the response even if cleanup fails
          }
        }
      } catch (err) {
        console.error('Unexpected error in profile creation:', err)
        // Don't return an error here, as the user is already created
        // The profile will be created when they confirm their email via the webhook
      }
    } else {
      console.log('Profile already exists for user:', signUpData.user.id)
    }

    return NextResponse.json({ 
      success: true,
      message: 'Please check your email to confirm your account',
      redirectTo: selectedPlan ? '/pricing' : redirectTo
    })
  } catch (error) {
    console.error('Sign up error:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
} 