import { stripe } from './config'
import { SUBSCRIPTION_PLANS } from './config'
import { createServerSupabaseClient } from '../auth'
import { env, safeLogError } from '../env'
import Stripe from 'stripe'

export async function createCheckoutSession(plan: keyof typeof SUBSCRIPTION_PLANS) {
  if (!stripe) {
    throw new Error('Stripe client is not initialized')
  }

  const supabase = createServerSupabaseClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    throw new Error('User must be authenticated')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('stripe_customer_id')
    .eq('id', session.user.id)
    .single()

  const planDetails = SUBSCRIPTION_PLANS[plan]
  const trialDays = planDetails.trialDays

  const sessionConfig: any = {
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: planDetails.name,
          },
          unit_amount: planDetails.price,
          recurring: {
            interval: planDetails.interval,
            trial_period_days: trialDays,
          },
        },
        quantity: 1,
      },
    ],
    mode: 'subscription',
    success_url: `${env.app.url}/dashboard?success=true`,
    cancel_url: `${env.app.url}/pricing?canceled=true`,
    customer: profile?.stripe_customer_id,
    metadata: {
      userId: session.user.id,
      plan,
    },
  }

  const checkoutSession = await stripe.checkout.sessions.create(sessionConfig)

  return checkoutSession
}

export async function createCustomerPortalSession() {
  if (!stripe) {
    throw new Error('Stripe client is not initialized')
  }

  const supabase = createServerSupabaseClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    throw new Error('User must be authenticated')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('stripe_customer_id')
    .eq('id', session.user.id)
    .single()

  if (!profile?.stripe_customer_id) {
    throw new Error('No Stripe customer ID found')
  }

  const portalSession = await stripe.billingPortal.sessions.create({
    customer: profile.stripe_customer_id,
    return_url: `${env.app.url}/dashboard`,
  })

  return portalSession
}

// Helper function to safely get user ID from Stripe customer
async function getUserIdFromStripeCustomer(customerId: string): Promise<string | null> {
  try {
    const customer = await stripe!.customers.retrieve(customerId) as Stripe.Customer;
    
    // Make sure the customer is not deleted
    if (customer.deleted) {
      console.warn('Customer has been deleted:', customerId);
      return null;
    }
    
    const userId = customer.metadata?.supabase_user_id;
    if (!userId) {
      console.warn('No user ID found in customer metadata:', customerId);
      return null;
    }
    
    return userId;
  } catch (error) {
    safeLogError(error, `Retrieving customer ${customerId}`);
    return null;
  }
}

export async function handleWebhook(event: any) {
  if (!stripe) {
    throw new Error('Stripe client is not initialized')
  }

  const supabase = createServerSupabaseClient()

  try {
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object
        
        // Get the customer to find the Supabase user ID
        const userId = await getUserIdFromStripeCustomer(subscription.customer as string);
        if (!userId) return;
        
        // Update the user's subscription status
        const { error } = await supabase
          .from('profiles')
          .update({
            subscription_status: subscription.status,
            subscription_plan: subscription.metadata.plan,
            trial_end_date: subscription.trial_end
              ? new Date(subscription.trial_end * 1000).toISOString()
              : null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', userId)
        
        if (error) {
          safeLogError(error, 'Updating subscription status')
        }
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object
        
        // Get the customer to find the Supabase user ID
        const userId = await getUserIdFromStripeCustomer(subscription.customer as string);
        if (!userId) return;
        
        // Update the user's subscription status
        const { error } = await supabase
          .from('profiles')
          .update({
            subscription_status: 'canceled',
            subscription_plan: null,
            trial_end_date: null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', userId)
        
        if (error) {
          safeLogError(error, 'Updating subscription status after deletion')
        }
        break
      }
      
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object
        
        // Only process subscription invoices
        if (invoice.subscription) {
          // Get the customer to find the Supabase user ID
          const userId = await getUserIdFromStripeCustomer(invoice.customer as string);
          if (!userId) return;
          
          // Update the user's payment status
          const { error } = await supabase
            .from('profiles')
            .update({
              subscription_status: 'active',
              updated_at: new Date().toISOString(),
            })
            .eq('id', userId)
          
          if (error) {
            safeLogError(error, 'Updating subscription status after payment')
          }
        }
        break
      }
      
      case 'invoice.payment_failed': {
        const invoice = event.data.object
        
        // Only process subscription invoices
        if (invoice.subscription) {
          // Get the customer to find the Supabase user ID
          const userId = await getUserIdFromStripeCustomer(invoice.customer as string);
          if (!userId) return;
          
          // Update the user's payment status
          const { error } = await supabase
            .from('profiles')
            .update({
              subscription_status: 'past_due',
              updated_at: new Date().toISOString(),
            })
            .eq('id', userId)
          
          if (error) {
            safeLogError(error, 'Updating subscription status after payment failure')
          }
        }
        break
      }
      
      case 'customer.created':
      case 'customer.updated': {
        const customer = event.data.object
        
        // For customer events, we can directly access the metadata
        const userId = customer.metadata?.supabase_user_id
        
        if (!userId) {
          console.warn('No user ID found in customer metadata:', customer.id)
          return
        }
        
        // Update the user's Stripe customer ID
        const { error } = await supabase
          .from('profiles')
          .update({
            stripe_customer_id: customer.id,
            updated_at: new Date().toISOString(),
          })
          .eq('id', userId)
        
        if (error) {
          safeLogError(error, 'Updating Stripe customer ID')
        }
        break
      }
    }
  } catch (error) {
    safeLogError(error, `Processing webhook event ${event.type}`)
    throw error // Re-throw to return a 500 response
  }
} 