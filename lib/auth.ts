import { cookies } from 'next/headers'
import { SignJWT, jwtVerify } from 'jose'
import { $Enums } from '@prisma/client'
import { env } from './env'

/**
 * ===============================
 * 🔐 Auth / Session Configuration
 * ===============================
 */

// 🔑 Secret Key - ใช้จาก env validation
// ใน production จะ throw error ถ้าไม่มีหรือใช้ default value
const SECRET_KEY = new TextEncoder().encode(env.JWT_SECRET)

// Validate JWT_SECRET at module load (only in production)
if (env.isProduction) {
  if (!env.JWT_SECRET || env.JWT_SECRET.length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters in production')
  }
  if (env.JWT_SECRET === 'my-super-secret-key-change-it-now') {
    throw new Error('JWT_SECRET cannot use default value in production!')
  }
}

/**
 * ===============================
 * 🧩 Types
 * ===============================
 */

export type CurrentUser = {
  userId: string
  id: string // alias for userId (used in many places)
  username?: string
  role: 'ADMIN' | 'TECHNICIAN' | 'CLIENT'
  siteId?: string | null
}

/**
 * ===============================
 * 1️⃣ Create Session (Login)
 * ===============================
 */
export async function setSession(
  userId: string,
  role: CurrentUser['role'],
  siteId?: string | null
) {
  const cookieStore = await cookies()

  // Session expiration: 7 days for absolute timeout, but we'll track last activity
  const token = await new SignJWT({ 
    userId, 
    role, 
    siteId,
    lastActivity: Math.floor(Date.now() / 1000) // Track last activity (in seconds for JWT)
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d') // Absolute timeout: 7 days
    .sign(SECRET_KEY)

  // Secure cookie settings
  // ใน production หรือเมื่อ USE_HTTPS=true ให้ใช้ secure: true
  const isSecure = env.isProduction || env.USE_HTTPS

  cookieStore.set('auth_token', token, {
    httpOnly: true,
    secure: isSecure, // true ใน production หรือเมื่อ USE_HTTPS=true
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 วัน (absolute timeout)
  })

  // Log session creation (uncomment if debugging):
  // if (process.env.NODE_ENV !== 'production' && process.env.DEBUG_AUTH === 'true') {
  //   console.log('[Auth] Session set:', { userId, role, siteId: siteId ?? '(none)' })
  // }
}

/**
 * ===============================
 * 2️⃣ Verify Session (Decode JWT)
 * ===============================
 */
export async function verifySession(): Promise<CurrentUser | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get('auth_token')?.value

  if (!token) {
    // Log only if debugging auth issues
    // if (process.env.NODE_ENV !== 'production' && process.env.DEBUG_AUTH === 'true') {
    //   console.log('[Auth] No auth_token cookie found')
    // }
    return null
  }

  try {
    const { payload } = await jwtVerify(token, SECRET_KEY)

    // Check inactivity timeout (30 minutes)
    const INACTIVITY_TIMEOUT = 30 * 60 // 30 minutes in seconds
    const lastActivity = (payload.lastActivity as number) || payload.iat!
    const now = Math.floor(Date.now() / 1000) // Current time in seconds
    
    if (now - lastActivity > INACTIVITY_TIMEOUT) {
      // Session expired due to inactivity
      // Log only if debugging auth issues
      // if (process.env.NODE_ENV !== 'production' && process.env.DEBUG_AUTH === 'true') {
      //   console.log('[Auth] Session expired due to inactivity')
      // }
      // Note: Cannot delete cookie here because this might be called from a Server Component
      // The cookie will expire naturally based on maxAge, or client-side can handle it
      // Just return null to indicate no valid session
      return null
    }

    // Update last activity (refresh token with new lastActivity)
    // Note: We don't update the token here to avoid too frequent updates
    // The token will be refreshed on next request if needed

    const user = {
      userId: payload.userId as string,
      id: payload.userId as string, // alias for compatibility
      role: payload.role as CurrentUser['role'],
      siteId: (payload.siteId as string) ?? null,
    }

    // Log only in development and only for important events (not every verification)
    // Session verification happens very frequently (on every request), so we don't log it
    // Uncomment below if you need to debug authentication issues:
    // if (process.env.NODE_ENV !== 'production' && process.env.DEBUG_AUTH === 'true') {
    //   console.log('[Auth] Session verified:', { userId: user.userId, role: user.role, siteId: user.siteId })
    // }

    return user
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('[Auth] Token verification failed:', error)
    }
    return null
  }
}

/**
 * ===============================
 * 3️⃣ getCurrentUser
 * (Alias สำหรับใช้ใน page.tsx / layout.tsx)
 * ===============================
 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  return await verifySession()
}

/**
 * ===============================
 * 4️⃣ Delete Session (Logout)
 * ===============================
 */
export async function deleteSession() {
  const cookieStore = await cookies()
  cookieStore.delete('auth_token')
}


