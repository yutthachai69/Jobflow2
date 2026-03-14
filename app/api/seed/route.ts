/**
 * API Route สำหรับ seed database
 * ใช้สำหรับ seed database หลัง deploy (Vercel)
 * 
 * ⚠️ ควรใช้เฉพาะสำหรับ development หรือ initial setup
 * สำหรับ production ควรปิดหรือใช้ authentication
 */

import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    if (process.env.NODE_ENV === 'production') {
      if (!process.env.SEED_SECRET) {
        return NextResponse.json(
          { error: 'Seed is disabled in production when SEED_SECRET is not set' },
          { status: 503 }
        )
      }
      const authHeader = request.headers.get('authorization')
      if (authHeader !== `Bearer ${process.env.SEED_SECRET}`) {
        return NextResponse.json(
          { error: 'Unauthorized. Use: Authorization: Bearer <SEED_SECRET>' },
          { status: 401 }
        )
      }
    }

    // ใช้ seed function จาก prisma/seed.ts โดยตรง
    if (process.env.NODE_ENV !== 'production') {
      console.log('🌱 Starting database seed via API...')
    }
    
    const { PrismaClient } = await import('@prisma/client')
    const bcrypt = (await import('bcryptjs')).default
    const seedPrisma = new PrismaClient()

    try {
      // เช็คว่า database schema พร้อมหรือยัง (ตรวจสอบ User table)
      let schemaReady = false
      try {
        // Try to query User table to check if schema exists
        await seedPrisma.user.findFirst({ take: 1 })
        schemaReady = true
      } catch (schemaError: any) {
        // P2021 = Table does not exist, SQLITE_ERROR = SQLite error
        if (schemaError.code === 'P2021' || 
            schemaError.code === 'P2001' ||
            schemaError.message?.includes('does not exist') || 
            schemaError.message?.includes('no such table')) {
          schemaReady = false
        } else {
          // Different error, throw it
          throw schemaError
        }
      }

      if (!schemaReady) {
        await seedPrisma.$disconnect()
        return NextResponse.json(
          {
            error: 'Database schema not ready',
            message: 'Database tables do not exist yet. Please ensure migrations are run first.',
            solution: 'The postinstall script should create the schema automatically. Check Vercel deployment logs.',
            code: 'SCHEMA_NOT_READY'
          },
          { status: 500 }
        )
      }

      // Run seed logic (ซ้ำจาก prisma/seed.ts) - ใช้ catch เพื่อ skip ถ้า table ยังไม่มี
      try {
        await seedPrisma.jobPhoto.deleteMany().catch(() => {})
        await seedPrisma.jobItem.deleteMany().catch(() => {})
        await seedPrisma.workOrder.deleteMany().catch(() => {})
        await seedPrisma.asset.deleteMany().catch(() => {})
        await seedPrisma.room.deleteMany().catch(() => {})
        await seedPrisma.floor.deleteMany().catch(() => {})
        await seedPrisma.building.deleteMany().catch(() => {})
        await seedPrisma.site.deleteMany().catch(() => {})
        await seedPrisma.client.deleteMany().catch(() => {})
        await seedPrisma.user.deleteMany().catch(() => {})
        if (process.env.NODE_ENV !== 'production') {
          console.log('✅ Cleared existing data (if any)')
        }
      } catch (clearError) {
        if (process.env.NODE_ENV !== 'production') {
          console.warn('⚠️  Clear data warning (some tables may not exist)')
        }
        // Continue anyway
      }

      // Hash passwords
      const adminPasswordHash = await bcrypt.hash('admin123', 10)
      const techPasswordHash = await bcrypt.hash('password123', 10)
      const clientPasswordHash = await bcrypt.hash('client123', 10)

      // Create users
      const adminUser = await seedPrisma.user.create({
        data: {
          username: 'admin',
          password: adminPasswordHash,
          fullName: 'ผู้ดูแลระบบ',
          role: 'ADMIN'
        }
      })

      const techUser = await seedPrisma.user.create({
        data: {
          username: 'tech1',
          password: techPasswordHash,
          fullName: 'สมชาย งานดี',
          role: 'TECHNICIAN'
        }
      })

      // Create client and site
      const client = await seedPrisma.client.create({
        data: {
          name: 'Grand Hotel Group',
          contactInfo: '02-999-9999'
        }
      })

      const site = await seedPrisma.site.create({
        data: {
          name: 'สาขาสุขุมวิท',
          clientId: client.id,
          address: 'สุขุมวิท 21 กทม.'
        }
      })

      const clientUser = await seedPrisma.user.create({
        data: {
          username: 'client1',
          password: clientPasswordHash,
          fullName: 'ผู้จัดการสาขาสุขุมวิท',
          role: 'CLIENT',
          siteId: site.id
        }
      })

      // Create building, floors, rooms
      const building = await seedPrisma.building.create({
        data: {
          name: 'อาคาร A (Main Wing)',
          siteId: site.id
        }
      })

      const floor1 = await seedPrisma.floor.create({
        data: { name: 'ชั้น 1 Lobby', buildingId: building.id }
      })
      const floor2 = await seedPrisma.floor.create({
        data: { name: 'ชั้น 2 Meeting', buildingId: building.id }
      })

      const roomLobby = await seedPrisma.room.create({
        data: { name: 'Lobby Hall', floorId: floor1.id }
      })
      const roomServer = await seedPrisma.room.create({
        data: { name: 'Server Room', floorId: floor1.id }
      })

      // Create assets - 50 รายการคละประเภท
      const assetTypes = ['AIR_CONDITIONER', 'REFRIGERANT', 'SPARE_PART', 'TOOL', 'OTHER'] as const
      const statuses = ['ACTIVE', 'ACTIVE', 'ACTIVE', 'ACTIVE', 'BROKEN', 'RETIRED'] as const
      const btuRanges = [12000, 18000, 24000, 30000, 36000]
      const rooms = [roomLobby, roomServer]
      
      for (let i = 1; i <= 50; i++) {
        const assetType = assetTypes[Math.floor(Math.random() * assetTypes.length)]
        const status = statuses[Math.floor(Math.random() * statuses.length)]
        const randomRoom = rooms[Math.floor(Math.random() * rooms.length)]
        
        let qrCode = ''
        let btu: number | null = null
        
        if (assetType === 'AIR_CONDITIONER') {
          qrCode = `AC-2024-${String(i).padStart(3, '0')}`
          btu = btuRanges[Math.floor(Math.random() * btuRanges.length)]
        } else if (assetType === 'REFRIGERANT') {
          qrCode = `REF-2024-${String(i).padStart(3, '0')}`
        } else if (assetType === 'SPARE_PART') {
          qrCode = `PART-2024-${String(i).padStart(3, '0')}`
        } else if (assetType === 'TOOL') {
          qrCode = `TOOL-2024-${String(i).padStart(3, '0')}`
        } else {
          qrCode = `OTHER-2024-${String(i).padStart(3, '0')}`
        }
        
        const installDate = assetType === 'AIR_CONDITIONER' && Math.random() > 0.3
          ? (() => {
              const date = new Date()
              date.setFullYear(date.getFullYear() - Math.floor(Math.random() * 3))
              date.setMonth(Math.floor(Math.random() * 12))
              date.setDate(Math.floor(Math.random() * 28) + 1)
              return date
            })()
          : null
        
        await seedPrisma.asset.create({
          data: {
            qrCode,
            assetType: assetType as any,
            btu,
            installDate,
            status: status as any,
            roomId: randomRoom.id
          }
        })
      }

      // Create contact info
      const existingContactInfo = await seedPrisma.contactInfo.findFirst()
      if (!existingContactInfo) {
        await seedPrisma.contactInfo.create({
          data: {
            email: 'support@airservice.com',
            phone: '02-XXX-XXXX',
            hours: 'จันทร์-ศุกร์ 08:00-17:00 น.',
          },
        })
      }

      await seedPrisma.$disconnect()
    } catch (seedError: any) {
      await seedPrisma.$disconnect()
      throw seedError
    }

    return NextResponse.json({
      success: true,
      message: 'Database seeded successfully',
      users: {
        admin: { username: 'admin', password: 'admin123' },
        technician: { username: 'tech1', password: 'password123' },
        client: { username: 'client1', password: 'client123' }
      }
    })
  } catch (error: any) {
    // Log errors (important for debugging)
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error('Seed error:', errorMessage)
    if (process.env.NODE_ENV !== 'production') {
      console.error('Seed error details:', error)
    }
    
    // Check if it's a schema error
    if (error.code === 'P2021' || error.message?.includes('does not exist') || error.message?.includes('no such table')) {
      return NextResponse.json(
        {
          error: 'Database schema not ready',
          message: 'Database tables do not exist yet.',
          solution: 'Please ensure database migrations are run first. Check Vercel deployment logs for postinstall script errors.',
          code: 'SCHEMA_NOT_READY'
        },
        { status: 500 }
      )
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to seed database',
        message: error.message,
        code: error.code || 'SEED_ERROR',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ message: 'Not available' }, { status: 404 })
  }
  return NextResponse.json({
    message: 'Database Seed API (development only)',
    usage: { method: 'POST', endpoint: '/api/seed' },
    production: 'Requires SEED_SECRET and Authorization: Bearer <SEED_SECRET>',
  })
}

