/**
 * เช็คข้อมูล Asset AC_289 และ chain สถานที่ (Room → Floor → Building → Site)
 * รันจากโฟลเดอร์โปรเจกต์: npx tsx scripts/check-asset-ac289.ts
 * ต้องมี DATABASE_URL ใน .env (ใช้ค่าเดียวกับที่ Vercel/Supabase ใช้จะได้ผลตรงกับ production)
 */
import 'dotenv/config'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const idOrQr = 'AC_289'

  console.log('=== 1. หา Asset โดย id หรือ qrCode ===')
  const byId = await prisma.asset.findUnique({
    where: { id: idOrQr },
    select: { id: true, qrCode: true, roomId: true, status: true },
  })
  const byQr = await prisma.asset.findUnique({
    where: { qrCode: idOrQr },
    select: { id: true, qrCode: true, roomId: true, status: true },
  })
  const asset = byId || byQr
  if (!asset) {
    console.log('ไม่พบ Asset ที่ id หรือ qrCode =', idOrQr)
    return
  }
  console.log('พบ Asset:', asset)

  const roomId = asset.roomId
  console.log('\n=== 2. เช็ค Room (id =', roomId, ') ===')
  const room = await prisma.room.findUnique({
    where: { id: roomId },
    include: {
      floor: {
        include: {
          building: {
            include: { site: true },
          },
        },
      },
    },
  })
  if (!room) {
    console.log('ไม่พบ Room id =', roomId, '→ นี่คือสาเหตุที่หน้า detail แสดง "ไม่ระบุสถานที่"')
    return
  }
  console.log('Room:', room.name, '| floorId:', room.floorId)
  console.log('Floor:', room.floor?.name, '| buildingId:', room.floor?.buildingId)
  console.log('Building:', room.floor?.building?.name, '| siteId:', room.floor?.building?.siteId)
  console.log('Site:', room.floor?.building?.site?.name)

  if (!room.floor || !room.floor.building || !room.floor.building.site) {
    console.log('\n⚠️  chain สถานที่ไม่ครบ (Floor/Building/Site เป็น null)')
  } else {
    console.log('\n✅ ข้อมูลสถานที่ครบ')
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
