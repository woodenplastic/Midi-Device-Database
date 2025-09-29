import { NextRequest, NextResponse } from 'next/server'
import { authenticateUser } from '../../../lib/auth'
import { generateToken, getClientIP, verifyToken } from '../../../lib/jwt'

// Login endpoint
export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json()
    
    // Input validation
    if (!username || !password || typeof username !== 'string' || typeof password !== 'string') {
      return NextResponse.json(
        { success: false, message: 'Invalid input' },
        { status: 400 }
      )
    }

    // Rate limiting and authentication
    const clientIP = getClientIP(request)
    const authResult = await authenticateUser(username, password, clientIP)
    
    if (!authResult.success) {
      return NextResponse.json(
        { success: false, message: authResult.error },
        { status: 401 }
      )
    }

    // Generate secure JWT token
    const token = generateToken(authResult.user!)
    
    // Set secure HTTP-only cookie
    const response = NextResponse.json({ 
      success: true, 
      message: 'Authentication successful',
      username: authResult.user!.username
    })

    // Set secure cookie with JWT token
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 2 * 60 * 60, // 2 hours
      path: '/'
    })

    return response
  } catch (error) {
    console.error('Error in admin authentication:', error)
    return NextResponse.json(
      { success: false, message: 'Server error' },
      { status: 500 }
    )
  }
}

// Check authentication status
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value
    
    if (!token) {
      return NextResponse.json({ authenticated: false })
    }

    const verification = verifyToken(token)
    
    if (!verification.valid) {
      return NextResponse.json({ authenticated: false })
    }

    return NextResponse.json({ 
      authenticated: true, 
      username: verification.payload!.username 
    })
  } catch (error) {
    console.error('Error checking auth status:', error)
    return NextResponse.json({ authenticated: false })
  }
}

// Logout endpoint
export async function DELETE(request: NextRequest) {
  try {
    const response = NextResponse.json({ 
      success: true, 
      message: 'Logged out successfully' 
    })

    // Clear the auth cookie
    response.cookies.set('auth-token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 0,
      path: '/'
    })

    return response
  } catch (error) {
    console.error('Error during logout:', error)
    return NextResponse.json(
      { success: false, message: 'Logout failed' },
      { status: 500 }
    )
  }
}