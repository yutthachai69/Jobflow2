/**
 * อ่านอย่างเดียว — เทียบจำนวน Asset ใน DB กับตัวเลขจากชีท (ชั้น 2 = 197, ชั้น 3 = 105, รวม = 302)
 * ไม่แก้ข้อมูล
 *
 * รัน (จาก root โปรเจกต์):
 *   npx ts-node -r dotenv/config scripts/compare-phyathai-a-floors-2-3.ts
 *
 * กรองสถานที่ (ปรับได้ถ้าไม่ match):
 *   PHYATHAI_SITE_SUBSTR=พญาไท PHYATHAI_BUILDING_SUBSTR=A npx ts-node -r dotenv/config scripts/compare-phyathai-a-floors-2-3.ts
 */
import 'dotenv/config'
import { Prisma, PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const floorInclude = {
  building: {
    select: {
      name: true,
      site: { select: { id: true, name: true, client: { select: { name: true } } } },
    },
  },
} satisfies Prisma.FloorInclude

type FloorWithBuilding = Prisma.FloorGetPayload<{ include: typeof floorInclude }>

const EXPECT = { floor2: 197, floor3: 105, total: 302 }

function parseFloorNumber(floorName: string): number | null {
  const n = floorName.replace(/\s+/g, ' ').trim()
  const m1 = n.match(/ชั้น\s*(\d+)/i)
  if (m1) return parseInt(m1[1], 10)
  const m2 = n.match(/^(\d+)$/)
  if (m2) return parseInt(m2[1], 10)
  return null
}

function labelKey(assetType: string, machineType: string | null, btu: number | null): string {
  const mt = machineType ?? '(null)'
  const b = btu == null ? '(ไม่ระบุ BTU)' : `${btu.toLocaleString('en-US')} BTU`
  return `${assetType} | ${mt} | ${b}`
}

async function main() {
  const siteSub = process.env.PHYATHAI_SITE_SUBSTR ?? 'พญาไท'
  const buildingSub = process.env.PHYATHAI_BUILDING_SUBSTR ?? 'A'
  const excludeSiteSub = process.env.PHYATHAI_EXCLUDE_SITE_SUBSTR ?? 'ศรีราชา'

  const floors = (await prisma.floor.findMany({
    where: {
      name: { not: '' },
      building: {
        name: { contains: buildingSub },
        site: {
          AND: [
            {
              OR: [
                { name: { contains: siteSub } },
                { client: { name: { contains: siteSub } } },
              ],
            },
            ...(excludeSiteSub
              ? [
                  {
                    NOT: {
                      name: { contains: excludeSiteSub },
                    },
                  },
                ]
              : []),
          ],
        },
      },
    },
    include: floorInclude,
    orderBy: [{ building: { site: { name: 'asc' } } }, { building: { name: 'asc' } }, { name: 'asc' }],
  })) as FloorWithBuilding[]

  if (floors.length === 0) {
    console.log('ไม่พบชั้นใดที่ match เงื่อนไข — ลองตั้งค่า PHYATHAI_SITE_SUBSTR / PHYATHAI_BUILDING_SUBSTR')
    console.log({ siteSub, buildingSub, excludeSiteSub })
    return
  }

  console.log('--- พบ Floor ที่ตรง filter (ตัวอย่าง) ---')
  for (const f of floors.slice(0, 20)) {
    const fn = parseFloorNumber(f.name)
    console.log(
      `- floorId=${f.id} name="${f.name}" floor#=${fn ?? '?'} | site="${f.building.site.name}" client="${f.building.site.client?.name ?? ''}" building="${f.building.name}"`
    )
  }
  if (floors.length > 20) console.log(`... และอีก ${floors.length - 20} ชั้น`)

  type FloorRow = (typeof floors)[number]
  const byNumber = new Map<number, FloorRow[]>()
  for (const f of floors) {
    const num = parseFloorNumber(f.name)
    if (num == null || (num !== 2 && num !== 3)) continue
    if (!byNumber.has(num)) byNumber.set(num, [])
    byNumber.get(num)!.push(f)
  }

  if (byNumber.size === 0) {
    console.log('\nไม่มีชั้นที่ parse เลขได้เป็น 2 หรือ 3 — ตรวจชื่อชั้นใน DB แล้วปรับ logic parseFloorNumber หรือ filter')
    return
  }

  type Row = { assetType: string; machineType: string | null; btu: number | null; count: number }
  const summary: Record<'2' | '3', { total: number; rows: Row[] }> = {
    '2': { total: 0, rows: [] },
    '3': { total: 0, rows: [] },
  }

  for (const floorNum of [2, 3] as const) {
    const list = byNumber.get(floorNum)
    if (!list?.length) continue
    const floorIds = list.map((x) => x.id)

    const assets = await prisma.asset.findMany({
      where: { room: { floorId: { in: floorIds } } },
      select: { assetType: true, machineType: true, btu: true },
    })

    const agg = new Map<string, Row>()
    for (const a of assets) {
      const k = labelKey(a.assetType, a.machineType, a.btu)
      const cur = agg.get(k) ?? {
        assetType: a.assetType,
        machineType: a.machineType,
        btu: a.btu,
        count: 0,
      }
      cur.count++
      agg.set(k, cur)
    }
    const rows = [...agg.values()].sort((a, b) => b.count - a.count)
    summary[String(floorNum) as '2' | '3'] = { total: assets.length, rows }
  }

  console.log('\n========== สรุป DB (เทียบชีท) ==========')
  const t2 = summary['2'].total
  const t3 = summary['3'].total
  const sum = t2 + t3

  console.log(`ชั้น 2 (รวม floorId ที่ชื่อ parse เป็น 2 ทั้งหมดใน filter): ${t2} เครื่อง | ชีทคาด ${EXPECT.floor2} ${t2 === EXPECT.floor2 ? '✓ ตรง' : '✗ ไม่ตรง'}`)
  console.log(`ชั้น 3: ${t3} เครื่อง | ชีทคาด ${EXPECT.floor3} ${t3 === EXPECT.floor3 ? '✓ ตรง' : '✗ ไม่ตรง'}`)
  console.log(`รวม ชั้น2+3: ${sum} เครื่อง | ชีทคาด ${EXPECT.total} ${sum === EXPECT.total ? '✓ ตรง' : '✗ ไม่ตรง'}`)

  for (const floorNum of [2, 3] as const) {
    const { total, rows } = summary[String(floorNum) as '2' | '3']
    if (total === 0 && rows.length === 0) continue
    console.log(`\n--- ชั้น ${floorNum} รายละเอียดจาก DB (assetType | machineType | btu) รวม ${total} ---`)
    for (const r of rows.slice(0, 40)) {
      console.log(`  ${r.count}\t${labelKey(r.assetType, r.machineType, r.btu)}`)
    }
    if (rows.length > 40) console.log(`  ... และอีก ${rows.length - 40} กลุ่ม`)
  }

  console.log('\nหมายเหตุ: ชีทแบ่งละเอียด (Wall type / แอร์แขวน / พัดลมฯ) — ใน DB มีแค่ assetType + machineType + btu จึงไม่ตรงบรรทัดต่อบรรทัดกับชีท แต่ยอดรวมควรใกล้เคียงถ้าข้อมูล import ตรง')

  // --- ไล่ที่มาของ "ขาด 6" : อยู่ชั้นอื่นในอาคาร A หรือไม่มีใน DB เลย ---
  const buildingWhere: Prisma.BuildingWhereInput = {
    name: { contains: buildingSub },
    site: {
      AND: [
        {
          OR: [
            { name: { contains: siteSub } },
            { client: { name: { contains: siteSub } } },
          ],
        },
        ...(excludeSiteSub
          ? [
              {
                NOT: {
                  name: { contains: excludeSiteSub },
                },
              },
            ]
          : []),
      ],
    },
  }

  const floorIds23 = [...(byNumber.get(2) ?? []), ...(byNumber.get(3) ?? [])].map((x) => x.id)

  const totalBuilding = await prisma.asset.count({
    where: { room: { floor: { building: buildingWhere } } },
  })

  const totalNotOn23 = await prisma.asset.count({
    where: {
      room: {
        floor: {
          building: buildingWhere,
          id: { notIn: floorIds23 },
        },
      },
    },
  })

  const gap = EXPECT.total - sum
  console.log('\n========== ไล่ที่มาของยอดต่างจากชีท ==========')
  console.log(`รวม Asset ทั้งอาคาร A (ตาม filter เดียวกัน): ${totalBuilding} เครื่อง`)
  console.log(`รวมบนชั้น 2+3 (ตาม DB): ${sum} เครื่อง | ชีทคาด ${EXPECT.total} → ต่าง ${gap} เครื่อง`)
  console.log(`จำนวนที่อยู่ "อาคาร A แต่ไม่ใช่ชั้น 2/3": ${totalNotOn23} เครื่อง`)

  if (totalNotOn23 === gap && gap > 0) {
    console.log(`\nสรุป: ทั้ง ${gap} เครื่องน่าจะอยู่ชั้นอื่นในอาคาร A (ไม่ได้หายจาก DB) — รายการด้านล่าง:`)
    const misplaced = await prisma.asset.findMany({
      where: {
        room: {
          floor: {
            building: buildingWhere,
            id: { notIn: floorIds23 },
          },
        },
      },
      select: {
        id: true,
        qrCode: true,
        assetType: true,
        machineType: true,
        btu: true,
        room: {
          select: {
            name: true,
            floor: { select: { id: true, name: true, building: { select: { name: true } } } },
          },
        },
      },
      orderBy: [{ room: { floor: { name: 'asc' } } }, { qrCode: 'asc' }],
    })
    for (const a of misplaced) {
      const typ = labelKey(a.assetType, a.machineType, a.btu)
      const path = `${a.room.floor.building.name} / ชั้น "${a.room.floor.name}" / ห้อง "${a.room.name}"`
      console.log(`  - ${a.qrCode}\t${typ}\t${path}`)
    }
  } else if (totalNotOn23 > gap) {
    console.log(
      `\nสรุป: มีมากกว่า ${gap} เครื่องบนชั้นอื่น — ไม่สามารถชี้ว่า "6 ตัว" คือ qrCode ไหนได้จาก DB อย่างเดียว (ต้องเทียบกับชีทรายแถว)`
    )
  } else if (totalNotOn23 < gap) {
    const missingEntirely = gap - totalNotOn23
    console.log(
      `\nสรุป: บนชั้นอื่นมีแค่ ${totalNotOn23} เครื่อง แต่ขาดจากชีท ${gap} → น่าจะมีประมาณ ${missingEntirely} รายการที่ยังไม่ import ลง DB หรืออยู่ site/อาคารอื่น`
    )
  }

  console.log('\n--- ทุกชั้นในอาคาร A (จำนวน Asset ต่อชั้น) ---')
  const allFloorsA = await prisma.floor.findMany({
    where: { building: buildingWhere },
    select: {
      id: true,
      name: true,
    },
    orderBy: { name: 'asc' },
  })
  for (const fl of allFloorsA) {
    const c = await prisma.asset.count({ where: { room: { floorId: fl.id } } })
    const fn = parseFloorNumber(fl.name)
    console.log(`  floor "${fl.name}" (#${fn ?? '?'}) floorId=${fl.id} → ${c} assets`)
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
