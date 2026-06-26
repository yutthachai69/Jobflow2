import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const roomId = request.nextUrl.searchParams.get('roomId')
  const assetType = request.nextUrl.searchParams.get('type') || 'AIR_CONDITIONER'

  if (!roomId) return NextResponse.json({ qrCode: null })

  try {
    let prefix: string
    if (assetType === 'EXHAUST_DUCT') prefix = 'ExD'
    else if (assetType === 'EXHAUST_FAN') prefix = 'ExF'
    else if (assetType === 'FRESH_AIR') prefix = 'FA'
    else prefix = 'AC'

    const room = await prisma.room.findUnique({
      where: { id: roomId },
      include: {
        floor: {
          include: {
            building: { include: { site: true } },
          },
        },
      },
    })
    if (!room) return NextResponse.json({ qrCode: null })

    const siteCode     = room.floor.building.site.siteCode     || null
    const buildingCode = room.floor.building.buildingCode      || null

    // ถ้ายังไม่มี code → ยังสร้าง QR ไม่ได้
    if (!siteCode || !buildingCode) {
      return NextResponse.json({
        qrCode: null,
        warning: !siteCode
          ? `สถานที่ "${room.floor.building.site.name}" ยังไม่มี Site Code กรุณาตั้งค่าก่อน`
          : `อาคาร "${room.floor.building.name}" ยังไม่มี Building Code กรุณาตั้งค่าก่อน`,
      })
    }

    const floorRaw  = room.floor.name.replace(/^ชั้น\s*/u, '').trim()
    const floorCode = `F${floorRaw}`
    const qrPrefix  = `${prefix}-${siteCode}-${buildingCode}-${floorCode}-`

    const existing = await prisma.asset.findMany({
      where: { qrCode: { startsWith: qrPrefix } },
      select: { qrCode: true },
    })

    let maxN = 0
    for (const a of existing) {
      const n = parseInt(a.qrCode.slice(qrPrefix.length), 10)
      if (!isNaN(n) && n > maxN) maxN = n
    }

    const nextQr = `${qrPrefix}${String(maxN + 1).padStart(3, '0')}`
    return NextResponse.json({ qrCode: nextQr })
  } catch {
    return NextResponse.json({ qrCode: null })
  }
}
