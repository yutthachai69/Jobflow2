/**
 * รัน migration add_user_locked ด้วย raw SQL (ใช้เมื่อ prisma migrate ไม่รันได้)
 * Usage: node scripts/apply-user-locked-migration.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') })
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

const statements = [
  `ALTER TABLE "User" ADD COLUMN "locked" INTEGER NOT NULL DEFAULT 0`,
  `ALTER TABLE "User" ADD COLUMN "lockedUntil" DATETIME`,
  `ALTER TABLE "User" ADD COLUMN "lockedReason" TEXT`,
  `CREATE INDEX "User_locked_lockedUntil_idx" ON "User"("locked", "lockedUntil")`,
]

async function main() {
  for (const sql of statements) {
    try {
      await prisma.$executeRawUnsafe(sql)
      console.log('OK:', sql.slice(0, 60) + '...')
    } catch (e) {
      if (e.message?.includes('duplicate column') || e.message?.includes('already exists')) {
        console.log('Skip (already applied):', sql.slice(0, 50) + '...')
      } else throw e
    }
  }
  console.log('Done.')
}

main()
  .finally(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
