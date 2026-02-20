'use server'

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { sanitizeString } from "@/lib/validation"
import { requireAdmin } from "@/lib/auth-helpers"
import { logSecurityEvent } from "@/lib/security"
import { handleServerActionError } from "@/lib/error-handler"
import { getCurrentUser } from "@/lib/auth"

export async function createAsset(formData: FormData) {
  try {
    await requireAdmin()

    const roomId = sanitizeString(formData.get('roomId') as string)
    const serialNo = sanitizeString(formData.get('serialNo') as string)
    const assetType = formData.get('assetType') as string || 'AIR_CONDITIONER'
    const brand = sanitizeString(formData.get('brand') as string)
    const model = sanitizeString(formData.get('model') as string)
    const btuStr = formData.get('btu') as string
    const installDateStr = formData.get('installDate') as string

    // Validation
    if (!roomId) {
      throw new Error('Room ID is required')
    }
    if (!serialNo) {
      throw new Error('Serial Number is required')
    }

    // Check if QR Code (serialNo) already exists
    const existingAsset = await prisma.asset.findUnique({
      where: { qrCode: serialNo },
    })
    if (existingAsset) {
      throw new Error('QR Code already exists')
    }

    const btu = btuStr ? parseInt(btuStr, 10) : null
    if (btuStr && (isNaN(btu!) || btu! < 0 || btu! > 1000000)) {
      throw new Error('Invalid BTU value')
    }

    const installDate = installDateStr ? new Date(installDateStr) : null
    if (installDateStr && (!installDate || isNaN(installDate.getTime()))) {
      throw new Error('Invalid date format')
    }

    await prisma.asset.create({
      data: {
        roomId,
        qrCode: serialNo, // ใช้ Serial Number เป็น QR Code
        assetType: assetType as any,
        brand: brand || null,
        model: model || null,
        serialNo: serialNo || null,
        btu: btu || null,
        installDate: installDate || null,
        status: 'ACTIVE',
      },
    })

    revalidatePath('/assets')
  } catch (error) {
    await handleServerActionError(error, await getCurrentUser().catch(() => null))
    throw error
  }
  redirect('/assets')
}

export async function updateAsset(formData: FormData) {
  try {
    const user = await requireAdmin()

    const assetId = sanitizeString(formData.get('assetId') as string)
    const roomId = sanitizeString(formData.get('roomId') as string)
    const serialNo = sanitizeString(formData.get('serialNo') as string)
    const assetType = formData.get('assetType') as string || 'AIR_CONDITIONER'
    const brand = sanitizeString(formData.get('brand') as string)
    const model = sanitizeString(formData.get('model') as string)
    const btuStr = formData.get('btu') as string
    const installDateStr = formData.get('installDate') as string
    const status = formData.get('status') as 'ACTIVE' | 'BROKEN' | 'RETIRED'

    // Validation
    if (!assetId) {
      throw new Error('Asset ID is required')
    }
    if (!roomId) {
      throw new Error('Room ID is required')
    }
    if (!serialNo) {
      throw new Error('Serial Number is required')
    }
    if (!status || !['ACTIVE', 'BROKEN', 'RETIRED'].includes(status)) {
      throw new Error('Invalid status')
    }

    // Check if asset exists
    const existingAsset = await prisma.asset.findUnique({
      where: { id: assetId },
    })
    if (!existingAsset) {
      throw new Error('Asset not found')
    }

    // Check if QR Code (serialNo) already exists (excluding current asset)
    if (serialNo !== existingAsset.qrCode) {
      const duplicateAsset = await prisma.asset.findUnique({
        where: { qrCode: serialNo },
      })
      if (duplicateAsset) {
        throw new Error('QR Code already exists')
      }
    }

    const btu = btuStr ? parseInt(btuStr, 10) : null
    if (btuStr && (isNaN(btu!) || btu! < 0 || btu! > 1000000)) {
      throw new Error('Invalid BTU value')
    }

    const installDate = installDateStr ? new Date(installDateStr) : null
    if (installDateStr && (!installDate || isNaN(installDate.getTime()))) {
      throw new Error('Invalid date format')
    }

    await prisma.asset.update({
      where: { id: assetId },
      data: {
        roomId,
        qrCode: serialNo,
        assetType: assetType as any,
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
      assetId,
      timestamp: new Date().toISOString(),
    })

    const redirectTo = `/assets/${assetId}`
    revalidatePath(redirectTo)
    revalidatePath('/assets')
  } catch (error) {
    await handleServerActionError(error, await getCurrentUser().catch(() => null))
    throw error
  }
  redirect(`/assets/${(formData.get('assetId') as string)}`)
}

export async function deleteAsset(assetId: string) {
  try {
    const user = await requireAdmin()

    // Check if asset exists
    const asset = await prisma.asset.findUnique({
      where: { id: assetId },
      include: {
        jobItems: true,
      },
    })

    if (!asset) {
      throw new Error('Asset not found')
    }

    // Check if asset has job items (prevent deletion if has work history)
    if (asset.jobItems.length > 0) {
      throw new Error('Cannot delete asset with work history')
    }

    await prisma.asset.delete({
      where: { id: assetId },
    })

    logSecurityEvent('ASSET_DELETED', {
      deletedBy: user.id,
      assetId,
      timestamp: new Date().toISOString(),
    })

    revalidatePath('/assets')
  } catch (error) {
    await handleServerActionError(error, await getCurrentUser().catch(() => null))
    throw error
  }
  redirect('/assets')
}
