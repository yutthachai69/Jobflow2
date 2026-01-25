// scripts/add-50-assets.ts
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🚀 เริ่มเพิ่มทรัพย์สิน 50 รายการ...')

  // 1. ดึง Rooms ทั้งหมดที่มีอยู่
  const rooms = await prisma.room.findMany({
    include: {
      floor: {
        include: {
          building: {
            include: {
              site: true,
            },
          },
        },
      },
    },
  })

  if (rooms.length === 0) {
    console.error('❌ ไม่พบ Room ในระบบ กรุณา seed ข้อมูลพื้นฐานก่อน')
    process.exit(1)
  }

  console.log(`📦 พบ ${rooms.length} ห้อง`)

  // 2. ข้อมูลสำหรับสร้าง Assets
  const airBrands = ['Daikin', 'Carrier', 'Mitsubishi', 'LG', 'Samsung', 'Toshiba', 'Panasonic', 'Hitachi', 'Fujitsu', 'York']
  const refrigerantBrands = ['R-410A', 'R-22', 'R-32', 'R-134a', 'R-407C', 'R-404A']
  const sparePartTypes = ['Filter', 'Compressor', 'Fan Motor', 'Capacitor', 'Thermostat', 'Coil', 'Drain Pan', 'Expansion Valve']
  const toolTypes = ['Vacuum Pump', 'Gauges Set', 'Refrigerant Scale', 'Leak Detector', 'Multimeter', 'Drill', 'Wrench Set', 'Torch Kit']
  
  const assetTypes = ['AIR_CONDITIONER', 'REFRIGERANT', 'SPARE_PART', 'TOOL', 'OTHER'] as const
  const statuses = ['ACTIVE', 'ACTIVE', 'ACTIVE', 'ACTIVE', 'BROKEN', 'RETIRED'] as const
  const btuRanges = [12000, 18000, 24000, 30000, 36000]
  
  // 3. นับจำนวน asset ที่มีอยู่แล้ว
  const existingCount = await prisma.asset.count()
  const startIndex = existingCount + 1
  
  console.log(`📊 มีทรัพย์สินอยู่แล้ว ${existingCount} รายการ จะเริ่มจากหมายเลข ${startIndex}`)

  // 4. สร้าง 50 รายการ
  const assets = []
  for (let i = 0; i < 50; i++) {
    const assetIndex = startIndex + i
    const assetType = assetTypes[Math.floor(Math.random() * assetTypes.length)]
    const status = statuses[Math.floor(Math.random() * statuses.length)]
    const randomRoom = rooms[Math.floor(Math.random() * rooms.length)]
    
    let qrCode = ''
    let brand: string | null = null
    let model: string | null = null
    let serialNo: string | null = null
    let btu: number | null = null
    
    if (assetType === 'AIR_CONDITIONER') {
      // เครื่องปรับอากาศ - ต้องมี QR Code
      qrCode = `AC-2024-${String(assetIndex).padStart(3, '0')}`
      brand = airBrands[Math.floor(Math.random() * airBrands.length)]
      model = `Model-${['X', 'Y', 'Z'][Math.floor(Math.random() * 3)]}${Math.floor(Math.random() * 10) + 1}`
      serialNo = `SN-${brand.substring(0, 3).toUpperCase()}-${String(assetIndex).padStart(5, '0')}`
      btu = btuRanges[Math.floor(Math.random() * btuRanges.length)]
    } else if (assetType === 'REFRIGERANT') {
      // น้ำยาแอร์ - ไม่มี QR Code
      qrCode = `REF-2024-${String(assetIndex).padStart(3, '0')}`
      brand = refrigerantBrands[Math.floor(Math.random() * refrigerantBrands.length)]
      model = `${brand} ${Math.floor(Math.random() * 5) + 1}kg`
      serialNo = `REF-${String(assetIndex).padStart(5, '0')}`
    } else if (assetType === 'SPARE_PART') {
      // อะไหล่ - ไม่มี QR Code
      qrCode = `PART-2024-${String(assetIndex).padStart(3, '0')}`
      const partType = sparePartTypes[Math.floor(Math.random() * sparePartTypes.length)]
      brand = partType
      model = `Size-${['S', 'M', 'L', 'XL'][Math.floor(Math.random() * 4)]}`
      serialNo = `PART-${String(assetIndex).padStart(5, '0')}`
    } else if (assetType === 'TOOL') {
      // เครื่องมือ - ไม่มี QR Code
      qrCode = `TOOL-2024-${String(assetIndex).padStart(3, '0')}`
      const toolType = toolTypes[Math.floor(Math.random() * toolTypes.length)]
      brand = toolType
      model = `Pro-${Math.floor(Math.random() * 10) + 1}`
      serialNo = `TOOL-${String(assetIndex).padStart(5, '0')}`
    } else {
      // อื่นๆ - ไม่มี QR Code
      qrCode = `OTHER-2024-${String(assetIndex).padStart(3, '0')}`
      brand = 'Generic'
      model = `Item-${assetIndex}`
      serialNo = `OTH-${String(assetIndex).padStart(5, '0')}`
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
    
    assets.push({
      qrCode,
      assetType: assetType as any,
      brand,
      model,
      serialNo,
      btu,
      installDate,
      status: status as any,
      roomId: randomRoom.id
    })
  }

  // 5. สร้าง Assets แบบ batch
  try {
    await prisma.asset.createMany({
      data: assets,
      skipDuplicates: true
    })
    console.log(`✅ เพิ่มทรัพย์สินสำเร็จ: ${assets.length} รายการ`)
  } catch (error: any) {
    console.log(`⚠️  พบ qrCode ซ้ำ สร้างทีละตัว...`)
    let created = 0
    for (const asset of assets) {
      try {
        await prisma.asset.create({ data: asset })
        created++
      } catch (e: any) {
        if (e.code !== 'P2002') {
          throw e
        }
      }
    }
    console.log(`✅ เพิ่มทรัพย์สินสำเร็จ: ${created}/${assets.length} รายการ`)
  }

  // 6. แสดงสรุป
  const totalCount = await prisma.asset.count()
  const stats = await prisma.asset.groupBy({
    by: ['assetType'],
    _count: true,
  })

  console.log('\n📊 สรุป:')
  console.log(`   ✅ จำนวนทรัพย์สินทั้งหมด: ${totalCount} รายการ`)
  console.log('\n📈 ประเภททรัพย์สิน:')
  stats.forEach((stat) => {
    const typeLabels: Record<string, string> = {
      'AIR_CONDITIONER': 'เครื่องปรับอากาศ',
      'REFRIGERANT': 'น้ำยาแอร์',
      'SPARE_PART': 'อะไหล่',
      'TOOL': 'เครื่องมือ',
      'OTHER': 'อื่นๆ',
    }
    console.log(`   ${typeLabels[stat.assetType] || stat.assetType}: ${stat._count} รายการ`)
  })
}

main()
  .catch((e) => {
    console.error('❌ เกิดข้อผิดพลาด:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
