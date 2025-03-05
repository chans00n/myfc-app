import Stripe from 'stripe'
import { env } from '../env'

// Only initialize Stripe on the server side
export const stripe = typeof window === 'undefined' 
  ? new Stripe(env.stripe.secretKey, {
      apiVersion: '2025-02-24.acacia',
      typescript: true,
    })
  : null

export const SUBSCRIPTION_PLANS = {
  MONTHLY: {
    name: 'Monthly Plan',
    price: 1999, // $19.99
    interval: 'month',
    trialDays: 7,
  },
  ANNUAL: {
    name: 'Annual Plan',
    price: 17999, // $179.99
    interval: 'year',
    trialDays: 0,
  },
} as const

export type SubscriptionPlan = keyof typeof SUBSCRIPTION_PLANS 