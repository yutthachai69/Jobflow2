'use server'

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { sanitizeString } from "@/lib/validation"
import { requireAdmin } from "@/lib/auth-helpers"
import { logSecurityEvent } from "@/lib/security"
import { handleServerActionError } from "@/lib/error-handler"
import { getCurrentUser } from "@/lib/auth"

const EXHAUST_CODE_REGEX = /^EX-(\d{4})-(\d{3})$/

/** สร้างรหัส Exhaust ตัวถัดไปในรูปแบบ EX-YYYY-NNN (เช่น EX-2025-001) */
async function getNextExhaustCode(): Promise<string> {
  const year = new Date().getFullYear()
  const prefix = `EX-${year}-`
  const existing = await prisma.asset.findMany({
    where: {
      assetType: 'EXHAUST',
      qrCode: { startsWith: prefix },
    },
    select: { qrCode: true },
  })
  let maxN = 0
  for (const a of existing) {
    const m = a.qrCode.match(EXHAUST_CODE_REGEX)
    if (m && m[1] === String(year)) {
      const n = parseInt(m[2], 10)
      if (n > maxN) maxN = n
    }
  }
  const nextN = maxN + 1
  return `${prefix}${String(nextN).padStart(3, '0')}`
}

export async function createAsset(formData: FormData): Promise<{ error: string } | void> {
  try {
    await requireAdmin()

    const roomId = sanitizeString(formData.get('roomId') as string)
    const serialNo = sanitizeString(formData.get('serialNo') as string)
    const assetType = formData.get('assetType') as string || 'AIR_CONDITIONER'
    const brand = sanitizeString(formData.get('brand') as string)
    const model = sanitizeString(formData.get('model') as string)
    const btuStr = formData.get('btu') as string
    const installDateStr = formData.get('installDate') as string
    const machineType = formData.get('machineType') as string || null

    // Validation
    if (!roomId) {
      return { error: 'กรุณาเลือกห้องก่อนบันทึก' }
    }
    if (assetType === 'AIR_CONDITIONER' && !serialNo) {
      return { error: 'กรุณากรอก Serial Number / QR Code' }
    }

    // Check if QR Code (serialNo) already exists
    if (serialNo) {
      const existingAsset = await prisma.asset.findUnique({
        where: { qrCode: serialNo },
      })
      if (existingAsset) {
        return { error: `Serial Number "${serialNo}" มีอยู่ในระบบแล้ว กรุณาใช้รหัสอื่น` }
      }
    }

    const btu = btuStr ? parseInt(btuStr, 10) : null
    if (btuStr && (isNaN(btu!) || btu! < 0 || btu! > 1000000)) {
      return { error: 'ค่า BTU ไม่ถูกต้อง' }
    }

    const installDate = installDateStr ? new Date(installDateStr) : null
    if (installDateStr && (!installDate || isNaN(installDate.getTime()))) {
      return { error: 'รูปแบบวันที่ไม่ถูกต้อง' }
    }

    // Exhaust: ไม่บังคับกรอกรหัส → สร้างรูปแบบ EX-YYYY-NNN ให้อัตโนมัติ
    let qrCode: string
    if (assetType === 'EXHAUST' && !serialNo) {
      qrCode = await getNextExhaustCode()
    } else {
      qrCode = serialNo || `ASSET-${Date.now()}`
    }

    await prisma.asset.create({
      data: {
        roomId,
        qrCode,
        assetType: assetType as any,
        machineType: assetType === 'AIR_CONDITIONER' ? (machineType as any) : null,
        btu: btu || null,
        installDate: installDate || null,
        status: 'ACTIVE',
      },
    })

    revalidatePath('/assets')
  } catch (error) {
    await handleServerActionError(error, await getCurrentUser().catch(() => null))
    return { error: `เกิดข้อผิดพลาด: ${error instanceof Error ? error.message : String(error)}` }
  }
  redirect('/assets')
}

export async function updateAsset(formData: FormData): Promise<{ error: string } | void> {
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
    const machineType = formData.get('machineType') as string || null

    // Validation
    if (!assetId) {
      return { error: 'Asset ID is required' }
    }
    if (!roomId) {
      return { error: 'Room ID is required' }
    }
    if (!serialNo) {
      return { error: 'Serial Number is required' }
    }
    if (!status || !['ACTIVE', 'BROKEN', 'RETIRED'].includes(status)) {
      return { error: 'Invalid status' }
    }

    // Check if asset exists
    const existingAsset = await prisma.asset.findUnique({
      where: { id: assetId },
    })
    if (!existingAsset) {
      return { error: 'Asset not found' }
    }

    // Check if QR Code (serialNo) already exists (excluding current asset)
    if (serialNo !== existingAsset.qrCode) {
      const duplicateAsset = await prisma.asset.findUnique({
        where: { qrCode: serialNo },
      })
      if (duplicateAsset) {
        return { error: 'QR Code already exists' }
      }
    }

    const btu = btuStr ? parseInt(btuStr, 10) : null
    if (btuStr && (isNaN(btu!) || btu! < 0 || btu! > 1000000)) {
      return { error: 'Invalid BTU value' }
    }

    const installDate = installDateStr ? new Date(installDateStr) : null
    if (installDateStr && (!installDate || isNaN(installDate.getTime()))) {
      return { error: 'Invalid date format' }
    }

    await prisma.asset.update({
      where: { id: assetId },
      data: {
        room: { connect: { id: roomId } },
        qrCode: serialNo,
        assetType: assetType as any,
        machineType: assetType === 'AIR_CONDITIONER' ? (machineType as any) : null,
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
    return { error: `เกิดข้อผิดพลาด: ${error instanceof Error ? error.message : String(error)}` }
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

/** อัปเดตรหัส Exhaust ที่ยังไม่ใช่รูปแบบ EX-YYYY-NNN ให้เป็น EX-YYYY-NNN (เรียงตามวันที่สร้าง) */
export async function migrateExhaustAssetCodes(): Promise<{ updated: number; error?: string }> {
  try {
    await requireAdmin()

    const allExhaust = await prisma.asset.findMany({
      where: { assetType: 'EXHAUST' },
      orderBy: { createdAt: 'asc' },
      select: { id: true, qrCode: true },
    })
    const exhaustToMigrate = allExhaust.filter((a) => !EXHAUST_CODE_REGEX.test(a.qrCode))

    if (exhaustToMigrate.length === 0) {
      return { updated: 0 }
    }

    let updated = 0
    for (const asset of exhaustToMigrate) {
      const newCode = await getNextExhaustCode()
      await prisma.asset.update({
        where: { id: asset.id },
        data: { qrCode: newCode },
      })
      updated++
    }

    revalidatePath('/assets')
    return { updated }
  } catch (error) {
    await handleServerActionError(error, await getCurrentUser().catch(() => null))
    return { updated: 0, error: error instanceof Error ? error.message : 'เกิดข้อผิดพลาด' }
  }
}
