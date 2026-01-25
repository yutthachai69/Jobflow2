import { cookies } from 'next/headers'
import { SignJWT, jwtVerify } from 'jose'
import { $Enums } from '@prisma/client'

/**
 * ===============================
 * 🔐 Auth / Session Configuration
 * ===============================
 */

// 🔑 Secret Key (ควรตั้งใน .env)
const SECRET_KEY = new TextEncoder().encode(
  process.env.JWT_SECRET || 'my-super-secret-key-change-it-now'
)

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

  const token = await new SignJWT({ userId, role, siteId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(SECRET_KEY)

  cookieStore.set('auth_token', token, {
    httpOnly: true,
    // ตั้ง secure: false ชั่วคราว เพราะยังใช้ HTTP (ไม่ใช่ HTTPS)
    // เมื่อมี HTTPS แล้ว ให้เปลี่ยนเป็น: secure: process.env.USE_HTTPS === 'true'
    secure: false,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 วัน
  })

  if (process.env.NODE_ENV !== 'production') {
    console.log('[Auth] Session set:', { userId, role, siteId: siteId ?? '(none)' })
  }
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
    if (process.env.NODE_ENV !== 'production') {
      console.log('[Auth] No auth_token cookie found')
    }
    return null
  }

  try {
    const { payload } = await jwtVerify(token, SECRET_KEY)

    const user = {
      userId: payload.userId as string,
      id: payload.userId as string, // alias for compatibility
      role: payload.role as CurrentUser['role'],
      siteId: (payload.siteId as string) ?? null,
    }

    if (process.env.NODE_ENV !== 'production') {
      console.log('[Auth] Session verified:', { userId: user.userId, role: user.role, siteId: user.siteId })
    }

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


