/**
 * Account Locking Utilities
 * 
 * Functions for locking and unlocking user accounts
 */

import { prisma } from './prisma'
import { logSecurityEvent } from './security'
import { logger } from './logger'

export interface LockAccountOptions {
  userId: string
  reason?: string
  durationMinutes?: number // Auto-unlock after X minutes (default: 15)
  lockedBy?: string // Admin user ID who locked the account
}

export interface UnlockAccountOptions {
  userId: string
  unlockedBy?: string // Admin user ID who unlocked the account
}

/**
 * Lock a user account
 */
export async function lockAccount(options: LockAccountOptions) {
  const { userId, reason, durationMinutes = 15, lockedBy } = options

  const lockedUntil = new Date(Date.now() + durationMinutes * 60 * 1000)

  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      locked: true,
      lockedUntil,
      lockedReason: reason || 'Security incident',
    },
  })

  logSecurityEvent('ACCOUNT_LOCKED', {
    userId,
    username: user.username,
    reason: reason || 'Security incident',
    lockedBy,
    lockedUntil: lockedUntil.toISOString(),
    durationMinutes,
  })

  logger.warn('Account locked', {
    userId,
    username: user.username,
    reason,
    lockedBy,
  })

  return user
}

/**
 * Unlock a user account
 */
export async function unlockAccount(options: UnlockAccountOptions) {
  const { userId, unlockedBy } = options

  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      locked: false,
      lockedUntil: null,
      lockedReason: null,
    },
  })

  logSecurityEvent('ACCOUNT_UNLOCKED', {
    userId,
    username: user.username,
    unlockedBy,
  })

  logger.info('Account unlocked', {
    userId,
    username: user.username,
    unlockedBy,
  })

  return user
}

/**
 * Check if account is currently locked
 */
export function isAccountLocked(user: { locked: boolean; lockedUntil: Date | null }): boolean {
  if (!user.locked) {
    return false
  }

  // Check if lock has expired
  if (user.lockedUntil && user.lockedUntil <= new Date()) {
    return false
  }

  return true
}

/**
 * Auto-unlock expired accounts (should be called periodically)
 */
export async function autoUnlockExpiredAccounts() {
  const now = new Date()
  
  const result = await prisma.user.updateMany({
    where: {
      locked: true,
      lockedUntil: {
        lte: now,
      },
    },
    data: {
      locked: false,
      lockedUntil: null,
      lockedReason: null,
    },
  })

  if (result.count > 0) {
    logger.info('Auto-unlocked expired accounts', {
      count: result.count,
    })
  }

  return result.count
}

/**
 * Get lock status message for user
 */
export function getLockStatusMessage(user: { locked: boolean; lockedUntil: Date | null; lockedReason: string | null }): string | null {
  if (!isAccountLocked(user)) {
    return null
  }

  if (user.lockedUntil) {
    const minutesRemaining = Math.ceil((user.lockedUntil.getTime() - Date.now()) / (60 * 1000))
    if (minutesRemaining > 0) {
      return `บัญชีถูกล็อก กรุณารอ ${minutesRemaining} นาที หรือติดต่อ Admin`
    }
  }

  return user.lockedReason || 'บัญชีถูกล็อก กรุณาติดต่อ Admin'
}

