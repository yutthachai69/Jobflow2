require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') })
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const rows = await prisma.$queryRawUnsafe('SELECT * FROM _prisma_migrations ORDER BY started_at')
  for (const r of rows) {
    const o = {}
    for (const [k, v] of Object.entries(r)) {
      o[k] = typeof v === 'bigint' ? String(v) : v
    }
    console.log(JSON.stringify(o, null, 2))
  }
}

main()
  .finally(() => prisma.$disconnect())
  .catch((e) => { console.error(e); process.exit(1) })
