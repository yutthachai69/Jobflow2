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

    console.log('[Login Attempt] Username:', username)

    if (!username || !password) {
      return { error: 'missing' }
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

      const retryAfter = rateLimitResult.lockoutUntil
        ? Math.ceil((rateLimitResult.lockoutUntil.getTime() - Date.now()) / 1000)
        : 900

      return { error: 'rate_limit', retryAfter }
    }

    let user
    try {
      user = await prisma.user.findUnique({
        where: { username },
      })
    } catch (dbError: any) {
      console.error('Database error during login:', dbError)

      const isConnectionError =
        dbError.message?.includes('Can\'t reach database server') ||
        dbError.message?.includes('connect ECONNREFUSED') ||
        dbError.message?.includes('P1001') ||
        dbError.code === 'P1001'

      if (isConnectionError) {
        return { error: 'server', message: 'ไม่สามารถเชื่อมต่อฐานข้อมูลได้ กรุณาติดต่อผู้ดูแลระบบ' }
      } else {
        return { error: 'database', message: 'ไม่พบฐานข้อมูลหรือโครงสร้างไม่ถูกต้อง (Database Error)' }
      }
    }

    if (!user) {
      console.log('[Login Failed] User not found:', username)
      recordFailedLogin(username, ipAddress)
      return { error: 'invalid' }
    }

    const { autoUnlockExpiredAccounts } = await import('@/lib/account-lock')
    await autoUnlockExpiredAccounts()

    const refreshedUser = await prisma.user.findUnique({
      where: { id: user.id },
    })

    if (!refreshedUser) {
      console.log('[Login Failed] Refreshed user not found')
      return { error: 'invalid' }
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

      return { error: 'locked', message: lockoutMessage }
    }

    const isValidPassword = await bcrypt.compare(
      password,
      refreshedUser.password
    )

    console.log('[Login Debug] Password valid?', isValidPassword)

    if (!isValidPassword) {
      console.log('[Login Failed] Invalid password for:', username)
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

      return { error: 'invalid' }
    }

    clearFailedLogin(username, ipAddress)

    const { setSession } = await import('@/lib/auth')
    await setSession(refreshedUser.id, refreshedUser.role, refreshedUser.siteId ?? null)

    logSecurityEvent('LOGIN_SUCCESS', {
      userId: refreshedUser.id,
      username: refreshedUser.username,
      role: refreshedUser.role,
    })

    const role = String(refreshedUser.role)

    if (callbackUrl) {
      redirect(callbackUrl)
    }

    if (role === 'ADMIN') redirect('/')
    if (role === 'TECHNICIAN') redirect('/technician')
    if (role === 'CLIENT') redirect('/')

    redirect('/')
  } catch (error: any) {
    if (error?.digest?.startsWith('NEXT_REDIRECT') || error?.message === 'NEXT_REDIRECT') {
      throw error
    }

    await handleServerActionError(
      error,
      await getCurrentUser().catch(() => null)
    )
    throw error // Re-throw so client can handle general error if needed, or return generic error
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