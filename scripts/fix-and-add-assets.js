// scripts/fix-and-add-assets.js
const { PrismaClient } = require('@prisma/client')
const { execSync } = require('child_process')

const prisma = new PrismaClient()

async function main() {
  console.log('🔧 กำลังแก้ไขและเพิ่มทรัพย์สิน...\n')

  try {
    // 1. ตรวจสอบและเพิ่ม assetType field
    console.log('📋 ขั้นตอนที่ 1: ตรวจสอบ assetType field...')
    try {
      const result = await prisma.$queryRaw`
        SELECT sql FROM sqlite_master 
        WHERE type='table' AND name='Asset'
      `
      
      const tableSql = result[0]?.sql || ''
      const hasAssetType = tableSql.includes('assetType')

      if (!hasAssetType) {
        console.log('   ⚠️  ยังไม่มี assetType field กำลังเพิ่ม...')
        await prisma.$executeRaw`
          ALTER TABLE "Asset" ADD COLUMN "assetType" TEXT NOT NULL DEFAULT 'AIR_CONDITIONER'
        `
        console.log('   ✅ เพิ่ม assetType column สำเร็จ')
        
        try {
          await prisma.$executeRaw`
            CREATE INDEX IF NOT EXISTS "Asset_assetType_idx" ON "Asset"("assetType")
          `
          console.log('   ✅ สร้าง index สำเร็จ')
        } catch (e) {
          // Index อาจจะมีอยู่แล้ว
        }
      } else {
        console.log('   ✅ assetType field มีอยู่แล้ว')
      }
    } catch (error) {
      console.error('   ❌ เกิดข้อผิดพลาด:', error.message)
      throw error
    }

    // 2. Generate Prisma Client ใหม่
    console.log('\n📋 ขั้นตอนที่ 2: Generate Prisma Client...')
    try {
      execSync('npx prisma generate', { stdio: 'inherit' })
      console.log('   ✅ Generate สำเร็จ')
    } catch (error) {
      console.error('   ⚠️  Generate อาจจะมีปัญหา:', error.message)
    }

    // 3. ตรวจสอบจำนวน assets ที่มีอยู่
    console.log('\n📋 ขั้นตอนที่ 3: ตรวจสอบทรัพย์สินที่มีอยู่...')
    const existingCount = await prisma.asset.count()
    console.log(`   📊 มีทรัพย์สินอยู่แล้ว: ${existingCount} รายการ`)

    // 4. ดึง Rooms
    const rooms = await prisma.room.findMany()
    if (rooms.length === 0) {
      console.log('\n   ⚠️  ไม่พบ Room ในระบบ')
      console.log('   💡 กรุณารัน seed ก่อน: npx prisma db seed')
      return
    }
    console.log(`   📦 พบ ${rooms.length} ห้อง`)

    // 5. เพิ่มทรัพย์สิน 50 รายการ
    console.log('\n📋 ขั้นตอนที่ 4: เพิ่มทรัพย์สิน 50 รายการ...')
    const airBrands = ['Daikin', 'Carrier', 'Mitsubishi', 'LG', 'Samsung', 'Toshiba', 'Panasonic', 'Hitachi', 'Fujitsu', 'York']
    const refrigerantBrands = ['R-410A', 'R-22', 'R-32', 'R-134a', 'R-407C', 'R-404A']
    const sparePartTypes = ['Filter', 'Compressor', 'Fan Motor', 'Capacitor', 'Thermostat', 'Coil', 'Drain Pan', 'Expansion Valve']
    const toolTypes = ['Vacuum Pump', 'Gauges Set', 'Refrigerant Scale', 'Leak Detector', 'Multimeter', 'Drill', 'Wrench Set', 'Torch Kit']
    
    const assetTypes = ['AIR_CONDITIONER', 'REFRIGERANT', 'SPARE_PART', 'TOOL', 'OTHER']
    const statuses = ['ACTIVE', 'ACTIVE', 'ACTIVE', 'ACTIVE', 'BROKEN', 'RETIRED']
    const btuRanges = [12000, 18000, 24000, 30000, 36000]
    
    const assets = []
    const startIndex = existingCount + 1

    for (let i = 0; i < 50; i++) {
      const assetIndex = startIndex + i
      const assetType = assetTypes[Math.floor(Math.random() * assetTypes.length)]
      const status = statuses[Math.floor(Math.random() * statuses.length)]
      const randomRoom = rooms[Math.floor(Math.random() * rooms.length)]
      
      let qrCode = ''
      let brand = null
      let model = null
      let serialNo = null
      let btu = null
      
      if (assetType === 'AIR_CONDITIONER') {
        qrCode = `AC-2024-${String(assetIndex).padStart(3, '0')}`
        brand = airBrands[Math.floor(Math.random() * airBrands.length)]
        model = `Model-${['X', 'Y', 'Z'][Math.floor(Math.random() * 3)]}${Math.floor(Math.random() * 10) + 1}`
        serialNo = `SN-${brand.substring(0, 3).toUpperCase()}-${String(assetIndex).padStart(5, '0')}`
        btu = btuRanges[Math.floor(Math.random() * btuRanges.length)]
      } else if (assetType === 'REFRIGERANT') {
        qrCode = `REF-2024-${String(assetIndex).padStart(3, '0')}`
        brand = refrigerantBrands[Math.floor(Math.random() * refrigerantBrands.length)]
        model = `${brand} ${Math.floor(Math.random() * 5) + 1}kg`
        serialNo = `REF-${String(assetIndex).padStart(5, '0')}`
      } else if (assetType === 'SPARE_PART') {
        qrCode = `PART-2024-${String(assetIndex).padStart(3, '0')}`
        const partType = sparePartTypes[Math.floor(Math.random() * sparePartTypes.length)]
        brand = partType
        model = `Size-${['S', 'M', 'L', 'XL'][Math.floor(Math.random() * 4)]}`
        serialNo = `PART-${String(assetIndex).padStart(5, '0')}`
      } else if (assetType === 'TOOL') {
        qrCode = `TOOL-2024-${String(assetIndex).padStart(3, '0')}`
        const toolType = toolTypes[Math.floor(Math.random() * toolTypes.length)]
        brand = toolType
        model = `Pro-${Math.floor(Math.random() * 10) + 1}`
        serialNo = `TOOL-${String(assetIndex).padStart(5, '0')}`
      } else {
        qrCode = `OTHER-2024-${String(assetIndex).padStart(3, '0')}`
        brand = 'Generic'
        model = `Item-${assetIndex}`
        serialNo = `OTH-${String(assetIndex).padStart(5, '0')}`
      }
      
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
        assetType: assetType,
        brand,
        model,
        serialNo,
        btu,
        installDate,
        status: status,
        roomId: randomRoom.id
      })
    }

    // สร้าง assets
    let created = 0
    for (const asset of assets) {
      try {
        await prisma.asset.create({ data: asset })
        created++
      } catch (e) {
        if (e.code !== 'P2002') {
          console.error('   ❌ เกิดข้อผิดพลาด:', e.message)
        }
      }
    }

    console.log(`   ✅ เพิ่มทรัพย์สินสำเร็จ: ${created}/${assets.length} รายการ`)

    // 6. แสดงสรุป
    console.log('\n📋 ขั้นตอนที่ 5: สรุปผล...')
    const totalCount = await prisma.asset.count()
    const stats = await prisma.asset.groupBy({
      by: ['assetType'],
      _count: true,
    })

    console.log(`\n📊 สรุป:`)
    console.log(`   ✅ จำนวนทรัพย์สินทั้งหมด: ${totalCount} รายการ`)
    console.log(`\n📈 ประเภททรัพย์สิน:`)
    const typeLabels = {
      'AIR_CONDITIONER': 'เครื่องปรับอากาศ',
      'REFRIGERANT': 'น้ำยาแอร์',
      'SPARE_PART': 'อะไหล่',
      'TOOL': 'เครื่องมือ',
      'OTHER': 'อื่นๆ',
    }
    stats.forEach((stat) => {
      console.log(`   ${typeLabels[stat.assetType] || stat.assetType}: ${stat._count} รายการ`)
    })

    console.log('\n✅ เสร็จสิ้น! ลอง refresh หน้าเว็บดูได้เลย')
  } catch (error) {
    console.error('\n❌ เกิดข้อผิดพลาด:', error)
    process.exit(1)
  }
}

main()
  .catch((e) => {
    console.error('❌ เกิดข้อผิดพลาด:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
