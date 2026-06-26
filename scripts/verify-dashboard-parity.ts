/**
 * เทียบตัวเลขแดชบอร์ดตาม role / ขอบเขตไซต์
 * รัน: npx ts-node --compiler-options "{\"module\":\"CommonJS\"}" scripts/verify-dashboard-parity.ts
 */
import { PrismaClient } from '@prisma/client'
import { getDashboardJobItemStats, startOfLocalDay } from '../lib/dashboard-job-stats'

const prisma = new PrismaClient()

async function clientLegacyStats(siteId: string) {
  const site = await prisma.site.findUnique({
    where: { id: siteId },
    include: {
      buildings: {
        include: {
          floors: {
            include: {
              rooms: {
                include: {
                  assets: { include: { jobItems: true } },
                },
              },
            },
          },
        },
      },
    },
  })
  if (!site) return null

  const allAssets = site.buildings.flatMap((b) =>
    b.floors.flatMap((f) => f.rooms.flatMap((r) => r.assets))
  )
  const inProgressJobItems = allAssets.flatMap((a) =>
    a.jobItems.filter((ji) => ji.status === 'IN_PROGRESS' || ji.status === 'PENDING')
  )
  const completedTodayLegacy = allAssets.flatMap((a) =>
    a.jobItems.filter(
      (ji) =>
        ji.status === 'DONE' &&
        ji.endTime &&
        new Date(ji.endTime).toDateString() === new Date().toDateString()
    )
  )
  const totalDoneLegacy = allAssets.flatMap((a) =>
    a.jobItems.filter((ji) => ji.status === 'DONE')
  )

  return {
    active: inProgressJobItems.length,
    completedToday: completedTodayLegacy.length,
    totalDone: totalDoneLegacy.length,
  }
}

async function main() {
  const sites = await prisma.site.findMany({ select: { id: true, name: true }, orderBy: { name: 'asc' } })
  const globalStats = await getDashboardJobItemStats(prisma)

  console.log('=== ภาพรวมทั้งระบบ (Admin ไม่กรองไซต์ = Technician การ์ดใหญ่) ===')
  console.log(globalStats)
  console.log()

  for (const site of sites) {
    const unified = await getDashboardJobItemStats(prisma, site.id)
    const legacy = await clientLegacyStats(site.id)
    const dayStart = startOfLocalDay()

    const issueFound = await prisma.jobItem.count({
      where: {
        status: 'ISSUE_FOUND',
        workOrder: { siteId: site.id },
      },
    })

    const doneNoEndTime = await prisma.jobItem.count({
      where: {
        status: 'DONE',
        endTime: null,
        workOrder: { siteId: site.id },
      },
    })

    const mismatch =
      legacy &&
      (legacy.active !== unified.activeJobItems ||
        legacy.completedToday !== unified.completedToday ||
        legacy.totalDone !== unified.totalDone)

    console.log(`--- ${site.name} (${site.id}) ---`)
    console.log('  unified (ควรใช้ร่วมกัน):', unified)
    if (legacy) {
      console.log('  client เดิม (PENDING+IN_PROGRESS เท่านั้น):', legacy)
      if (mismatch) console.log('  ⚠️  client เดิม ≠ unified')
    }
    if (issueFound > 0) {
      console.log(`  ISSUE_FOUND ในไซต์ (รวมในแอดมิน ไม่รวมใน client เดิม): ${issueFound}`)
    }
    if (doneNoEndTime > 0) {
      console.log(`  DONE แต่ไม่มี endTime (ไม่นับใน "เสร็จวันนี้"): ${doneNoEndTime}`)
    }
    console.log()
  }

  const techs = await prisma.user.findMany({
    where: { role: 'TECHNICIAN' },
    select: { id: true, username: true, fullName: true },
    take: 5,
  })
  console.log('=== ช่าง (ตัวอย่าง 5 คน) — ของตัวเอง vs ทั้งระบบ ===')
  for (const t of techs) {
    const personal = await getDashboardJobItemStats(prisma, { technicianId: t.id })
    console.log(
      `  ${t.fullName || t.username}: personal done=${personal.totalDone}, in-progress(active)=${personal.activeJobItems} | system done=${globalStats.totalDone}`
    )
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
