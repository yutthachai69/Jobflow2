// scripts/apply-work-order-number-migration.js
const { PrismaClient } = require('@prisma/client')
const fs = require('fs')
const path = require('path')

const prisma = new PrismaClient()

async function main() {
  console.log('🔧 กำลังรัน migration สำหรับ workOrderNumber...\n')

  try {
    // เปิด foreign keys
    await prisma.$executeRawUnsafe('PRAGMA foreign_keys=ON;')
    console.log('✅ เปิด foreign keys แล้ว\n')

    // ตรวจสอบว่า column มีอยู่แล้วหรือไม่
    const checkColumn = await prisma.$queryRawUnsafe(`
      SELECT sql FROM sqlite_master 
      WHERE type='table' AND name='WorkOrder'
    `)
    
    const tableSql = checkColumn[0]?.sql || ''
    const hasWorkOrderNumber = tableSql.includes('workOrderNumber')

    // สร้าง column ถ้ายังไม่มี
    if (!hasWorkOrderNumber) {
      console.log('📋 เพิ่ม workOrderNumber column...')
      await prisma.$executeRawUnsafe(`
        ALTER TABLE "WorkOrder" ADD COLUMN "workOrderNumber" TEXT
      `)
      console.log('✅ เพิ่ม workOrderNumber column สำเร็จ')
    } else {
      console.log('⚠️  workOrderNumber column มีอยู่แล้ว')
    }

    // สร้าง unique index
    console.log('\n📋 สร้าง unique index...')
    try {
      await prisma.$executeRawUnsafe(`
        CREATE UNIQUE INDEX IF NOT EXISTS "WorkOrder_workOrderNumber_key" ON "WorkOrder"("workOrderNumber")
      `)
      console.log('✅ สร้าง unique index สำเร็จ')
    } catch (e) {
      if (e.message.includes('already exists') || e.message.includes('duplicate')) {
        console.log('⚠️  unique index มีอยู่แล้ว')
      } else {
        throw e
      }
    }

    // สร้าง index
    try {
      await prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS "WorkOrder_workOrderNumber_idx" ON "WorkOrder"("workOrderNumber")
      `)
      console.log('✅ สร้าง index สำเร็จ')
    } catch (e) {
      if (e.message.includes('already exists') || e.message.includes('duplicate')) {
        console.log('⚠️  index มีอยู่แล้ว')
      } else {
        throw e
      }
    }

    // อัพเดท work orders ที่มีอยู่แล้วให้มี workOrderNumber
    console.log('\n📋 อัพเดท work orders ที่มีอยู่แล้ว...')
    
    // ใช้ raw query เพราะ Prisma Client ยังไม่ได้ generate ใหม่
    const workOrders = await prisma.$queryRawUnsafe(`
      SELECT id, "scheduledDate" 
      FROM "WorkOrder" 
      WHERE "workOrderNumber" IS NULL 
      ORDER BY "scheduledDate" ASC
    `)

    console.log(`   พบ work orders ที่ยังไม่มี workOrderNumber: ${workOrders.length} รายการ`)

    // จัดกลุ่มตามวันที่
    const ordersByDate = {}
    for (const wo of workOrders) {
      const date = new Date(wo.scheduledDate)
      const year = date.getFullYear() + 543 // พ.ศ.
      const yy = String(year).slice(-2)
      const mm = String(date.getMonth() + 1).padStart(2, '0')
      const dd = String(date.getDate()).padStart(2, '0')
      const dateKey = `${yy}${mm}${dd}`
      
      if (!ordersByDate[dateKey]) {
        ordersByDate[dateKey] = []
      }
      ordersByDate[dateKey].push(wo)
    }

    // สร้างเลขที่งานสำหรับแต่ละวัน
    let updatedCount = 0
    for (const [dateKey, orders] of Object.entries(ordersByDate)) {
      for (let i = 0; i < orders.length; i++) {
        const sequence = String(i + 1).padStart(4, '0')
        const workOrderNumber = `${dateKey}${sequence}`
        
        // ตรวจสอบว่าเลขที่ซ้ำหรือไม่
        const existing = await prisma.$queryRawUnsafe(`
          SELECT id FROM "WorkOrder" WHERE "workOrderNumber" = ?
        `, workOrderNumber)
        
        if (existing.length > 0) {
          // ถ้าซ้ำ ให้เพิ่ม sequence
          let newSequence = i + 1
          let newWorkOrderNumber = workOrderNumber
          while (existing.length > 0) {
            newSequence++
            newWorkOrderNumber = `${dateKey}${String(newSequence).padStart(4, '0')}`
            const check = await prisma.$queryRawUnsafe(`
              SELECT id FROM "WorkOrder" WHERE "workOrderNumber" = ?
            `, newWorkOrderNumber)
            if (check.length === 0) break
          }
          await prisma.$executeRawUnsafe(`
            UPDATE "WorkOrder" SET "workOrderNumber" = ? WHERE id = ?
          `, newWorkOrderNumber, orders[i].id)
        } else {
          await prisma.$executeRawUnsafe(`
            UPDATE "WorkOrder" SET "workOrderNumber" = ? WHERE id = ?
          `, workOrderNumber, orders[i].id)
        }
        updatedCount++
      }
    }

    console.log(`   ✅ อัพเดท workOrderNumber สำเร็จ: ${updatedCount} รายการ`)

    console.log('\n✅ Migration เสร็จสิ้น')
    console.log('💡 รันคำสั่ง: npx prisma generate')
  } catch (error) {
    console.error('\n❌ เกิดข้อผิดพลาด:', error.message)
    console.error(error)
    process.exit(1)
  }
}

main()
  .catch((e) => {
    console.error('❌ เกิดข้อผิดพลาด:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
