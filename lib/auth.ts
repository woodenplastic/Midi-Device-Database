// Secure server-side configuration using environment variables
import bcrypt from 'bcryptjs'

// Load admin users from environment variables (more secure for production)
const ADMIN_USERS = [
  { 
    id: 1,
    username: process.env.ADMIN1_USERNAME || 'admin1',
    // Fallback hash for development (Admin_2024_Secure!)
    passwordHash: process.env.ADMIN1_PASSWORD_HASH || '$2b$12$7mGjo9ER8KNhB881H0rgz.2DDC.9nk8gf9eVTlH3Ewz6G29ZN1FP.',
    role: 'admin',
    lastLogin: null,
    failedAttempts: 0,
    lockedUntil: null
  },
  { 
    id: 2,
    username: process.env.ADMIN2_USERNAME || 'admin2',
    // Fallback hash for development (SecurePass_2024!)
    passwordHash: process.env.ADMIN2_PASSWORD_HASH || '$2b$12$YWxDt0MHP8dm2mSNJQcXZ.ohp6LuNhh0jmHURXH04yQoYssIoGiE6',
    role: 'admin',
    lastLogin: null,
    failedAttempts: 0,
    lockedUntil: null
  }
]

// Security configuration from environment variables
const SECURITY_CONFIG = {
  rateLimitAttempts: parseInt(process.env.RATE_LIMIT_ATTEMPTS || '5'),
  rateLimitWindowMinutes: parseInt(process.env.RATE_LIMIT_WINDOW_MINUTES || '15'),
  accountLockoutAttempts: parseInt(process.env.ACCOUNT_LOCKOUT_ATTEMPTS || '3'),
  accountLockoutMinutes: parseInt(process.env.ACCOUNT_LOCKOUT_MINUTES || '30')
}

// Rate limiting storage (in production, use Redis or database)
const rateLimitStore = new Map<string, { attempts: number; resetTime: number }>()

export interface AuthUser {
  id: number
  username: string
  role: string
}

export async function validatePassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
  return await bcrypt.compare(plainPassword, hashedPassword)
}

export async function authenticateUser(username: string, password: string, clientIP: string): Promise<{ success: boolean; user?: AuthUser; error?: string }> {
  // Rate limiting check
  const rateLimitKey = `login:${clientIP}`
  const currentTime = Date.now()
  const rateLimit = rateLimitStore.get(rateLimitKey)
  
  if (rateLimit && rateLimit.attempts >= SECURITY_CONFIG.rateLimitAttempts && currentTime < rateLimit.resetTime) {
    const remainingTime = Math.ceil((rateLimit.resetTime - currentTime) / 1000)
    return { 
      success: false, 
      error: `Too many failed attempts. Try again in ${remainingTime} seconds.` 
    }
  }

  // Find user
  const user = ADMIN_USERS.find(u => u.username === username)
  if (!user) {
    updateRateLimit(rateLimitKey)
    return { success: false, error: 'Invalid credentials' }
  }

  // Check if account is locked
  if (user.lockedUntil && Date.now() < user.lockedUntil) {
    const remainingTime = Math.ceil((user.lockedUntil - Date.now()) / 1000 / 60)
    return { 
      success: false, 
      error: `Account locked. Try again in ${remainingTime} minutes.` 
    }
  }

  // Validate password
  const isValid = await validatePassword(password, user.passwordHash)
  
  if (!isValid) {
    updateRateLimit(rateLimitKey)
    updateFailedAttempts(user)
    return { success: false, error: 'Invalid credentials' }
  }

  // Success - reset counters
  clearRateLimit(rateLimitKey)
  resetFailedAttempts(user)
  
  return {
    success: true,
    user: {
      id: user.id,
      username: user.username,
      role: user.role
    }
  }
}

function updateRateLimit(key: string) {
  const current = rateLimitStore.get(key)
  const now = Date.now()
  const windowMs = SECURITY_CONFIG.rateLimitWindowMinutes * 60 * 1000
  
  if (!current || now > current.resetTime) {
    rateLimitStore.set(key, { attempts: 1, resetTime: now + windowMs })
  } else {
    rateLimitStore.set(key, { attempts: current.attempts + 1, resetTime: current.resetTime })
  }
}

function clearRateLimit(key: string) {
  rateLimitStore.delete(key)
}

function updateFailedAttempts(user: any) {
  user.failedAttempts = (user.failedAttempts || 0) + 1
  if (user.failedAttempts >= SECURITY_CONFIG.accountLockoutAttempts) {
    user.lockedUntil = Date.now() + SECURITY_CONFIG.accountLockoutMinutes * 60 * 1000
  }
}

function resetFailedAttempts(user: any) {
  user.failedAttempts = 0
  user.lockedUntil = null
  user.lastLogin = Date.now()
}

export function getUserByUsername(username: string) {
  return ADMIN_USERS.find(u => u.username === username)
}