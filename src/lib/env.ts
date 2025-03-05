/**
 * This file provides a secure way to access environment variables
 * with validation to ensure all required variables are present.
 */

// Define the environment variables we need
interface EnvVariables {
  // Supabase
  NEXT_PUBLIC_SUPABASE_URL: string;
  NEXT_PUBLIC_SUPABASE_ANON_KEY: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  
  // Stripe
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: string;
  STRIPE_SECRET_KEY: string;
  STRIPE_WEBHOOK_SECRET: string;
  
  // App
  NEXT_PUBLIC_APP_URL: string;
  NODE_ENV: 'development' | 'production' | 'test';
}

// Get environment variables with validation
function getEnvVariable(key: keyof EnvVariables): string {
  const value = process.env[key];
  
  // In development, we'll warn about missing variables
  // In production, we'll throw an error
  if (!value) {
    const message = `Missing environment variable: ${key}`;
    if (process.env.NODE_ENV === 'production') {
      throw new Error(message);
    } else {
      console.warn(message);
    }
  }
  
  return value || '';
}

// Export environment variables with proper typing
export const env = {
  // Supabase
  supabase: {
    url: getEnvVariable('NEXT_PUBLIC_SUPABASE_URL'),
    anonKey: getEnvVariable('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
    serviceRoleKey: getEnvVariable('SUPABASE_SERVICE_ROLE_KEY'),
  },
  
  // Stripe
  stripe: {
    publishableKey: getEnvVariable('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY'),
    secretKey: getEnvVariable('STRIPE_SECRET_KEY'),
    webhookSecret: getEnvVariable('STRIPE_WEBHOOK_SECRET'),
  },
  
  // App
  app: {
    url: getEnvVariable('NEXT_PUBLIC_APP_URL'),
  },
  
  // Environment
  isProduction: process.env.NODE_ENV === 'production',
  isDevelopment: process.env.NODE_ENV === 'development',
  isTest: process.env.NODE_ENV === 'test',
};

// Helper function to safely log errors without exposing sensitive information
export function safeLogError(error: unknown, context?: string): void {
  if (error instanceof Error) {
    // In production, don't log the full error stack
    if (env.isProduction) {
      console.error(`Error${context ? ` in ${context}` : ''}: ${error.message}`);
    } else {
      console.error(`Error${context ? ` in ${context}` : ''}:`, error);
    }
  } else {
    console.error(`Unknown error${context ? ` in ${context}` : ''}:`, error);
  }
} 