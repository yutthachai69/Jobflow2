import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { lockAccount, unlockAccount } from '@/lib/account-lock'
import { handleApiError, createLogContext } from '@/lib/error-handler'
import { logger } from '@/lib/logger'

/**
 * Lock user account (ADMIN only)
 * Used in case of security breach
 */
export async function POST(request: NextRequest) {
  try {
    // Authorization check
    const user = await getCurrentUser()
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const body = await request.json()
    const { userId, reason, durationMinutes, action } = body

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    // Find user
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Prevent locking yourself
    if (userId === user.id) {
      return NextResponse.json({ error: 'Cannot lock your own account' }, { status: 400 })
    }

    // Prevent locking other admins (optional - can be removed if needed)
    if (targetUser.role === 'ADMIN' && user.id !== userId) {
      return NextResponse.json({ error: 'Cannot lock another admin account' }, { status: 403 })
    }

    // Handle lock/unlock action
    if (action === 'unlock') {
      await unlockAccount({
        userId,
        unlockedBy: user.id,
      })

      return NextResponse.json({ 
        success: true, 
        message: `Account ${targetUser.username} has been unlocked`,
      })
    } else {
      // Lock account
      await lockAccount({
        userId,
        reason: reason || 'Security incident',
        durationMinutes: durationMinutes || 15,
        lockedBy: user.id,
      })

      return NextResponse.json({ 
        success: true, 
        message: `Account ${targetUser.username} has been locked`,
      })
    }
  } catch (error) {
    const context = createLogContext(request, user)
    const errorResponse = handleApiError(error, request, user)
    
    logger.error('Failed to lock/unlock account', context, error as Error)
    
    return NextResponse.json(
      { error: errorResponse.error },
      { status: errorResponse.statusCode }
    )
  }
}


