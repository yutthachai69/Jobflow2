/**
 * Setup API Route - สร้าง Schema + Seed Database
 * ใช้สำหรับ setup database ทั้งหมดในตัวเดียว (สำหรับ Vercel deployment)
 * 
 * วิธีใช้: POST /api/setup
 * - สร้าง database schema (db push)
 * - Seed database
 */

import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { readFileSync } from 'fs'
import { join } from 'path'

export async function POST(request: NextRequest) {
  // อนุญาตให้เรียกได้ใน production (สำหรับ initial setup)
  if (process.env.NODE_ENV === 'production' && process.env.SEED_SECRET) {
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.SEED_SECRET}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
  }

  if (process.env.NODE_ENV !== 'production') {
    console.log('🔧 Starting complete database setup...')
  }
  
  const results: string[] = []
  let schemaCreated = false
  let seedCompleted = false
  const setupPrisma = new PrismaClient()

  try {
      // Step 1: เช็คว่า schema มีอยู่แล้วหรือยัง
      if (process.env.NODE_ENV !== 'production') {
        console.log('🔍 Step 1: Checking database schema...')
      }
      try {
        await setupPrisma.$connect()
        await setupPrisma.user.findFirst({ take: 1 })
        results.push('✅ Database schema already exists')
        schemaCreated = true
      } catch (schemaError: any) {
        // Schema ยังไม่มี = ต้องสร้าง
        if (schemaError.code === 'P2021' || schemaError.message?.includes('does not exist') || schemaError.message?.includes('no such table')) {
          if (process.env.NODE_ENV !== 'production') {
            console.log('📝 Step 2: Creating database schema from SQL...')
          }
          
          // อ่าน consolidated SQL file
          const sqlPath = join(process.cwd(), 'prisma', 'migrations', 'consolidated.sql')
          let sqlContent: string
          
          try {
            sqlContent = readFileSync(sqlPath, 'utf-8')
          } catch (fileError: any) {
            // ถ้าไฟล์ไม่มี ให้ throw error (ไฟล์ควรจะมีอยู่แล้ว)
            throw new Error(`Consolidated SQL file not found at ${sqlPath}. Please ensure prisma/migrations/consolidated.sql exists.`)
          }
          
          // Split SQL statements (by semicolon + newline)
          const statements = sqlContent
            .split(';')
            .map(s => s.trim())
            .filter(s => s && !s.startsWith('--') && s !== 'PRAGMA foreign_keys=ON' && s !== 'PRAGMA foreign_keys=OFF')
          
          // Execute each SQL statement
          for (const statement of statements) {
            if (statement.trim()) {
              try {
                await setupPrisma.$executeRawUnsafe(statement)
              } catch (execError: any) {
                // Ignore "already exists" errors
                if (!execError.message?.includes('already exists') && !execError.message?.includes('duplicate')) {
                  if (process.env.NODE_ENV !== 'production') {
                    console.warn(`⚠️  SQL execution warning: ${execError.message}`)
                  }
                  // Continue anyway
                }
              }
            }
          }
          
          results.push('✅ Database schema created successfully')
          schemaCreated = true
        } else {
          throw schemaError
        }
      }

      // Step 2: Seed Database (ถ้า schema พร้อมแล้ว)
      if (schemaCreated) {
        try {
          if (process.env.NODE_ENV !== 'production') {
            console.log('🌱 Step 2: Seeding database...')
          }

          // Clear existing data (if any) - ใช้ setupPrisma instance เดียว
          await setupPrisma.jobPhoto.deleteMany().catch(() => {})
          await setupPrisma.jobItem.deleteMany().catch(() => {})
          await setupPrisma.workOrder.deleteMany().catch(() => {})
          await setupPrisma.asset.deleteMany().catch(() => {})
          await setupPrisma.room.deleteMany().catch(() => {})
          await setupPrisma.floor.deleteMany().catch(() => {})
          await setupPrisma.building.deleteMany().catch(() => {})
          await setupPrisma.site.deleteMany().catch(() => {})
          await setupPrisma.client.deleteMany().catch(() => {})
          await setupPrisma.user.deleteMany().catch(() => {})

          // Hash passwords
          const bcrypt = (await import('bcryptjs')).default
          const adminPasswordHash = await bcrypt.hash('admin123', 10)
          const techPasswordHash = await bcrypt.hash('password123', 10)
          const clientPasswordHash = await bcrypt.hash('client123', 10)

          // Create users
          await setupPrisma.user.create({
            data: {
              username: 'admin',
              password: adminPasswordHash,
              fullName: 'ผู้ดูแลระบบ',
              role: 'ADMIN'
            }
          })

          await setupPrisma.user.create({
            data: {
              username: 'tech1',
              password: techPasswordHash,
              fullName: 'สมชาย งานดี',
              role: 'TECHNICIAN'
            }
          })

          // Create client and site
          const client = await setupPrisma.client.create({
            data: {
              name: 'Grand Hotel Group',
              contactInfo: '02-999-9999'
            }
          })

          const site = await setupPrisma.site.create({
            data: {
              name: 'สาขาสุขุมวิท',
              clientId: client.id,
              address: 'สุขุมวิท 21 กทม.'
            }
          })

          await setupPrisma.user.create({
            data: {
              username: 'client1',
              password: clientPasswordHash,
              fullName: 'ผู้จัดการสาขาสุขุมวิท',
              role: 'CLIENT',
              siteId: site.id
            }
          })

          // Create building, floors, rooms
          const building = await setupPrisma.building.create({
            data: {
              name: 'อาคาร A (Main Wing)',
              siteId: site.id
            }
          })

          const floor1 = await setupPrisma.floor.create({
            data: { name: 'ชั้น 1 Lobby', buildingId: building.id }
          })
          const floor2 = await setupPrisma.floor.create({
            data: { name: 'ชั้น 2 Meeting', buildingId: building.id }
          })

          const roomLobby = await setupPrisma.room.create({
            data: { name: 'Lobby Hall', floorId: floor1.id }
          })
          const roomServer = await setupPrisma.room.create({
            data: { name: 'Server Room', floorId: floor1.id }
          })

          // Create assets
          const airBrands = ['Daikin', 'Carrier', 'Mitsubishi']
          for (let i = 1; i <= 5; i++) {
            await setupPrisma.asset.create({
              data: {
                qrCode: `AC-2024-00${i}`,
                brand: airBrands[i % 3],
                model: `Model-X${i}`,
                btu: 18000 + (i * 1000),
                serialNo: `SN-0000${i}`,
                status: 'ACTIVE',
                roomId: i <= 2 ? roomServer.id : roomLobby.id
              }
            })
          }

          // Create contact info
          const existingContactInfo = await setupPrisma.contactInfo.findFirst()
          if (!existingContactInfo) {
            await setupPrisma.contactInfo.create({
              data: {
                email: 'support@airservice.com',
                phone: '02-XXX-XXXX',
                hours: 'จันทร์-ศุกร์ 08:00-17:00 น.',
              },
            })
          }

          results.push('✅ Database seeded successfully')
          seedCompleted = true

        } catch (seedError: any) {
          // Log errors (important for debugging)
          console.error('❌ Seed failed:', seedError.message)
          if (process.env.NODE_ENV !== 'production') {
            console.error('Seed error details:', seedError)
          }
          results.push(`❌ Seed failed: ${seedError.message}`)
          
          await setupPrisma.$disconnect()
          return NextResponse.json(
            {
              error: 'Database setup failed at seeding',
              message: seedError.message,
              results,
              code: 'SEED_FAILED',
              schemaCreated
            },
            { status: 500 }
          )
        }
      }
      
      await setupPrisma.$disconnect()

      return NextResponse.json({
        success: true,
        message: 'Database setup completed successfully!',
        results,
        schemaCreated,
        seedCompleted,
        users: {
          admin: { username: 'admin', password: 'admin123' },
          technician: { username: 'tech1', password: 'password123' },
          client: { username: 'client1', password: 'client123' }
        }
      })
    } catch (error: any) {
      // Log errors (important for debugging)
      const errorMessage = error instanceof Error ? error.message : String(error)
      console.error('❌ Setup error:', errorMessage)
      if (process.env.NODE_ENV !== 'production') {
        console.error('Setup error details:', error)
      }
      if (setupPrisma) {
        await setupPrisma.$disconnect().catch(() => {})
      }
      
      return NextResponse.json(
        {
          error: 'Database setup failed',
          message: error.message,
          code: error.code || 'SETUP_ERROR',
          results
        },
        { status: 500 }
      )
    }
}

// สำหรับ GET request - แสดง info
export async function GET() {
  return NextResponse.json({
    message: 'Database Setup API',
    usage: {
      method: 'POST',
      endpoint: '/api/setup',
      description: 'Creates database schema and seeds initial data',
      production: process.env.SEED_SECRET ? 'Requires Authorization header: Bearer <SEED_SECRET>' : 'No auth required',
      development: 'No auth required'
    },
    whatItDoes: [
      '1. Generate Prisma Client',
      '2. Create database schema (db push)',
      '3. Seed initial data (users, clients, sites, assets, etc.)'
    ],
    defaultAccounts: {
      admin: { username: 'admin', password: 'admin123' },
      technician: { username: 'tech1', password: 'password123' },
      client: { username: 'client1', password: 'client123' }
    }
  })
}

