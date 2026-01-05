import { NextRequest } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { logSecurityEvent } from '@/lib/security'
import { handleApiError, createLogContext } from '@/lib/error-handler'
import { logger } from '@/lib/logger'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

/**
 * Delete asset endpoint (ADMIN only)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Authorization check
    const user = await getCurrentUser()
    if (!user || user.role !== 'ADMIN') {
      redirect('/assets?error=unauthorized')
    }

    const { id } = await params

    // Find asset to delete
    const assetToDelete = await prisma.asset.findUnique({
      where: { id },
      include: {
        jobItems: true,
      },
    })

    if (!assetToDelete) {
      redirect('/assets?error=not_found')
    }

    // Check if asset has job items (prevent deletion if has work history)
    if (assetToDelete.jobItems.length > 0) {
      redirect('/assets?error=has_job_items')
    }

    // Delete asset
    await prisma.asset.delete({
      where: { id },
    })

    // Log security event
    logSecurityEvent('ASSET_DELETED', {
      deletedBy: user.id,
      assetId: id,
      timestamp: new Date().toISOString(),
    })

    revalidatePath('/assets')
    redirect('/assets?success=deleted')
  } catch (error) {
    const user = await getCurrentUser().catch(() => null)
    const context = createLogContext(request, user)
    const errorResponse = handleApiError(error, request, user)
    
    logger.error('Failed to delete asset', context, error as Error)
    redirect('/assets?error=server_error')
  }
}

