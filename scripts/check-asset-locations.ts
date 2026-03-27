/**
 * เช็คว่าทรัพย์สิน (แอร์ / EXHAUST) อยู่ที่ไหนบ้าง — แยกตาม Site > อาคาร > ชั้น > ห้อง
 * รัน: npx tsx scripts/check-asset-locations.ts
 */
import 'dotenv/config'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

type Counts = { air: number; exhaust: number; other: number }
function empty(): Counts {
  return { air: 0, exhaust: 0, other: 0 }
}
function add(c: Counts, assetType: string) {
  if (assetType === 'AIR_CONDITIONER') c.air++
  else if (assetType === 'EXHAUST') c.exhaust++
  else c.other++
}
function total(c: Counts) {
  return c.air + c.exhaust + c.other
}

async function main() {
  const assets = await prisma.asset.findMany({
    select: {
      assetType: true,
      room: {
        select: {
          id: true,
          name: true,
          floor: {
            select: {
              id: true,
              name: true,
              building: {
                select: {
                  id: true,
                  name: true,
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
    orderBy: [{ room: { floor: { building: { site: { name: 'asc' } } } } }, { room: { floor: { building: { name: 'asc' } } } }, { room: { floor: { name: 'asc' } } }, { room: { name: 'asc' } }],
  })

  // Group by site -> building -> floor -> room
  type SiteKey = string
  type BuildingKey = string
  type FloorKey = string
  type RoomKey = string
  const siteMap = new Map<SiteKey, { name: string; buildings: Map<BuildingKey, { name: string; floors: Map<FloorKey, { name: string; rooms: Map<RoomKey, { name: string; counts: Counts }> }> }> }>()

  for (const a of assets) {
    const room = a.room
    const floor = room?.floor
    const building = floor?.building
    const site = building?.site

    const siteId = site?.id ?? '_no_site'
    const siteName = site?.name ?? '(ไม่มีสถานที่)'
    const buildingId = building?.id ?? '_no_building'
    const buildingName = building?.name ?? '(ไม่ระบุอาคาร)'
    const floorId = floor?.id ?? '_no_floor'
    const floorName = floor?.name ?? '(ไม่ระบุชั้น)'
    const roomId = room?.id ?? '_no_room'
    const roomName = room?.name ?? '(ไม่ระบุห้อง)'

    if (!siteMap.has(siteId)) {
      siteMap.set(siteId, { name: siteName, buildings: new Map() })
    }
    const s = siteMap.get(siteId)!

    if (!s.buildings.has(buildingId)) {
      s.buildings.set(buildingId, { name: buildingName, floors: new Map() })
    }
    const b = s.buildings.get(buildingId)!

    if (!b.floors.has(floorId)) {
      b.floors.set(floorId, { name: floorName, rooms: new Map() })
    }
    const f = b.floors.get(floorId)!

    if (!f.rooms.has(roomId)) {
      f.rooms.set(roomId, { name: roomName, counts: empty() })
    }
    add(f.rooms.get(roomId)!.counts, a.assetType)
  }

  console.log('=== ที่อยู่ทรัพย์สิน (Site > อาคาร > ชั้น > ห้อง) ===\n')

  for (const [siteId, site] of siteMap) {
    let siteAir = 0, siteExhaust = 0, siteOther = 0
    console.log('📍', site.name)

    const buildings = Array.from(site.buildings.entries()).sort((x, y) => x[1].name.localeCompare(y[1].name))
    for (const [, building] of buildings) {
      let buildAir = 0, buildExhaust = 0, buildOther = 0
      console.log('   🏢', building.name)

      const floors = Array.from(building.floors.entries()).sort((x, y) => x[1].name.localeCompare(y[1].name))
      for (const [, floor] of floors) {
        let floorAir = 0, floorExhaust = 0, floorOther = 0
        const roomLines: string[] = []

        const rooms = Array.from(floor.rooms.entries()).sort((x, y) => x[1].name.localeCompare(y[1].name))
        for (const [, room] of rooms) {
          const c = room.counts
          floorAir += c.air
          floorExhaust += c.exhaust
          floorOther += c.other
          const t = total(c)
          if (t > 0) {
            roomLines.push(`      🚪 ${room.name}: แอร์ ${c.air} | EXHAUST ${c.exhaust}${c.other ? ` | อื่นๆ ${c.other}` : ''} (รวม ${t})`)
          }
        }
        floorAir && (buildAir += floorAir)
        floorExhaust && (buildExhaust += floorExhaust)
        floorOther && (buildOther += floorOther)
        const ft = floorAir + floorExhaust + floorOther
        if (ft > 0) {
          console.log('      📐', floor.name, `— แอร์ ${floorAir} | EXHAUST ${floorExhaust}${floorOther ? ` | อื่นๆ ${floorOther}` : ''} (รวม ${ft})`)
          roomLines.forEach((line) => console.log(line))
        }
      }
      siteAir += buildAir
      siteExhaust += buildExhaust
      siteOther += buildOther
      const bt = buildAir + buildExhaust + buildOther
      if (bt > 0) {
        console.log('      [รวมอาคารนี้] แอร์', buildAir, '| EXHAUST', buildExhaust, '| รวม', bt)
      }
    }
    const st = siteAir + siteExhaust + siteOther
    console.log('   [รวม Site นี้] แอร์', siteAir, '| EXHAUST', siteExhaust, '| อื่นๆ', siteOther, '| รวม', st)
    console.log('')
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
