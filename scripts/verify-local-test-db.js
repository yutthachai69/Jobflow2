/**
 * Quick sanity check after db:test:sync — counts core tables on localhost:5433.
 */
const { PrismaClient } = require('@prisma/client')

const url =
  process.env.DATABASE_URL ||
  'postgresql://postgres:postgres@localhost:5433/jobflow_test'

async function main() {
  const prisma = new PrismaClient({ datasources: { db: { url } } })
  try {
    const [users, assets, workOrders, jobItems] = await Promise.all([
      prisma.user.count(),
      prisma.asset.count(),
      prisma.workOrder.count(),
      prisma.jobItem.count(),
    ])
    console.log('Local test DB:', url.replace(/:[^:@/]+@/, ':***@'))
    console.log({ users, assets, workOrders, jobItems })
    if (users === 0 && assets === 0) {
      console.error('WARN: tables look empty — run npm run db:test:sync first')
      process.exit(1)
    }
    console.log('OK')
  } finally {
    await prisma.$disconnect()
  }
}

main().catch((e) => {
  console.error(e.message || e)
  process.exit(1)
})
