/**
 * Debug: ตรวจว่า user ที่ล็อกอินอยู่ตอนนี้เป็นใคร และมี siteId หรือไม่
 * Usage: node scripts/debug-current-user.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') })
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  console.log('=== ตรวจสอบ Users ทั้งหมด ===\n')
  
  const users = await prisma.user.findMany({
    select: {
      id: true,
      username: true,
      role: true,
      siteId: true,
      site: { select: { name: true } },
    },
    orderBy: { username: 'asc' },
  })
  
  for (const u of users) {
    console.log(`Username: ${u.username}`)
    console.log(`  Role: ${u.role}`)
    console.log(`  siteId: ${u.siteId || '(null)'}`)
    console.log(`  Site: ${u.site?.name || '(ไม่มี)'}`)
    console.log('')
  }
  
  console.log('💡 ถ้าล็อกอินด้วย client1 แล้วยังเห็น "ไม่พบข้อมูลสถานที่":')
  console.log('   1. ล็อกเอาท์ (logout)')
  console.log('   2. ล็อกอินใหม่ด้วย client1 / client123')
  console.log('   3. JWT จะมี siteId ใหม่จาก DB')
}

main()
  .finally(() => prisma.$disconnect())
  .catch((e) => { console.error(e); process.exit(1) })
