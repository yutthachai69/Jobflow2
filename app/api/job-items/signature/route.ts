import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { jobItemId, signature } = body

    if (!jobItemId || !signature) {
      return NextResponse.json(
        { error: 'กรุณาระบุ jobItemId และ signature' },
        { status: 400 }
      )
    }

    // ตรวจสอบว่า job item มีอยู่จริง
    const jobItem = await prisma.jobItem.findUnique({
      where: { id: jobItemId },
    })

    if (!jobItem) {
      return NextResponse.json(
        { error: 'ไม่พบรายการงาน' },
        { status: 404 }
      )
    }

    // ตรวจสอบสิทธิ์: เฉพาะช่างที่ assign หรือ admin
    if (
      user.role !== 'ADMIN' &&
      (user.role !== 'TECHNICIAN' || jobItem.technicianId !== user.userId)
    ) {
      return NextResponse.json(
        { error: 'ไม่มีสิทธิ์บันทึกลายเซ็น' },
        { status: 403 }
      )
    }

    // บันทึกลายเซ็น
    await prisma.jobItem.update({
      where: { id: jobItemId },
      data: {
        customerSignature: signature,
        signedAt: new Date(),
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error saving signature:', error)
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการบันทึก' },
      { status: 500 }
    )
  }
}
