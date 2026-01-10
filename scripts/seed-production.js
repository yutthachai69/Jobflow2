/**
 * Production Seed Script
 * ใช้สำหรับ seed database ใน production (Vercel)
 * ไม่ต้องใช้ ts-node เพราะเรียก seed logic โดยตรง
 */

const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

// Helper function to check if table exists (for SQLite)
async function tableExists(tableName) {
  try {
    // For SQLite, try to query the table (will fail if table doesn't exist)
    // SQLite table names are case-insensitive and we need to escape them
    const escapedName = `"${tableName}"`
    await prisma.$queryRawUnsafe(`SELECT 1 FROM ${escapedName} LIMIT 1`)
    return true
  } catch (error) {
    // P2021 = Table does not exist
    // Other codes might be permission errors, but we'll treat as "not exists"
    if (error.code === 'P2021' || 
        error.code === 'SQLITE_ERROR' ||
        error.message?.includes('does not exist') ||
        error.message?.includes('no such table')) {
      return false
    }
    // If it's a different error, assume table exists (might be permission or other issue)
    console.warn(`Warning checking table ${tableName}:`, error.message)
    return true
  }
}

async function main() {
  console.log('🌱 Start seeding (production)...')

  try {
    // เช็คว่า Prisma Client พร้อมใช้งานก่อน
    await prisma.$connect()
    console.log('✅ Prisma Client connected')

    // Wait a bit to ensure database is ready (especially for SQLite)
    await new Promise(resolve => setTimeout(resolve, 1000))

    // เช็คว่า User table มีอยู่หรือไม่ (เป็น indicator ว่า migrate เสร็จแล้วหรือยัง)
    console.log('🔍 Checking if database schema is ready...')
    let userTableExists = false
    let retries = 3
    
    while (!userTableExists && retries > 0) {
      userTableExists = await tableExists('User').catch(() => false)
      
      if (!userTableExists) {
        retries--
        if (retries > 0) {
          console.log(`⏳ Table not ready yet, retrying in 2 seconds... (${retries} retries left)`)
          await new Promise(resolve => setTimeout(resolve, 2000))
        }
      }
    }
    
    if (!userTableExists) {
      console.error('❌ Database tables not found after retries! Migration may have failed.')
      console.error('Please ensure migrations are run before seeding.')
      throw new Error('Database schema not ready. Run migrations first.')
    }
    console.log('✅ Database schema is ready')

    // 1. ล้างข้อมูลเก่าทิ้งก่อน (ถ้ามี) - ใช้ try-catch เพื่อ skip ถ้า table ยังไม่มี
    try {
      await prisma.jobPhoto.deleteMany().catch(() => {})
      await prisma.jobItem.deleteMany().catch(() => {})
      await prisma.workOrder.deleteMany().catch(() => {})
      await prisma.asset.deleteMany().catch(() => {})
      await prisma.room.deleteMany().catch(() => {})
      await prisma.floor.deleteMany().catch(() => {})
      await prisma.building.deleteMany().catch(() => {})
      await prisma.site.deleteMany().catch(() => {})
      await prisma.client.deleteMany().catch(() => {})
      await prisma.user.deleteMany().catch(() => {})
      console.log('✅ Cleared existing data (if any)')
    } catch (clearError) {
      console.warn('⚠️  Clear data warning (tables may not exist yet):', clearError.message)
      // Continue anyway - tables might not exist yet
    }

    // 2. Hash passwords
    const adminPasswordHash = await bcrypt.hash('admin123', 10)
    const techPasswordHash = await bcrypt.hash('password123', 10)
    const clientPasswordHash = await bcrypt.hash('client123', 10)

    // 3. สร้าง User (Admin, ช่าง, ลูกค้า)
    const adminUser = await prisma.user.create({
      data: {
        username: 'admin',
        password: adminPasswordHash,
        fullName: 'ผู้ดูแลระบบ',
        role: 'ADMIN'
      }
    })

    const techUser = await prisma.user.create({
      data: {
        username: 'tech1',
        password: techPasswordHash,
        fullName: 'สมชาย งานดี',
        role: 'TECHNICIAN'
      }
    })

    // 4. สร้างลูกค้า (Client)
    const client = await prisma.client.create({
      data: {
        name: 'Grand Hotel Group',
        contactInfo: '02-999-9999'
      }
    })

    // 5. สร้างสาขา (Site)
    const site = await prisma.site.create({
      data: {
        name: 'สาขาสุขุมวิท',
        clientId: client.id,
        address: 'สุขุมวิท 21 กทม.'
      }
    })

    // 6. สร้าง User สำหรับลูกค้า (ผูกกับ Site)
    const clientUser = await prisma.user.create({
      data: {
        username: 'client1',
        password: clientPasswordHash,
        fullName: 'ผู้จัดการสาขาสุขุมวิท',
        role: 'CLIENT',
        siteId: site.id
      }
    })

    // 7. สร้างตึก (Building)
    const building = await prisma.building.create({
      data: {
        name: 'อาคาร A (Main Wing)',
        siteId: site.id
      }
    })

    // 8. สร้างชั้น (Floors)
    const floor1 = await prisma.floor.create({
      data: { name: 'ชั้น 1 Lobby', buildingId: building.id }
    })
    const floor2 = await prisma.floor.create({
      data: { name: 'ชั้น 2 Meeting', buildingId: building.id }
    })

    // 9. สร้างห้อง (Rooms)
    const roomLobby = await prisma.room.create({
      data: { name: 'Lobby Hall', floorId: floor1.id }
    })
    const roomServer = await prisma.room.create({
      data: { name: 'Server Room', floorId: floor1.id }
    })

    // 10. สร้างแอร์ (Assets) - สร้าง 5 ตัว
    const airBrands = ['Daikin', 'Carrier', 'Mitsubishi']
    
    for (let i = 1; i <= 5; i++) {
      await prisma.asset.create({
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

    // 11. สร้างข้อมูลการติดต่อ (Contact Info)
    const existingContactInfo = await prisma.contactInfo.findFirst()
    if (!existingContactInfo) {
      await prisma.contactInfo.create({
        data: {
          email: 'support@airservice.com',
          phone: '02-XXX-XXXX',
          hours: 'จันทร์-ศุกร์ 08:00-17:00 น.',
        },
      })
    }

    console.log('✅ Seeding finished (production)')
  } catch (error) {
    console.error('❌ Seed error:', error)
    // Log detailed error info
    if (error.code) {
      console.error('Error code:', error.code)
    }
    if (error.meta) {
      console.error('Error meta:', JSON.stringify(error.meta, null, 2))
    }
    throw error
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

