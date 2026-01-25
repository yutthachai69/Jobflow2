import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { logSecurityEvent } from '@/lib/security'
import { handleApiError } from '@/lib/error-handler'
import { createLogContext } from '@/lib/logger'
import { logger } from '@/lib/logger'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { sanitizeString } from '@/lib/validation'

/**
 * GET /api/assets/[id]
 * Get asset by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const asset = await prisma.asset.findUnique({
      where: { id },
      include: {
        room: {
          include: {
            floor: {
              include: {
                building: {
                  include: {
                    site: {
                      include: {
                        client: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
        jobItems: {
          include: {
            workOrder: {
              include: {
                site: {
                  include: {
                    client: true,
                  },
                },
              },
            },
            technician: true,
            photos: true,
          },
          orderBy: { startTime: 'desc' },
        },
      },
    })

    if (!asset) {
      return NextResponse.json({ error: 'Asset not found' }, { status: 404 })
    }

    // Access Control: CLIENT can only view assets within their assigned site
    if (user.role === 'CLIENT') {
      let siteId = user.siteId
      if (!siteId) {
        const dbUser = await prisma.user.findUnique({
          where: { id: user.userId },
          select: { siteId: true },
        })
        siteId = dbUser?.siteId ?? null
      }
      if (!siteId || asset.room.floor.building.siteId !== siteId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    return NextResponse.json(asset)
  } catch (error) {
    const currentUser = await getCurrentUser().catch(() => null)
    const context = await createLogContext(request, currentUser)
    const errorResponse = await handleApiError(error, request, currentUser)
    
    logger.error('Failed to get asset', context, error as Error)
    
    return NextResponse.json(
      { error: errorResponse.error },
      { status: errorResponse.statusCode }
    )
  }
}

/**
 * PUT /api/assets/[id]
 * Update asset (ADMIN only)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json()

    const roomId = sanitizeString(body.roomId)
    const serialNo = sanitizeString(body.serialNo)
    const brand = sanitizeString(body.brand)
    const model = sanitizeString(body.model)
    const btuStr = body.btu
    const installDateStr = body.installDate
    const status = body.status as 'ACTIVE' | 'BROKEN' | 'RETIRED'

    // Validation
    if (!roomId) {
      return NextResponse.json({ error: 'Room ID is required' }, { status: 400 })
    }
    if (!serialNo) {
      return NextResponse.json({ error: 'Serial Number is required' }, { status: 400 })
    }
    if (!status || !['ACTIVE', 'BROKEN', 'RETIRED'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    // Check if asset exists
    const existingAsset = await prisma.asset.findUnique({
      where: { id },
    })

    if (!existingAsset) {
      return NextResponse.json({ error: 'Asset not found' }, { status: 404 })
    }

    // Check if QR Code (serialNo) already exists (excluding current asset)
    if (serialNo !== existingAsset.qrCode) {
      const duplicateAsset = await prisma.asset.findUnique({
        where: { qrCode: serialNo },
      })
      if (duplicateAsset) {
        return NextResponse.json({ error: 'QR Code already exists' }, { status: 400 })
      }
    }

    const btu = btuStr ? parseInt(btuStr, 10) : null
    if (btuStr && (isNaN(btu!) || btu! < 0 || btu! > 1000000)) {
      return NextResponse.json({ error: 'Invalid BTU value' }, { status: 400 })
    }

    const installDate = installDateStr ? new Date(installDateStr) : null
    if (installDateStr && (!installDate || isNaN(installDate.getTime()))) {
      return NextResponse.json({ error: 'Invalid date format' }, { status: 400 })
    }

    await prisma.asset.update({
      where: { id },
      data: {
        roomId,
        qrCode: serialNo,
        brand: brand || null,
        model: model || null,
        serialNo: serialNo || null,
        btu: btu || null,
        installDate: installDate || null,
        status,
      },
    })

    logSecurityEvent('ASSET_UPDATED', {
      updatedBy: user.id,
      assetId: id,
      timestamp: new Date().toISOString(),
    })

    revalidatePath(`/assets/${id}`)
    revalidatePath('/assets')
    return NextResponse.json({ success: true, message: 'Asset updated successfully' })
  } catch (error) {
    const currentUser = await getCurrentUser().catch(() => null)
    const context = await createLogContext(request, currentUser)
    const errorResponse = await handleApiError(error, request, currentUser)
    
    logger.error('Failed to update asset', context, error as Error)
    
    return NextResponse.json(
      { error: errorResponse.error },
      { status: errorResponse.statusCode }
    )
  }
}

/**
 * DELETE /api/assets/[id]
 * Delete asset endpoint (ADMIN only)
 */
export async function DELETE(
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

