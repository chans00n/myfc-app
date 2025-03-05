import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe/config'
import { handleWebhook } from '@/lib/stripe/utils'
import { env, safeLogError } from '@/lib/env'

export async function POST(req: Request) {
  try {
    const body = await req.text()
    const signature = headers().get('stripe-signature')

    if (!signature) {
      return new NextResponse('Missing Stripe signature', { status: 400 })
    }

    if (!stripe) {
      return new NextResponse('Stripe client not initialized', { status: 500 })
    }

    try {
      const event = stripe.webhooks.constructEvent(
        body,
        signature,
        env.stripe.webhookSecret
      )

      await handleWebhook(event)

      return new NextResponse(JSON.stringify({ success: true }), { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      })
    } catch (error) {
      safeLogError(error, 'Stripe webhook')
      
      // Return a 400 error for Stripe to retry the webhook
      return new NextResponse(
        JSON.stringify({ 
          error: error instanceof Error ? error.message : 'Unknown error'
        }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }
  } catch (error) {
    // This is a server error, not a Stripe error
    safeLogError(error, 'Processing webhook request')
    
    return new NextResponse(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
} 