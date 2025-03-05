import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { SUBSCRIPTION_PLANS } from '@/lib/stripe/config'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-02-24.acacia',
})

// Define price IDs for each plan
const PRICE_IDS = {
  MONTHLY: process.env.STRIPE_MONTHLY_PRICE_ID!,
  ANNUAL: process.env.STRIPE_ANNUAL_PRICE_ID!,
} as const

export async function POST(request: Request) {
  try {
    console.log('Starting checkout session creation...')
    const supabase = createRouteHandlerClient({ cookies })
    
    // Get the current user's session
    const { data: { session: userSession }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError || !userSession) {
      console.error('Session error:', sessionError)
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    console.log('User session:', { 
      id: userSession.user.id,
      email: userSession.user.email,
      name: userSession.user.user_metadata.full_name 
    })

    // Get the user's profile to get their Stripe customer ID
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', userSession.user.id)
      .single()

    if (profileError) {
      console.error('Profile fetch error:', profileError)
      return NextResponse.json(
        { error: 'Failed to fetch user profile' },
        { status: 500 }
      )
    }

    const { plan } = await request.json()
    console.log('Selected plan:', plan)

    if (!plan || !(plan in SUBSCRIPTION_PLANS)) {
      console.error('Invalid plan:', plan)
      return NextResponse.json(
        { error: 'Invalid plan selected' },
        { status: 400 }
      )
    }

    const planDetails = SUBSCRIPTION_PLANS[plan as keyof typeof SUBSCRIPTION_PLANS]
    const priceId = PRICE_IDS[plan as keyof typeof PRICE_IDS]

    console.log('Plan details:', { 
      name: planDetails.name,
      price: planDetails.price,
      interval: planDetails.interval,
      priceId 
    })

    if (!priceId) {
      console.error('Missing price ID for plan:', plan)
      return NextResponse.json(
        { error: 'Price ID not configured for this plan' },
        { status: 500 }
      )
    }

    // If no Stripe customer exists, create one
    let customerId = profile?.stripe_customer_id
    if (!customerId) {
      console.log('Creating new Stripe customer...')
      const customer = await stripe.customers.create({
        email: userSession.user.email!,
        name: userSession.user.user_metadata.full_name,
        metadata: {
          supabase_user_id: userSession.user.id,
        },
      })
      customerId = customer.id
      console.log('Created Stripe customer:', customerId)

      // Update the profile with the new Stripe customer ID
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ stripe_customer_id: customerId })
        .eq('id', userSession.user.id)

      if (updateError) {
        console.error('Profile update error:', updateError)
        // Don't fail the checkout if profile update fails
      }
    } else {
      console.log('Updating existing Stripe customer:', customerId)
      // Update existing customer with latest details
      await stripe.customers.update(customerId, {
        email: userSession.user.email!,
        name: userSession.user.user_metadata.full_name,
      })
    }

    console.log('Creating checkout session...')
    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing`,
      metadata: {
        supabase_user_id: userSession.user.id,
        plan,
      },
      subscription_data: {
        trial_period_days: plan === 'MONTHLY' ? 7 : undefined,
        metadata: {
          supabase_user_id: userSession.user.id,
          plan,
        },
      },
    })

    console.log('Checkout session created:', { 
      id: checkoutSession.id,
      url: checkoutSession.url 
    })

    return NextResponse.json({ url: checkoutSession.url })
  } catch (error) {
    console.error('Checkout session error:', error)
    if (error instanceof Stripe.errors.StripeError) {
      console.error('Stripe error details:', {
        type: error.type,
        code: error.code,
        message: error.message,
        param: error.param,
      })
    }
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
} 