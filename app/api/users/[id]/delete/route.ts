import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { logSecurityEvent } from '@/lib/security'
import { handleApiError, createLogContext } from '@/lib/error-handler'
import { logger } from '@/lib/logger'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

/**
 * Delete user endpoint (ADMIN only)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Authorization check
    const user = await getCurrentUser()
    if (!user || user.role !== 'ADMIN') {
      redirect('/users?error=unauthorized')
    }

    const { id } = await params

    // Prevent self-deletion
    if (user.id === id) {
      redirect('/users?error=cannot_delete_self')
    }

    // Find user to delete
    const userToDelete = await prisma.user.findUnique({
      where: { id },
      include: {
        jobItems: true,
      },
    })

    if (!userToDelete) {
      redirect('/users?error=not_found')
    }

    // Check if user has job items (prevent deletion if has active work)
    if (userToDelete.jobItems.length > 0) {
      redirect('/users?error=has_job_items')
    }

    // Delete user
    await prisma.user.delete({
      where: { id },
    })

    // Log security event
    logSecurityEvent('USER_DELETED', {
      deletedBy: user.id,
      deletedUserId: id,
      deletedUsername: userToDelete.username,
      timestamp: new Date().toISOString(),
    })

    revalidatePath('/users')
    redirect('/users?success=deleted')
  } catch (error) {
    const user = await getCurrentUser().catch(() => null)
    const context = createLogContext(request, user)
    const errorResponse = handleApiError(error, request, user)
    
    logger.error('Failed to delete user', context, error as Error)
    redirect('/users?error=server_error')
  }
}

