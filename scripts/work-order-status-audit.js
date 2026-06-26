/**
 * ตรวจ / แก้สถานะ WorkOrder ให้สอดคล้อง JobItem (กฎเดียวกับ lib/sync-work-order-status.ts)
 *
 *   node scripts/work-order-status-audit.js           # รายงานอย่างเดียว
 *   node scripts/work-order-status-audit.js --fix     # อัปเดต WO ที่ reconcile ได้
 *
 * ใช้ DATABASE_URL จาก env (.env.local สำหรับ test DB)
 */
const { PrismaClient } = require('@prisma/client')

const LOCKED = new Set(['CANCELLED', 'WAITING_APPROVAL', 'APPROVED', 'REJECTED'])

function deriveWorkOrderStatus(statuses) {
  if (statuses.length === 0) return null
  const allDone = statuses.every((s) => s === 'DONE')
  const anyStarted = statuses.some((s) =>
    ['IN_PROGRESS', 'DONE', 'ISSUE_FOUND'].includes(s)
  )
  if (allDone) return 'COMPLETED'
  if (anyStarted) return 'IN_PROGRESS'
  return 'OPEN'
}

function assertSafeUrl(url) {
  if (!url) return
  const u = url.toLowerCase()
  if (u.includes('supabase.co') || u.includes('pooler.supabase.com')) {
    console.error('Blocked: DATABASE_URL points at Supabase. Use local test DB or set ALLOW_PRODUCTION_DATABASE=true')
    process.exit(1)
  }
}

async function main() {
  const applyFix = process.argv.includes('--fix')
  const url =
    process.env.DATABASE_URL ||
    'postgresql://postgres:postgres@localhost:5433/jobflow_test'

  if (process.env.ALLOW_PRODUCTION_DATABASE !== 'true') {
    assertSafeUrl(url)
  }

  const prisma = new PrismaClient({ datasources: { db: { url } } })

  try {
    const workOrders = await prisma.workOrder.findMany({
      select: {
        id: true,
        workOrderNumber: true,
        status: true,
        jobItems: { select: { id: true, status: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    const mismatches = []
    const lockedWithDrift = []
    let fixed = 0

    for (const wo of workOrders) {
      const itemStatuses = wo.jobItems.map((j) => j.status)
      const expected = deriveWorkOrderStatus(itemStatuses)
      if (!expected || wo.status === expected) continue

      const row = {
        id: wo.id,
        workOrderNumber: wo.workOrderNumber,
        current: wo.status,
        expected,
        jobItems: itemStatuses.reduce((acc, s) => {
          acc[s] = (acc[s] || 0) + 1
          return acc
        }, {}),
      }

      if (LOCKED.has(wo.status)) {
        lockedWithDrift.push(row)
        continue
      }

      mismatches.push(row)
      if (applyFix) {
        await prisma.workOrder.update({
          where: { id: wo.id },
          data: { status: expected },
        })
        fixed++
      }
    }

    const trapped = await prisma.jobItem.findMany({
      where: {
        status: { in: ['PENDING', 'IN_PROGRESS', 'ISSUE_FOUND'] },
        workOrder: { status: 'COMPLETED' },
      },
      select: {
        id: true,
        status: true,
        workOrder: { select: { id: true, workOrderNumber: true, status: true } },
      },
    })

    const completedButOpen = await prisma.workOrder.count({
      where: {
        status: { in: ['OPEN', 'IN_PROGRESS'] },
        jobItems: { some: {} },
        NOT: { jobItems: { some: { status: { not: 'DONE' } } } },
      },
    })

    console.log('Database:', url.replace(/:[^:@/]+@/, ':***@'))
    console.log('Work orders:', workOrders.length)
    console.log('')
    console.log('--- Reconcileable mismatches (WO status vs JobItems) ---')
    console.log('Count:', mismatches.length, applyFix ? `(fixed ${fixed})` : '(dry-run)')
    mismatches.slice(0, 25).forEach((m) => {
      console.log(
        `  ${m.workOrderNumber || m.id}: ${m.current} → ${m.expected}`,
        JSON.stringify(m.jobItems)
      )
    })
    if (mismatches.length > 25) console.log(`  ... and ${mismatches.length - 25} more`)

    console.log('')
    console.log('--- Locked workflow statuses (manual review, not auto-fixed) ---')
    console.log('Count:', lockedWithDrift.length)
    lockedWithDrift.slice(0, 10).forEach((m) => {
      console.log(
        `  ${m.workOrderNumber || m.id}: ${m.current} (expected ${m.expected})`,
        JSON.stringify(m.jobItems)
      )
    })

    console.log('')
    console.log('--- Trapped job items (active item on COMPLETED work order) ---')
    console.log('Count:', trapped.length)
    trapped.slice(0, 10).forEach((j) => {
      console.log(
        `  item ${j.id} [${j.status}] on WO ${j.workOrder.workOrderNumber || j.workOrder.id} (${j.workOrder.status})`
      )
    })

    console.log('')
    console.log('--- All JobItems DONE but WO still OPEN/IN_PROGRESS ---')
    console.log('Count:', completedButOpen)

    if (!applyFix && mismatches.length > 0) {
      console.log('')
      console.log('Run with --fix to apply reconcile on mismatches (not locked statuses).')
    }
  } finally {
    await prisma.$disconnect()
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
