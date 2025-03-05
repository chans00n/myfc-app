import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Get the pathname from the URL
  const pathname = req.nextUrl.pathname

  // Define public paths that don't require authentication
  const publicPaths = ['/', '/login', '/signup', '/pricing', '/auth/sign-in', '/auth/sign-up', '/auth/sign-out']
  const isPublicPath = publicPaths.some(path => pathname === path || pathname.startsWith(path))

  // Define auth paths
  const authPaths = ['/login', '/signup', '/auth/sign-in', '/auth/sign-up']
  const isAuthPath = authPaths.some(path => pathname === path || pathname.startsWith(path))

  // If user is not signed in and trying to access a protected path
  if (!session && !isPublicPath) {
    const redirectUrl = new URL('/login', req.url)
    return NextResponse.redirect(redirectUrl)
  }

  // If user is signed in and trying to access auth pages
  if (session && isAuthPath) {
    const redirectUrl = new URL('/dashboard', req.url)
    return NextResponse.redirect(redirectUrl)
  }

  return res
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
} 