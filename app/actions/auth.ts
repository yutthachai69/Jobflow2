'use server'

import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { headers } from "next/headers"
// import { isRedirectError } ... ❌ ไม่ต้อง import แล้ว
import bcrypt from 'bcryptjs'
import {
  checkRateLimit,
  recordFailedLogin,
  clearFailedLogin,
  logSecurityEvent,
  getClientIP,
} from "@/lib/security"
import { handleServerActionError } from "@/lib/error-handler"
import { getCurrentUser } from "@/lib/auth"

/* ===================== LOGIN ===================== */

export async function login(formData: FormData) {
  try {
    const username = formData.get('username') as string
    const password = formData.get('password') as string
    const callbackUrl = formData.get('callbackUrl') as string | null

    if (!username || !password) {
      const redirectUrl = callbackUrl 
        ? `/login?error=missing&callbackUrl=${encodeURIComponent(callbackUrl)}`
        : '/login?error=missing'
      redirect(redirectUrl)
    }

    // Get client IP for rate limiting
    const headersList = await headers()
    const ipAddress = headersList.get('x-forwarded-for')?.split(',')[0]?.trim() ||
                     headersList.get('x-real-ip') ||
                     'unknown'

    // Check rate limit with both username and IP
    const rateLimitResult = checkRateLimit(username, ipAddress)

    if (!rateLimitResult.allowed) {
      logSecurityEvent('LOGIN_RATE_LIMIT_EXCEEDED', {
        username,
        lockoutUntil: rateLimitResult.lockoutUntil,
      })

      redirect(
        `/login?error=rate_limit&retryAfter=${
          rateLimitResult.lockoutUntil
            ? Math.ceil((rateLimitResult.lockoutUntil.getTime() - Date.now()) / 1000)
            : 900
        }`
      )
    }

    let user
    try {
      user = await prisma.user.findUnique({
        where: { username },
      })
    } catch (dbError) {
      console.error('Database error during login:', dbError)
      redirect('/login?error=database')
    }

    if (!user) {
      recordFailedLogin(username, ipAddress)
      redirect('/login?error=invalid')
    }

    const { autoUnlockExpiredAccounts } = await import('@/lib/account-lock')
    await autoUnlockExpiredAccounts()

    const refreshedUser = await prisma.user.findUnique({
      where: { id: user.id },
    })

    if (!refreshedUser) {
      redirect('/login?error=invalid')
    }

    const now = new Date()
    const isLocked =
      refreshedUser.locked ||
      (refreshedUser.lockedUntil && refreshedUser.lockedUntil > now)

    if (isLocked) {
      const lockoutMessage =
        refreshedUser.lockedUntil && refreshedUser.lockedUntil > now
          ? `บัญชีถูกล็อกจนถึง ${refreshedUser.lockedUntil.toLocaleString('th-TH')}`
          : 'บัญชีถูกล็อก กรุณาติดต่อ Admin'

      logSecurityEvent('LOGIN_ATTEMPT_LOCKED_ACCOUNT', {
        username: refreshedUser.username,
        userId: refreshedUser.id,
        lockedReason: refreshedUser.lockedReason,
        lockedUntil: refreshedUser.lockedUntil?.toISOString(),
      })

      redirect(`/login?error=locked&message=${encodeURIComponent(lockoutMessage)}`)
    }

    const isValidPassword = await bcrypt.compare(
      password,
      refreshedUser.password
    )

    if (!isValidPassword) {
      recordFailedLogin(username, ipAddress)

      const rateLimitResult = checkRateLimit(username, ipAddress)
      if (!rateLimitResult.allowed && rateLimitResult.lockoutUntil) {
        await prisma.user.update({
          where: { id: refreshedUser.id },
          data: {
            locked: true,
            lockedUntil: rateLimitResult.lockoutUntil,
            lockedReason: 'Too many failed login attempts',
          },
        })

        logSecurityEvent('ACCOUNT_AUTO_LOCKED', {
          userId: refreshedUser.id,
          username: refreshedUser.username,
          lockoutUntil: rateLimitResult.lockoutUntil.toISOString(),
        })
      }

      redirect('/login?error=invalid')
    }

    clearFailedLogin(username, ipAddress)

    const { setSession } = await import('@/lib/auth')
    await setSession(refreshedUser.id, refreshedUser.role, refreshedUser.siteId ?? null)

    // Log login success (important security event, but reduce verbosity)
    // Uncomment if you need to debug login:
    // if (process.env.NODE_ENV !== 'production' && process.env.DEBUG_AUTH === 'true') {
    //   console.log('[Login] Session set for user:', refreshedUser.username, 'role:', refreshedUser.role, 'siteId:', refreshedUser.siteId ?? '(none)')
    // }

    logSecurityEvent('LOGIN_SUCCESS', {
      userId: refreshedUser.id,
      username: refreshedUser.username,
      role: refreshedUser.role,
    })

    const role = String(refreshedUser.role)

    // Log redirect (uncomment if debugging):
    // if (process.env.NODE_ENV !== 'production' && process.env.DEBUG_AUTH === 'true') {
    //   console.log('[Login] Redirecting to home for role:', role)
    // }

    // ถ้ามี callbackUrl ให้ redirect ไปที่นั้น
    if (callbackUrl) {
      redirect(callbackUrl)
    }

    if (role === 'ADMIN') redirect('/')
    if (role === 'TECHNICIAN') redirect('/technician')
    if (role === 'CLIENT') redirect('/')

    redirect('/')
  } catch (error: any) {
    // ✅ แก้ไขตรงนี้: เช็ค Error เองโดยไม่ต้องพึ่ง import
    if (error?.digest?.startsWith('NEXT_REDIRECT') || error?.message === 'NEXT_REDIRECT') {
      throw error
    }

    await handleServerActionError(
      error,
      await getCurrentUser().catch(() => null)
    )
    throw error
  }
}

/* ===================== LOGOUT ===================== */

export async function logout() {
  try {
    const { deleteSession } = await import('@/lib/auth')
    await deleteSession()

    redirect('/login')
  } catch (error: any) {
    // ✅ แก้ไขตรงนี้ด้วย
    if (error?.digest?.startsWith('NEXT_REDIRECT') || error?.message === 'NEXT_REDIRECT') {
      throw error
    }

    await handleServerActionError(
      error,
      await getCurrentUser().catch(() => null)
    )
    throw error
  }
}