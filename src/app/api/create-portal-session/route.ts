import { NextResponse } from 'next/server'
import { createCustomerPortalSession } from '@/lib/stripe/utils'

export async function POST() {
  try {
    const session = await createCustomerPortalSession()

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('Portal session error:', error)
    return new NextResponse(
      `Portal session error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      { status: 500 }
    )
  }
} 