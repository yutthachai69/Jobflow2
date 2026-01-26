/**
 * Script สำหรับสร้างทรัพย์สินและอุปกรณ์ 50 รายการ
 * มีทั้งแอร์และอุปกรณ์คละๆ กัน
 * 
 * สัดส่วน:
 * - เครื่องปรับอากาศ: 20 รายการ (40%)
 * - น้ำยาแอร์: 10 รายการ (20%)
 * - อะไหล่: 10 รายการ (20%)
 * - เครื่องมือ: 8 รายการ (16%)
 * - อื่นๆ: 2 รายการ (4%)
 * 
 * หมายเหตุ: QR Code จะมีเฉพาะเครื่องปรับอากาศเท่านั้น
 * อุปกรณ์อื่นๆ จะใช้ serialNo เป็น qrCode (แต่จะไม่แสดงใน UI)
 * 
 * Usage: node scripts/create-50-assets-mixed.js
 */

const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  console.log('🚀 กำลังสร้างทรัพย์สินและอุปกรณ์ 50 รายการ...\n')

  try {
    // 1. ตรวจสอบ Rooms
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
      console.error('❌ ไม่พบ Room ในระบบ!')
      console.log('💡 กรุณารัน seed ก่อน: npm run db:seed')
      process.exit(1)
    }

    console.log(`✅ พบ ${rooms.length} ห้อง\n`)

    // 2. นับจำนวน assets ที่มีอยู่แล้ว
    const existingCount = await prisma.asset.count()
    console.log(`📊 มีทรัพย์สินอยู่แล้ว: ${existingCount} รายการ`)
    console.log(`📝 จะสร้างเพิ่มอีก 50 รายการ\n`)

    // 3. ข้อมูลสำหรับสร้าง Assets
    const airBrands = ['Daikin', 'Carrier', 'Mitsubishi', 'LG', 'Samsung', 'Toshiba', 'Panasonic', 'Hitachi', 'Fujitsu', 'York']
    const refrigerantBrands = ['R-410A', 'R-22', 'R-32', 'R-134a', 'R-407C', 'R-404A']
    const sparePartTypes = ['Filter', 'Compressor', 'Fan Motor', 'Capacitor', 'Thermostat', 'Coil', 'Drain Pan', 'Expansion Valve']
    const toolTypes = ['Vacuum Pump', 'Gauges Set', 'Refrigerant Scale', 'Leak Detector', 'Multimeter', 'Drill', 'Wrench Set', 'Torch Kit']
    
    // สัดส่วน: แอร์ 40%, น้ำยา 20%, อะไหล่ 20%, เครื่องมือ 15%, อื่นๆ 5%
    const assetTypeDistribution = [
      ...Array(20).fill('AIR_CONDITIONER'),      // 20 รายการ (40%)
      ...Array(10).fill('REFRIGERANT'),          // 10 รายการ (20%)
      ...Array(10).fill('SPARE_PART'),          // 10 รายการ (20%)
      ...Array(8).fill('TOOL'),                  // 8 รายการ (16%)
      ...Array(2).fill('OTHER'),                 // 2 รายการ (4%)
    ]
    
    const statuses = ['ACTIVE', 'ACTIVE', 'ACTIVE', 'ACTIVE', 'BROKEN', 'RETIRED']
    const btuRanges = [12000, 18000, 24000, 30000, 36000, 48000]

    // 4. สร้าง assets
    const assets = []
    const startIndex = existingCount + 1

    // สุ่มลำดับ asset types
    const shuffledTypes = assetTypeDistribution.sort(() => Math.random() - 0.5)

    for (let i = 0; i < 50; i++) {
      const assetIndex = startIndex + i
      const assetType = shuffledTypes[i]
      const status = statuses[Math.floor(Math.random() * statuses.length)]
      const randomRoom = rooms[Math.floor(Math.random() * rooms.length)]
      
      let qrCode = ''
      let brand = null
      let model = null
      let serialNo = null
      let btu = null
      
      if (assetType === 'AIR_CONDITIONER') {
        // เครื่องปรับอากาศ - มี QR Code
        qrCode = `AC-2024-${String(assetIndex).padStart(3, '0')}`
        brand = airBrands[Math.floor(Math.random() * airBrands.length)]
        model = `Model-${['X', 'Y', 'Z'][Math.floor(Math.random() * 3)]}${Math.floor(Math.random() * 10) + 1}`
        serialNo = `SN-${brand.substring(0, 3).toUpperCase()}-${String(assetIndex).padStart(5, '0')}`
        btu = btuRanges[Math.floor(Math.random() * btuRanges.length)]
      } else {
        // อุปกรณ์อื่นๆ - ไม่มี QR Code จริงๆ แต่ต้องมีค่าในฐานข้อมูล (schema กำหนด @unique)
        // ใช้ serialNo เป็น qrCode เพื่อให้ unique และไม่ซ้ำกัน
        if (assetType === 'REFRIGERANT') {
          // น้ำยาแอร์
          const refBrand = refrigerantBrands[Math.floor(Math.random() * refrigerantBrands.length)]
          serialNo = `REF-${String(assetIndex).padStart(5, '0')}`
          qrCode = serialNo // ใช้ serialNo เป็น qrCode (แต่จะไม่แสดงใน UI)
          brand = refBrand
          model = `${refBrand} ${Math.floor(Math.random() * 5) + 1}kg`
        } else if (assetType === 'SPARE_PART') {
          // อะไหล่
          const partType = sparePartTypes[Math.floor(Math.random() * sparePartTypes.length)]
          serialNo = `PART-${String(assetIndex).padStart(5, '0')}`
          qrCode = serialNo // ใช้ serialNo เป็น qrCode (แต่จะไม่แสดงใน UI)
          brand = partType
          model = `Size-${['S', 'M', 'L', 'XL'][Math.floor(Math.random() * 4)]}`
        } else if (assetType === 'TOOL') {
          // เครื่องมือ
          const toolType = toolTypes[Math.floor(Math.random() * toolTypes.length)]
          serialNo = `TOOL-${String(assetIndex).padStart(5, '0')}`
          qrCode = serialNo // ใช้ serialNo เป็น qrCode (แต่จะไม่แสดงใน UI)
          brand = toolType
          model = `Pro-${Math.floor(Math.random() * 10) + 1}`
        } else {
          // อื่นๆ
          serialNo = `OTH-${String(assetIndex).padStart(5, '0')}`
          qrCode = serialNo // ใช้ serialNo เป็น qrCode (แต่จะไม่แสดงใน UI)
          brand = 'Generic'
          model = `Item-${assetIndex}`
        }
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

    // 5. สร้าง assets ในฐานข้อมูล
    console.log('📝 กำลังสร้างทรัพย์สิน...')
    let created = 0
    let skipped = 0

    for (const asset of assets) {
      try {
        await prisma.asset.create({
          data: asset
        })
        created++
      } catch (error) {
        if (error.code === 'P2002') {
          // Duplicate QR Code - ข้าม
          skipped++
          console.log(`   ⚠️  ข้าม ${asset.qrCode} (ซ้ำ)`)
        } else {
          throw error
        }
      }
    }

    // 6. สรุปผล
    console.log(`\n✅ สร้างทรัพย์สินสำเร็จ: ${created} รายการ`)
    if (skipped > 0) {
      console.log(`⚠️  ข้าม (ซ้ำ): ${skipped} รายการ`)
    }

    // 7. แสดงสถิติ
    const totalCount = await prisma.asset.count()
    const stats = await prisma.asset.groupBy({
      by: ['assetType'],
      _count: true,
    })

    console.log(`\n📊 สรุป:`)
    console.log(`   จำนวนทรัพย์สินทั้งหมด: ${totalCount} รายการ`)
    console.log(`\n📈 ประเภททรัพย์สิน:`)
    stats.forEach(stat => {
      const typeNames = {
        'AIR_CONDITIONER': 'เครื่องปรับอากาศ',
        'REFRIGERANT': 'น้ำยาแอร์',
        'SPARE_PART': 'อะไหล่',
        'TOOL': 'เครื่องมือ',
        'OTHER': 'อื่นๆ'
      }
      console.log(`   ${typeNames[stat.assetType] || stat.assetType}: ${stat._count} รายการ`)
    })

    console.log(`\n✅ เสร็จสิ้น!`)

  } catch (error) {
    console.error('\n❌ เกิดข้อผิดพลาด:', error)
    if (error.message?.includes('does not exist')) {
      console.error('\n💡 ดูเหมือนว่าฐานข้อมูลยังไม่มีตาราง!')
      console.error('   ลองรัน: npx prisma db push')
    }
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
