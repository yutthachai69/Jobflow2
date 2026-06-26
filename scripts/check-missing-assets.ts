/**
 * ตรวจสอบ asset ที่อาจจะหายไปใน Supabase
 * รัน: ALLOW_PRODUCTION_DATABASE=true npx ts-node --compiler-options '{"module":"CommonJS"}' scripts/check-missing-assets.ts
 */

process.env.ALLOW_PRODUCTION_DATABASE = 'true'

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// QR code ที่สงสัยว่าหาย (จากรูป Excel คอลัมน์ E แถว 96, 97, 98)
const SUSPECT_QR_CODES = ['96', '97', '98']

// หรือ search ด้วย pattern ชื่อห้อง
const SUSPECT_ROOM_PATTERNS = ['ICU8', 'ICU10']

async function main() {
  console.log('🔍 เช็ค asset ที่อาจหายไปใน Supabase...\n')

  // 1. เช็ค QR codes ตรงๆ
  console.log('=== เช็ค QR Code:', SUSPECT_QR_CODES.join(', '), '===')
  const foundByQr = await prisma.asset.findMany({
    where: { qrCode: { in: SUSPECT_QR_CODES } },
    include: {
      room: {
        include: {
          floor: {
            include: {
              building: {
                include: { site: { include: { client: true } } },
              },
            },
          },
        },
      },
    },
  })

  if (foundByQr.length === 0) {
    console.log('❌ ไม่พบ QR codes เหล่านี้เลย\n')
  } else {
    console.log(`✅ พบ ${foundByQr.length} asset:`)
    for (const a of foundByQr) {
      const loc = [
        a.room.floor.building.site.client.name,
        a.room.floor.building.site.name,
        a.room.floor.building.name,
        a.room.floor.name,
        a.room.name,
      ].join(' > ')
      console.log(`  QR: ${a.qrCode} | ${loc} | type: ${a.assetType} | status: ${a.status}`)
    }
    console.log()
  }

  const missingQr = SUSPECT_QR_CODES.filter(qr => !foundByQr.some(a => a.qrCode === qr))
  if (missingQr.length > 0) {
    console.log('❌ QR ที่หาย:', missingQr.join(', '), '\n')
  }

  // 2. เช็คแบบ range รอบๆ เผื่อ QR format ต่างกัน
  console.log('=== เช็ค QR ช่วง 90-100 (ดูบริบทรอบๆ) ===')
  const allNearby = await prisma.asset.findMany({
    where: {
      qrCode: {
        in: Array.from({ length: 11 }, (_, i) => String(90 + i)),
      },
    },
    orderBy: { qrCode: 'asc' },
    include: { room: { include: { floor: { include: { building: true } } } } },
  })
  if (allNearby.length === 0) {
    console.log('⚠️  ไม่พบ asset QR 90-100 เลย (QR อาจมี prefix เช่น EX-, AC-)\n')
  } else {
    console.log('QR ที่มีอยู่ในช่วงนี้:')
    for (const a of allNearby) {
      const room = `${a.room.floor.building.name} > ${a.room.floor.name} > ${a.room.name}`
      console.log(`  ${a.qrCode} | ${room}`)
    }
    const existingQrs = new Set(allNearby.map(a => a.qrCode))
    const missing = Array.from({ length: 11 }, (_, i) => String(90 + i)).filter(q => !existingQrs.has(q))
    if (missing.length > 0) console.log('❌ หายในช่วงนี้:', missing.join(', '))
    console.log()
  }

  // 3. เช็คด้วยชื่อห้อง ICU8 / ICU10
  console.log('=== เช็คชื่อห้อง ICU8 และ ICU10 ===')
  const byRoom = await prisma.asset.findMany({
    where: {
      room: {
        name: { in: ['ICU8', 'ICU10', 'ICU 8', 'ICU 10'] },
      },
    },
    include: { room: { include: { floor: { include: { building: true } } } } },
    orderBy: { qrCode: 'asc' },
  })
  if (byRoom.length === 0) {
    console.log('❌ ไม่พบ asset ในห้อง ICU8 หรือ ICU10\n')
  } else {
    console.log(`✅ พบ ${byRoom.length} asset:`)
    for (const a of byRoom) {
      console.log(`  QR: ${a.qrCode} | ห้อง: ${a.room.name} | ชั้น: ${a.room.floor.name} | อาคาร: ${a.room.floor.building.name} | type: ${a.assetType}`)
    }
  }

  // 4. นับ asset ในแต่ละห้อง ICU ทั้งหมด (เพื่อหา pattern)
  console.log('\n=== สรุปจำนวน asset ต่อห้อง ICU ===')
  const icuRooms = await prisma.room.findMany({
    where: { name: { startsWith: 'ICU' } },
    include: {
      assets: { select: { qrCode: true } },
      floor: { include: { building: { include: { site: { include: { client: true } } } } } },
    },
    orderBy: { name: 'asc' },
  })
  for (const room of icuRooms) {
    const site = room.floor.building.site.name
    const qrs = room.assets.map(a => a.qrCode).join(', ') || '-'
    console.log(`  ${room.name} (${site}): ${room.assets.length} เครื่อง | QR: ${qrs}`)
  }

  await prisma.$disconnect()
}

main().catch(e => {
  console.error(e)
  prisma.$disconnect()
  process.exit(1)
})
