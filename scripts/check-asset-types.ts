/**
 * เช็คจำนวนทรัพย์สินแยกตามประเภท (แอร์ / EXHAUST) และตาม Site
 * รัน: npx tsx scripts/check-asset-types.ts
 * ต้องมี DATABASE_URL ใน .env (ชี้ไป Supabase จะได้ข้อมูลตรงกับ production)
 */
import 'dotenv/config'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('=== จำนวนทรัพย์สินรวมทั้งระบบ ===')
  const total = await prisma.asset.count()
  console.log('รวมทั้งหมด:', total, 'รายการ\n')

  console.log('=== แยกตามประเภท (assetType) ===')
  const byType = await prisma.asset.groupBy({
    by: ['assetType'],
    _count: { id: true },
    orderBy: { _count: { id: 'desc' } },
  })
  const typeLabels: Record<string, string> = {
    AIR_CONDITIONER: 'เครื่องปรับอากาศ (แอร์)',
    EXHAUST: 'พัดลมดูดอากาศ (EXHAUST)',
    OTHER: 'อื่นๆ',
    REFRIGERANT: 'สารทำความเย็น',
    SPARE_PART: 'อะไหล่',
    TOOL: 'เครื่องมือ',
  }
  for (const row of byType) {
    const label = typeLabels[row.assetType] || row.assetType
    console.log('  ', label, ':', row._count.id, 'รายการ')
  }

  console.log('\n=== แยกตาม Site (สถานที่) — จำนวนแอร์ + EXHAUST ต่อ site ===')
  const assetsWithSite = await prisma.asset.findMany({
    select: {
      assetType: true,
      room: {
        select: {
          floor: {
            select: {
              building: {
                select: {
                  site: {
                    select: { id: true, name: true },
                  },
                },
              },
            },
          },
        },
      },
    },
  })

  type SiteCount = { siteName: string; siteId: string; air: number; exhaust: number; other: number }
  const map = new Map<string, SiteCount>()

  for (const a of assetsWithSite) {
    const site = a.room?.floor?.building?.site
    const siteId = site?.id ?? '_no_site'
    const siteName = site?.name ?? '(ไม่มีสถานที่/ข้อมูลไม่ครบ)'

    if (!map.has(siteId)) {
      map.set(siteId, { siteId, siteName, air: 0, exhaust: 0, other: 0 })
    }
    const c = map.get(siteId)!
    if (a.assetType === 'AIR_CONDITIONER') c.air++
    else if (a.assetType === 'EXHAUST') c.exhaust++
    else c.other++
  }

  const sorted = Array.from(map.values()).sort((a, b) => (b.air + b.exhaust + b.other) - (a.air + a.exhaust + a.other))
  for (const s of sorted) {
    const totalSite = s.air + s.exhaust + s.other
    console.log('  ', s.siteName)
    console.log('      แอร์:', s.air, '| EXHAUST:', s.exhaust, '| อื่นๆ:', s.other, '| รวม:', totalSite)
  }

  const noSite = assetsWithSite.filter((a) => !a.room?.floor?.building?.site).length
  if (noSite > 0) {
    console.log('\n  ⚠️  ทรัพย์สินที่ไม่มี chain สถานที่ครบ (room/floor/building/site):', noSite, 'รายการ')
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
