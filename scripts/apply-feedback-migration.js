// scripts/apply-feedback-migration.js
const { PrismaClient } = require('@prisma/client')
const fs = require('fs')
const path = require('path')

const prisma = new PrismaClient()

async function main() {
  console.log('🔧 กำลังรัน migration สำหรับ Feedback และ Notification...\n')

  try {
    // เปิด foreign keys
    await prisma.$executeRawUnsafe('PRAGMA foreign_keys=ON;')
    console.log('✅ เปิด foreign keys แล้ว\n')

    // ตรวจสอบว่า table มีอยู่แล้วหรือไม่
    const checkFeedback = await prisma.$queryRawUnsafe(`
      SELECT name FROM sqlite_master WHERE type='table' AND name='Feedback'
    `)
    const checkNotification = await prisma.$queryRawUnsafe(`
      SELECT name FROM sqlite_master WHERE type='table' AND name='Notification'
    `)

    const hasFeedback = Array.isArray(checkFeedback) && checkFeedback.length > 0
    const hasNotification = Array.isArray(checkNotification) && checkNotification.length > 0

    // สร้าง Feedback table
    if (!hasFeedback) {
      console.log('📋 สร้าง Feedback table...')
      await prisma.$executeRawUnsafe(`
        CREATE TABLE "Feedback" (
          "id" TEXT NOT NULL PRIMARY KEY,
          "rating" INTEGER NOT NULL,
          "comment" TEXT,
          "workOrderId" TEXT NOT NULL,
          "clientId" TEXT NOT NULL,
          "isRead" INTEGER NOT NULL DEFAULT 0,
          "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY ("workOrderId") REFERENCES "WorkOrder" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
          FOREIGN KEY ("clientId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
        )
      `)
      console.log('✅ สร้าง Feedback table สำเร็จ')
    } else {
      console.log('⚠️  Feedback table มีอยู่แล้ว')
    }

    // สร้าง Notification table
    if (!hasNotification) {
      console.log('📋 สร้าง Notification table...')
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
          FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
        )
      `)
      console.log('✅ สร้าง Notification table สำเร็จ')
    } else {
      console.log('⚠️  Notification table มีอยู่แล้ว')
    }

    // สร้าง indexes สำหรับ Feedback
    console.log('\n📋 สร้าง indexes สำหรับ Feedback...')
    const feedbackIndexes = [
      'CREATE INDEX IF NOT EXISTS "Feedback_workOrderId_idx" ON "Feedback"("workOrderId")',
      'CREATE INDEX IF NOT EXISTS "Feedback_clientId_idx" ON "Feedback"("clientId")',
      'CREATE INDEX IF NOT EXISTS "Feedback_isRead_idx" ON "Feedback"("isRead")',
      'CREATE INDEX IF NOT EXISTS "Feedback_createdAt_idx" ON "Feedback"("createdAt")',
    ]

    for (const indexSql of feedbackIndexes) {
      try {
        await prisma.$executeRawUnsafe(indexSql)
        console.log('✅ สร้าง index สำเร็จ')
      } catch (e) {
        if (e.message.includes('already exists') || e.message.includes('duplicate')) {
          console.log('⚠️  index มีอยู่แล้ว')
        } else {
          console.error('❌ Error:', e.message)
        }
      }
    }

    // สร้าง indexes สำหรับ Notification
    console.log('\n📋 สร้าง indexes สำหรับ Notification...')
    const notificationIndexes = [
      'CREATE INDEX IF NOT EXISTS "Notification_userId_idx" ON "Notification"("userId")',
      'CREATE INDEX IF NOT EXISTS "Notification_isRead_idx" ON "Notification"("isRead")',
      'CREATE INDEX IF NOT EXISTS "Notification_createdAt_idx" ON "Notification"("createdAt")',
      'CREATE INDEX IF NOT EXISTS "Notification_type_idx" ON "Notification"("type")',
    ]

    for (const indexSql of notificationIndexes) {
      try {
        await prisma.$executeRawUnsafe(indexSql)
        console.log('✅ สร้าง index สำเร็จ')
      } catch (e) {
        if (e.message.includes('already exists') || e.message.includes('duplicate')) {
          console.log('⚠️  index มีอยู่แล้ว')
        } else {
          console.error('❌ Error:', e.message)
        }
      }
    }

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
