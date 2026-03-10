// prisma/seed.ts
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Start seeding...')

  // 1. ล้างข้อมูลเก่าทิ้งก่อน (เรียงตามลำดับเพื่อไม่ให้ติด Relation)
  await prisma.jobPhoto.deleteMany()
  await prisma.jobItem.deleteMany()
  await prisma.workOrder.deleteMany()
  await prisma.contactMessage.deleteMany()
  // หมายเหตุ: SecurityIncident ไม่มีใน migrations ปัจจุบัน — ถ้าเพิ่ม migration สร้างตารางนี้ ให้เพิ่ม deleteMany ตรงนี้
  try {
    await prisma.securityIncident.deleteMany()
  } catch {
    // ตารางยังไม่มี — ข้าม
  }
  await prisma.asset.deleteMany()
  await prisma.room.deleteMany()
  await prisma.floor.deleteMany()
  await prisma.building.deleteMany()
  await prisma.site.deleteMany()
  await prisma.client.deleteMany()
  await prisma.user.deleteMany()

  // 2. Hash passwords
  const adminPasswordHash = await bcrypt.hash('admin123', 10)
  const techPasswordHash = await bcrypt.hash('password123', 10)
  const clientPasswordHash = await bcrypt.hash('client123', 10)

  // 3. สร้าง User (Admin, ช่าง, ลูกค้า)
  const adminUser = await prisma.user.create({
    data: {
      username: 'admin',
      password: adminPasswordHash,
      fullName: 'ผู้ดูแลระบบ',
      role: 'ADMIN'
    }
  })

  const techUser = await prisma.user.create({
    data: {
      username: 'tech1',
      password: techPasswordHash,
      fullName: 'สมชาย งานดี',
      role: 'TECHNICIAN'
    }
  })

  // 3. สร้างลูกค้า (Client)
  const client = await prisma.client.create({
    data: {
      name: 'Grand Hotel Group',
      contactInfo: '02-999-9999'
    }
  })

  // 4. สร้างสาขา (Site)
  const site = await prisma.site.create({
    data: {
      name: 'สาขาสุขุมวิท',
      clientId: client.id,
      address: 'สุขุมวิท 21 กทม.'
    }
  })

  // สร้าง User สำหรับลูกค้า (ผูกกับ Site)
  const clientUser = await prisma.user.create({
    data: {
      username: 'client1',
      password: clientPasswordHash, // Fixed: ใช้ hashed password
      fullName: 'ผู้จัดการสาขาสุขุมวิท',
      role: 'CLIENT',
      siteId: site.id  // ผูกกับ Site แทน Client
    }
  })

  // 5. สร้างตึก (Building)
  const building = await prisma.building.create({
    data: {
      name: 'อาคาร A (Main Wing)',
      siteId: site.id
    }
  })

  // 6. สร้างชั้น (Floors)
  const floor1 = await prisma.floor.create({
    data: { name: 'ชั้น 1 Lobby', buildingId: building.id }
  })
  const floor2 = await prisma.floor.create({
    data: { name: 'ชั้น 2 Meeting', buildingId: building.id }
  })

  // 7. สร้างห้อง (Rooms)
  const roomLobby = await prisma.room.create({
    data: { name: 'Lobby Hall', floorId: floor1.id }
  })
  const roomServer = await prisma.room.create({
    data: { name: 'Server Room', floorId: floor1.id }
  })

  // 8. สร้างทรัพย์สิน (Assets) - 50 รายการคละประเภท
  const airBrands = ['Daikin', 'Carrier', 'Mitsubishi', 'LG', 'Samsung', 'Toshiba', 'Panasonic', 'Hitachi']
  const refrigerantBrands = ['R-410A', 'R-22', 'R-32', 'R-134a', 'R-407C']
  const sparePartTypes = ['Filter', 'Compressor', 'Fan Motor', 'Capacitor', 'Thermostat', 'Coil', 'Drain Pan']
  const toolTypes = ['Vacuum Pump', 'Gauges Set', 'Refrigerant Scale', 'Leak Detector', 'Multimeter', 'Drill', 'Wrench Set']
  
  const assetTypes = ['AIR_CONDITIONER', 'REFRIGERANT', 'SPARE_PART', 'TOOL', 'OTHER'] as const
  const statuses = ['ACTIVE', 'ACTIVE', 'ACTIVE', 'ACTIVE', 'BROKEN', 'RETIRED'] as const
  const btuRanges = [12000, 18000, 24000, 30000, 36000]
  
  const rooms = [roomLobby, roomServer]
  
  // สร้าง 50 รายการ
  for (let i = 1; i <= 50; i++) {
    const assetType = assetTypes[Math.floor(Math.random() * assetTypes.length)]
    const status = statuses[Math.floor(Math.random() * statuses.length)]
    const randomRoom = rooms[Math.floor(Math.random() * rooms.length)]
    
    let qrCode = ''
    let btu: number | null = null
    
    if (assetType === 'AIR_CONDITIONER') {
      // เครื่องปรับอากาศ - ต้องมี QR Code
      qrCode = `AC-2024-${String(i).padStart(3, '0')}`
      btu = btuRanges[Math.floor(Math.random() * btuRanges.length)]
    } else if (assetType === 'REFRIGERANT') {
      // น้ำยาแอร์ - ไม่มี QR Code
      qrCode = `REF-2024-${String(i).padStart(3, '0')}`
    } else if (assetType === 'SPARE_PART') {
      // อะไหล่ - ไม่มี QR Code
      qrCode = `PART-2024-${String(i).padStart(3, '0')}`
    } else if (assetType === 'TOOL') {
      // เครื่องมือ - ไม่มี QR Code
      qrCode = `TOOL-2024-${String(i).padStart(3, '0')}`
    } else {
      // อื่นๆ - ไม่มี QR Code
      qrCode = `OTHER-2024-${String(i).padStart(3, '0')}`
    }
    
    // สุ่มวันที่ติดตั้ง (เฉพาะเครื่องปรับอากาศ)
    const installDate = assetType === 'AIR_CONDITIONER' && Math.random() > 0.3
      ? (() => {
          const date = new Date()
          date.setFullYear(date.getFullYear() - Math.floor(Math.random() * 3))
          date.setMonth(Math.floor(Math.random() * 12))
          date.setDate(Math.floor(Math.random() * 28) + 1)
          return date
        })()
      : null
    
    await prisma.asset.create({
      data: {
        qrCode,
        assetType: assetType as any,
        btu,
        installDate,
        status: status as any,
        roomId: randomRoom.id
      }
    })
  }

  // 9. สร้างข้อมูลการติดต่อ (Contact Info)
  const existingContactInfo = await prisma.contactInfo.findFirst()
  if (!existingContactInfo) {
    await prisma.contactInfo.create({
      data: {
        email: 'support@airservice.com',
        phone: '02-XXX-XXXX',
        hours: 'จันทร์-ศุกร์ 08:00-17:00 น.',
      },
    })
  }

  console.log('✅ Seeding finished.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })