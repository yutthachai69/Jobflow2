/**
 * Emergency setup-admin: สร้าง admin ถ้ายังไม่มี
 * ⚠️ ใน production ปิดการเข้าถึงทั้งหมด (ป้องกันการสร้าง admin โดยไม่ได้รับอนุญาต)
 */

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { NextResponse } from 'next/server'

const prisma = new PrismaClient()

export async function GET() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ message: 'Not available' }, { status: 404 })
  }

  try {
    const existingAdmin = await prisma.user.findUnique({
      where: { username: 'admin' },
    })

    if (existingAdmin) {
      return NextResponse.json({
        success: true,
        message: 'Admin user already exists.',
        user: { id: existingAdmin.id, username: existingAdmin.username, role: existingAdmin.role },
      })
    }

    const hashedPassword = await bcrypt.hash('admin123', 10)
    const newAdmin = await prisma.user.create({
      data: {
        username: 'admin',
        password: hashedPassword,
        fullName: 'ผู้ดูแลระบบ (Emergency Setup)',
        role: 'ADMIN',
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Admin user created. Use admin / admin123 (dev only).',
      user: { id: newAdmin.id, username: newAdmin.username, role: newAdmin.role },
    })
  } catch (error: unknown) {
    console.error('Setup Admin Error:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
