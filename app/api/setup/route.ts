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
  try {
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

    console.log('🔧 Starting complete database setup...')
    
    // Fallback function สำหรับ inline SQL (ถ้าไฟล์ consolidated.sql ไม่มี)
    function getInlineMigrationSQL(): string {
      return `
-- Consolidated Migration SQL (Inline Fallback)
PRAGMA foreign_keys=ON;

CREATE TABLE IF NOT EXISTS "Client" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "contactInfo" TEXT,
    "logoUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "Site" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "latitude" REAL,
    "longitude" REAL,
    "clientId" TEXT NOT NULL,
    CONSTRAINT "Site_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "fullName" TEXT,
    "role" TEXT NOT NULL DEFAULT 'TECHNICIAN',
    "locked" INTEGER NOT NULL DEFAULT 0,
    "lockedUntil" DATETIME,
    "lockedReason" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "siteId" TEXT,
    CONSTRAINT "User_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "User_username_key" ON "User"("username");
CREATE INDEX IF NOT EXISTS "User_role_idx" ON "User"("role");
CREATE INDEX IF NOT EXISTS "User_locked_lockedUntil_idx" ON "User"("locked", "lockedUntil");
CREATE INDEX IF NOT EXISTS "User_siteId_idx" ON "User"("siteId");

CREATE TABLE IF NOT EXISTS "Building" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    CONSTRAINT "Building_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "Floor" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "buildingId" TEXT NOT NULL,
    CONSTRAINT "Floor_buildingId_fkey" FOREIGN KEY ("buildingId") REFERENCES "Building" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "Room" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "floorId" TEXT NOT NULL,
    CONSTRAINT "Room_floorId_fkey" FOREIGN KEY ("floorId") REFERENCES "Floor" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "Asset" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "qrCode" TEXT NOT NULL,
    "brand" TEXT,
    "model" TEXT,
    "serialNo" TEXT,
    "btu" INTEGER,
    "installDate" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "roomId" TEXT NOT NULL,
    CONSTRAINT "Asset_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "Asset_qrCode_key" ON "Asset"("qrCode");
CREATE INDEX IF NOT EXISTS "Asset_status_idx" ON "Asset"("status");
CREATE INDEX IF NOT EXISTS "Asset_roomId_idx" ON "Asset"("roomId");

CREATE TABLE IF NOT EXISTS "WorkOrder" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "jobType" TEXT NOT NULL,
    "scheduledDate" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "siteId" TEXT NOT NULL,
    "assignedTeam" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "WorkOrder_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "WorkOrder_status_idx" ON "WorkOrder"("status");
CREATE INDEX IF NOT EXISTS "WorkOrder_scheduledDate_idx" ON "WorkOrder"("scheduledDate");
CREATE INDEX IF NOT EXISTS "WorkOrder_siteId_idx" ON "WorkOrder"("siteId");

CREATE TABLE IF NOT EXISTS "JobItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "workOrderId" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "technicianId" TEXT,
    "techNote" TEXT,
    "startTime" DATETIME,
    "endTime" DATETIME,
    CONSTRAINT "JobItem_workOrderId_fkey" FOREIGN KEY ("workOrderId") REFERENCES "WorkOrder" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "JobItem_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "JobItem_technicianId_fkey" FOREIGN KEY ("technicianId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "JobItem_technicianId_idx" ON "JobItem"("technicianId");
CREATE INDEX IF NOT EXISTS "JobItem_status_idx" ON "JobItem"("status");
CREATE INDEX IF NOT EXISTS "JobItem_workOrderId_idx" ON "JobItem"("workOrderId");
CREATE INDEX IF NOT EXISTS "JobItem_assetId_idx" ON "JobItem"("assetId");

CREATE TABLE IF NOT EXISTS "JobPhoto" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "url" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "jobItemId" TEXT NOT NULL,
    CONSTRAINT "JobPhoto_jobItemId_fkey" FOREIGN KEY ("jobItemId") REFERENCES "JobItem" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "ContactInfo" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL DEFAULT 'support@airservice.com',
    "phone" TEXT NOT NULL DEFAULT '02-XXX-XXXX',
    "hours" TEXT NOT NULL DEFAULT 'จันทร์-ศุกร์ 08:00-17:00 น.',
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "ContactMessage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "isRead" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ContactMessage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "ContactMessage_isRead_idx" ON "ContactMessage"("isRead");
CREATE INDEX IF NOT EXISTS "ContactMessage_createdAt_idx" ON "ContactMessage"("createdAt");
CREATE INDEX IF NOT EXISTS "ContactMessage_userId_idx" ON "ContactMessage"("userId");

CREATE TABLE IF NOT EXISTS "SecurityIncident" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'MEDIUM',
    "description" TEXT NOT NULL,
    "metadata" TEXT,
    "userId" TEXT,
    "username" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "resolved" INTEGER NOT NULL DEFAULT 0,
    "resolvedAt" DATETIME,
    "resolvedBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "SecurityIncident_type_idx" ON "SecurityIncident"("type");
CREATE INDEX IF NOT EXISTS "SecurityIncident_severity_idx" ON "SecurityIncident"("severity");
CREATE INDEX IF NOT EXISTS "SecurityIncident_resolved_idx" ON "SecurityIncident"("resolved");
CREATE INDEX IF NOT EXISTS "SecurityIncident_createdAt_idx" ON "SecurityIncident"("createdAt");
CREATE INDEX IF NOT EXISTS "SecurityIncident_userId_idx" ON "SecurityIncident"("userId");
      `
    }
    
    const results: string[] = []
    let schemaCreated = false
    let seedCompleted = false
    const setupPrisma = new PrismaClient()

    try {
      // Step 1: เช็คว่า schema มีอยู่แล้วหรือยัง
      console.log('🔍 Step 1: Checking database schema...')
      try {
        await setupPrisma.$connect()
        await setupPrisma.user.findFirst({ take: 1 })
        results.push('✅ Database schema already exists')
        schemaCreated = true
      } catch (schemaError: any) {
        // Schema ยังไม่มี = ต้องสร้าง
        if (schemaError.code === 'P2021' || schemaError.message?.includes('does not exist') || schemaError.message?.includes('no such table')) {
          console.log('📝 Step 2: Creating database schema from SQL...')
          
          // อ่าน consolidated SQL file
          const sqlPath = join(process.cwd(), 'prisma', 'migrations', 'consolidated.sql')
          let sqlContent: string
          
          try {
            sqlContent = readFileSync(sqlPath, 'utf-8')
          } catch (fileError: any) {
            // ถ้าไฟล์ไม่มี ให้ใช้ SQL inline
            console.warn('⚠️  Consolidated SQL file not found, using inline SQL...')
            sqlContent = getInlineMigrationSQL()
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
                  console.warn(`⚠️  SQL execution warning: ${execError.message}`)
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
          console.log('🌱 Step 2: Seeding database...')

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
          console.error('❌ Seed failed:', seedError.message)
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
      console.error('❌ Setup error:', error)
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

