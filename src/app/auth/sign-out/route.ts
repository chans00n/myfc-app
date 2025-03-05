import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const requestUrl = new URL(request.url)
  const supabase = createRouteHandlerClient({ cookies })

  // Sign out on the server
  await supabase.auth.signOut()

  // Create a response with proper CORS headers
  const response = NextResponse.redirect(`${requestUrl.origin}/login`)
  
  // Add CORS headers
  response.headers.set('Access-Control-Allow-Origin', requestUrl.origin)
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type')
  
  return response
}

// Handle OPTIONS requests for CORS preflight
export async function OPTIONS(request: Request) {
  const requestUrl = new URL(request.url)
  
  const response = new NextResponse(null, { status: 204 }) // No content
  
  // Add CORS headers
  response.headers.set('Access-Control-Allow-Origin', requestUrl.origin)
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type')
  
  return response
} 