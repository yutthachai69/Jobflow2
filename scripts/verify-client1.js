/**
 * ตรวจว่า client1 มี siteId และ Site ครบหรือไม่
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') })
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const u = await prisma.user.findUnique({
    where: { username: 'client1' },
    select: {
      id: true,
      username: true,
      role: true,
      siteId: true,
      site: { select: { id: true, name: true } },
    },
  })
  console.log('client1:', JSON.stringify(u, null, 2))
  if (!u) {
    console.log('❌ ไม่พบ user client1 — รัน npm run db:seed:run')
    process.exit(1)
  }
  if (!u.siteId || !u.site) {
    console.log('❌ client1 ไม่มี siteId — รัน npm run db:seed:run ใหม่')
    process.exit(1)
  }
  console.log('✅ client1 มี siteId และ Site ครบ')
}

main()
  .finally(() => prisma.$disconnect())
  .catch((e) => { console.error(e); process.exit(1) })
