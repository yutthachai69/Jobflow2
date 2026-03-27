/**
 * เพิ่มคอลัมน์ JobItem.adHocPmType บน PostgreSQL (เช่น Supabase)
 *
 * ใช้งาน:
 *   npm run db:add-adhoc-pm-type
 *
 * อ่าน DATABASE_URL จาก .env ที่รากโปรเจกต์ (ห้ามใส่รหัสในสคริปต์)
 * ถ้าใช้ Supabase pooler (พอร์ต 6543) แล้ว DDL ล้มเหลว ให้ตั้ง DATABASE_URL เป็น
 * Direct connection (พอร์ต 5432 ตามที่ Supabase แสดง) หรือรันไฟล์ .sql ใน SQL Editor
 */

const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '..', '.env') })

const { PrismaClient } = require('@prisma/client')

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error('ไม่พบ DATABASE_URL — ตั้งใน .env หรือ export ก่อนรัน')
    process.exit(1)
  }

  const prisma = new PrismaClient()

  try {
    console.log('กำลังรัน ALTER TABLE "JobItem" ... adHocPmType')
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "JobItem" ADD COLUMN IF NOT EXISTS "adHocPmType" "PMType";
    `)
    console.log('สำเร็จ: คอลัมน์ adHocPmType พร้อมใช้ (หรือมีอยู่แล้ว)')
  } finally {
    await prisma.$disconnect()
  }
}

main().catch((e) => {
  console.error(e)
  console.error(
    '\nถ้า error เกี่ยวกับ PgBouncer/transaction: ใช้ connection แบบ Direct จาก Supabase หรือรัน scripts/add-jobitem-adhoc-pm-type.sql ใน SQL Editor\n'
  )
  process.exit(1)
})
