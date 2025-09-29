import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from './lib/jwt'

export function middleware(request: NextRequest) {
  // Only protect admin API routes
  if (request.nextUrl.pathname.startsWith('/api/database') && request.method !== 'GET') {
    return verifyAdminAuth(request)
  }
  
  if (request.nextUrl.pathname.startsWith('/api/upload-svg')) {
    return verifyAdminAuth(request)
  }

  return NextResponse.next()
}

function verifyAdminAuth(request: NextRequest) {
  const token = request.cookies.get('auth-token')?.value
  
  if (!token) {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    )
  }

  const verification = verifyToken(token)
  
  if (!verification.valid) {
    return NextResponse.json(
      { error: 'Invalid or expired token' },
      { status: 401 }
    )
  }

  // Add user info to headers for the API route
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-user-id', verification.payload!.userId.toString())
  requestHeaders.set('x-user-name', verification.payload!.username)
  requestHeaders.set('x-user-role', verification.payload!.role)

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  })
}

export const config = {
  matcher: ['/api/database/:path*', '/api/upload-svg/:path*']
}