// scripts/sync-database-schema.js
// Sync database schema without losing data
const { PrismaClient } = require('@prisma/client')
const fs = require('fs')
const path = require('path')

const prisma = new PrismaClient()

async function main() {
  console.log('🔧 กำลัง sync database schema...\n')

  try {
    // เปิด foreign keys
    await prisma.$executeRawUnsafe('PRAGMA foreign_keys=ON;')
    console.log('✅ เปิด foreign keys แล้ว\n')

    // 1. ตรวจสอบและสร้าง Feedback table
    console.log('📋 ตรวจสอบ Feedback table...')
    const checkFeedback = await prisma.$queryRawUnsafe(`
      SELECT name FROM sqlite_master WHERE type='table' AND name='Feedback'
    `)
    
    if (checkFeedback.length === 0) {
      console.log('   สร้าง Feedback table...')
      await prisma.$executeRawUnsafe(`
        CREATE TABLE "Feedback" (
          "id" TEXT NOT NULL PRIMARY KEY,
          "rating" INTEGER NOT NULL,
          "comment" TEXT,
          "workOrderId" TEXT NOT NULL,
          "clientId" TEXT NOT NULL,
          "isRead" INTEGER NOT NULL DEFAULT 0,
          "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY ("workOrderId") REFERENCES "WorkOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE,
          FOREIGN KEY ("clientId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
        )
      `)
      console.log('   ✅ สร้าง Feedback table สำเร็จ')
    } else {
      console.log('   ⚠️  Feedback table มีอยู่แล้ว')
    }

    // 2. ตรวจสอบและสร้าง Notification table
    console.log('\n📋 ตรวจสอบ Notification table...')
    const checkNotification = await prisma.$queryRawUnsafe(`
      SELECT name FROM sqlite_master WHERE type='table' AND name='Notification'
    `)
    
    if (checkNotification.length === 0) {
      console.log('   สร้าง Notification table...')
      await prisma.$executeRawUnsafe(`
        CREATE TABLE "Notification" (
          "id" TEXT NOT NULL PRIMARY KEY,
          "type" TEXT NOT NULL,
          "title" TEXT NOT NULL,
          "message" TEXT NOT NULL,
          "userId" TEXT NOT NULL,
          "isRead" INTEGER NOT NULL DEFAULT 0,
          "relatedId" TEXT,
          "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
        )
      `)
      console.log('   ✅ สร้าง Notification table สำเร็จ')
    } else {
      console.log('   ⚠️  Notification table มีอยู่แล้ว')
    }

    // 3. เพิ่ม indexes สำหรับ Feedback
    console.log('\n📋 เพิ่ม indexes สำหรับ Feedback...')
    const feedbackIndexes = [
      { name: 'Feedback_createdAt_idx', sql: 'CREATE INDEX IF NOT EXISTS "Feedback_createdAt_idx" ON "Feedback"("createdAt")' },
      { name: 'Feedback_isRead_idx', sql: 'CREATE INDEX IF NOT EXISTS "Feedback_isRead_idx" ON "Feedback"("isRead")' },
      { name: 'Feedback_clientId_idx', sql: 'CREATE INDEX IF NOT EXISTS "Feedback_clientId_idx" ON "Feedback"("clientId")' },
      { name: 'Feedback_workOrderId_idx', sql: 'CREATE INDEX IF NOT EXISTS "Feedback_workOrderId_idx" ON "Feedback"("workOrderId")' },
    ]

    for (const idx of feedbackIndexes) {
      try {
        await prisma.$executeRawUnsafe(idx.sql)
        console.log(`   ✅ สร้าง index ${idx.name} สำเร็จ`)
      } catch (e) {
        if (e.message.includes('already exists') || e.message.includes('duplicate')) {
          console.log(`   ⚠️  index ${idx.name} มีอยู่แล้ว`)
        } else {
          throw e
        }
      }
    }

    // 4. เพิ่ม indexes สำหรับ Notification
    console.log('\n📋 เพิ่ม indexes สำหรับ Notification...')
    const notificationIndexes = [
      { name: 'Notification_type_idx', sql: 'CREATE INDEX IF NOT EXISTS "Notification_type_idx" ON "Notification"("type")' },
      { name: 'Notification_createdAt_idx', sql: 'CREATE INDEX IF NOT EXISTS "Notification_createdAt_idx" ON "Notification"("createdAt")' },
      { name: 'Notification_isRead_idx', sql: 'CREATE INDEX IF NOT EXISTS "Notification_isRead_idx" ON "Notification"("isRead")' },
      { name: 'Notification_userId_idx', sql: 'CREATE INDEX IF NOT EXISTS "Notification_userId_idx" ON "Notification"("userId")' },
    ]

    for (const idx of notificationIndexes) {
      try {
        await prisma.$executeRawUnsafe(idx.sql)
        console.log(`   ✅ สร้าง index ${idx.name} สำเร็จ`)
      } catch (e) {
        if (e.message.includes('already exists') || e.message.includes('duplicate')) {
          console.log(`   ⚠️  index ${idx.name} มีอยู่แล้ว`)
        } else {
          throw e
        }
      }
    }

    // 5. ตรวจสอบและเพิ่ม workOrderNumber column
    console.log('\n📋 ตรวจสอบ workOrderNumber column...')
    const checkColumn = await prisma.$queryRawUnsafe(`
      SELECT sql FROM sqlite_master WHERE type='table' AND name='WorkOrder'
    `)
    
    const tableSql = checkColumn[0]?.sql || ''
    const hasWorkOrderNumber = tableSql.includes('workOrderNumber')

    if (!hasWorkOrderNumber) {
      console.log('   เพิ่ม workOrderNumber column...')
      await prisma.$executeRawUnsafe(`
        ALTER TABLE "WorkOrder" ADD COLUMN "workOrderNumber" TEXT
      `)
      console.log('   ✅ เพิ่ม workOrderNumber column สำเร็จ')
    } else {
      console.log('   ⚠️  workOrderNumber column มีอยู่แล้ว')
    }

    // 6. เพิ่ม indexes สำหรับ WorkOrder.workOrderNumber
    console.log('\n📋 เพิ่ม indexes สำหรับ WorkOrder.workOrderNumber...')
    const workOrderIndexes = [
      { name: 'WorkOrder_workOrderNumber_key', sql: 'CREATE UNIQUE INDEX IF NOT EXISTS "WorkOrder_workOrderNumber_key" ON "WorkOrder"("workOrderNumber")' },
      { name: 'WorkOrder_workOrderNumber_idx', sql: 'CREATE INDEX IF NOT EXISTS "WorkOrder_workOrderNumber_idx" ON "WorkOrder"("workOrderNumber")' },
    ]

    for (const idx of workOrderIndexes) {
      try {
        await prisma.$executeRawUnsafe(idx.sql)
        console.log(`   ✅ สร้าง index ${idx.name} สำเร็จ`)
      } catch (e) {
        if (e.message.includes('already exists') || e.message.includes('duplicate')) {
          console.log(`   ⚠️  index ${idx.name} มีอยู่แล้ว`)
        } else {
          throw e
        }
      }
    }

    console.log('\n✅ Sync database schema เสร็จสิ้น')
    console.log('💡 รันคำสั่ง: npx prisma migrate resolve --applied <migration-name>')
    console.log('   หรือ: npx prisma migrate resolve --applied $(Get-Content prisma/migrations/migration_lock.toml | Select-String "provider" | ForEach-Object { $_.Line })')
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
