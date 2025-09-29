import jwt, { SignOptions } from 'jsonwebtoken'
import { AuthUser } from './auth'

// Use environment variable for JWT secret - critical for production security
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-dev-secret-change-in-production'
const JWT_EXPIRY_HOURS = parseInt(process.env.JWT_EXPIRY_HOURS || '2')
const JWT_EXPIRY = `${JWT_EXPIRY_HOURS}h` // Default 2 hours

// Warn if using fallback secret in production
if (process.env.NODE_ENV === 'production' && JWT_SECRET === 'fallback-dev-secret-change-in-production') {
  console.error('⚠️  WARNING: Using fallback JWT secret in production! Set JWT_SECRET environment variable!')
}

export interface JWTPayload {
  userId: number
  username: string
  role: string
  iat: number
  exp: number
}

export function generateToken(user: AuthUser): string {
  const payload = {
    userId: user.id,
    username: user.username,
    role: user.role
  }
  
  const options: SignOptions = {
    expiresIn: JWT_EXPIRY as any,
    issuer: 'midi-database',
    subject: user.id.toString()
  }
  
  return jwt.sign(payload, JWT_SECRET, options)
}

export function verifyToken(token: string): { valid: boolean; payload?: JWTPayload; error?: string } {
  try {
    const payload = jwt.verify(token, JWT_SECRET, {
      issuer: 'midi-database'
    }) as JWTPayload

    return { valid: true, payload }
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return { valid: false, error: 'Token expired' }
    } else if (error instanceof jwt.JsonWebTokenError) {
      return { valid: false, error: 'Invalid token' }
    } else {
      return { valid: false, error: 'Token verification failed' }
    }
  }
}

export function refreshToken(oldToken: string): { success: boolean; token?: string; error?: string } {
  const verification = verifyToken(oldToken)
  
  if (!verification.valid || !verification.payload) {
    return { success: false, error: verification.error }
  }

  // Only allow refresh if token is not expired or recently expired (within 5 minutes)
  const now = Math.floor(Date.now() / 1000)
  const expiredRecently = verification.payload.exp > (now - 5 * 60)
  
  if (!expiredRecently) {
    return { success: false, error: 'Token too old to refresh' }
  }

  const user: AuthUser = {
    id: verification.payload.userId,
    username: verification.payload.username,
    role: verification.payload.role
  }

  return {
    success: true,
    token: generateToken(user)
  }
}

export function getClientIP(request: Request): string {
  // Get real IP from various headers (considering proxies/load balancers)
  const forwarded = request.headers.get('x-forwarded-for')
  const realIP = request.headers.get('x-real-ip')
  const cfIP = request.headers.get('cf-connecting-ip')
  
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  
  if (realIP) {
    return realIP
  }
  
  if (cfIP) {
    return cfIP
  }
  
  return 'unknown'
}