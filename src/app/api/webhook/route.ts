import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe/config'
import { handleWebhook } from '@/lib/stripe/utils'

// Webhook handler for Stripe events
export async function POST(req: Request) {
  const body = await req.text()
  const headersList = await headers()
  const signature = headersList.get('stripe-signature')

  if (!signature) {
    return new NextResponse('No signature', { status: 400 })
  }

  if (!stripe) {
    return new NextResponse('Stripe is not initialized', { status: 500 })
  }

  try {
    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )

    await handleWebhook(event)

    return new NextResponse(JSON.stringify({ received: true }), {
      status: 200,
    })
  } catch (err) {
    console.error('Webhook error:', err)
    return new NextResponse(
      `Webhook Error: ${err instanceof Error ? err.message : 'Unknown error'}`,
      { status: 400 }
    )
  }
} 