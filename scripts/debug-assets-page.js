// scripts/debug-assets-page.js
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  console.log('🔍 กำลังตรวจสอบปัญหา Assets Page...\n')

  try {
    // 1. ตรวจสอบ Users ที่เป็น CLIENT
    console.log('📋 ขั้นตอนที่ 1: ตรวจสอบ CLIENT users...')
    const clientUsers = await prisma.user.findMany({
      where: { role: 'CLIENT' },
      include: {
        site: true
      }
    })

    console.log(`   พบ CLIENT users: ${clientUsers.length} คน`)
    clientUsers.forEach(user => {
      console.log(`   - ${user.username} (${user.fullName})`)
      console.log(`     siteId: ${user.siteId || '(ไม่มี)'}`)
      if (user.site) {
        console.log(`     site: ${user.site.name}`)
      } else {
        console.log(`     ⚠️  ไม่พบ site ที่ผูกกับ user นี้`)
      }
    })

    // 2. ตรวจสอบ Sites
    console.log('\n📋 ขั้นตอนที่ 2: ตรวจสอบ Sites...')
    const sites = await prisma.site.findMany({
      include: {
        buildings: {
          include: {
            floors: {
              include: {
                rooms: {
                  include: {
                    assets: true
                  }
                }
              }
            }
          }
        }
      }
    })

    console.log(`   พบ Sites: ${sites.length} แห่ง`)
    sites.forEach(site => {
      const totalAssets = site.buildings.flatMap(b =>
        b.floors.flatMap(f =>
          f.rooms.flatMap(r => r.assets)
        )
      ).length

      console.log(`   - ${site.name} (${site.id})`)
      console.log(`     อาคาร: ${site.buildings.length} อาคาร`)
      console.log(`     ชั้น: ${site.buildings.flatMap(b => b.floors).length} ชั้น`)
      console.log(`     ห้อง: ${site.buildings.flatMap(b => b.floors.flatMap(f => f.rooms)).length} ห้อง`)
      console.log(`     ทรัพย์สิน: ${totalAssets} รายการ`)
    })

    // 3. ตรวจสอบ Assets ทั้งหมด
    console.log('\n📋 ขั้นตอนที่ 3: ตรวจสอบ Assets...')
    const allAssets = await prisma.asset.findMany({
      include: {
        room: {
          include: {
            floor: {
              include: {
                building: {
                  include: {
                    site: true
                  }
                }
              }
            }
          }
        }
      }
    })

    console.log(`   จำนวนทรัพย์สินทั้งหมด: ${allAssets.length} รายการ`)
    
    // แบ่งตาม site
    const assetsBySite = {}
    allAssets.forEach(asset => {
      const siteId = asset.room.floor.building.siteId
      if (!assetsBySite[siteId]) {
        assetsBySite[siteId] = []
      }
      assetsBySite[siteId].push(asset)
    })

    console.log(`   ทรัพย์สินแยกตาม Site:`)
    for (const [siteId, assets] of Object.entries(assetsBySite)) {
      const site = sites.find(s => s.id === siteId)
      console.log(`   - ${site?.name || siteId}: ${assets.length} รายการ`)
    }

    // 4. ตรวจสอบ assetType field
    console.log('\n📋 ขั้นตอนที่ 4: ตรวจสอบ assetType field...')
    try {
      const sampleAsset = await prisma.asset.findFirst({
        select: {
          id: true,
          qrCode: true,
          assetType: true
        }
      })

      if (sampleAsset) {
        console.log(`   ✅ assetType field ใช้งานได้`)
        console.log(`   ตัวอย่าง: ${sampleAsset.qrCode} - assetType: ${sampleAsset.assetType}`)
      } else {
        console.log(`   ⚠️  ไม่มีทรัพย์สินในระบบ`)
      }
    } catch (error) {
      console.log(`   ❌ assetType field อาจจะมีปัญหา: ${error.message}`)
    }

    // 5. ตรวจสอบ CLIENT user ที่มีปัญหา
    console.log('\n📋 ขั้นตอนที่ 5: ตรวจสอบ CLIENT users ที่อาจมีปัญหา...')
    for (const user of clientUsers) {
      if (!user.siteId) {
        console.log(`   ⚠️  User ${user.username} ไม่มี siteId`)
        continue
      }

      const site = sites.find(s => s.id === user.siteId)
      if (!site) {
        console.log(`   ❌ User ${user.username} มี siteId (${user.siteId}) แต่ไม่พบ Site ในระบบ`)
        continue
      }

      const userAssets = assetsBySite[user.siteId] || []
      console.log(`   ✅ User ${user.username}:`)
      console.log(`      Site: ${site.name}`)
      console.log(`      ทรัพย์สิน: ${userAssets.length} รายการ`)

      if (userAssets.length === 0) {
        console.log(`      ⚠️  ไม่มีทรัพย์สินใน Site นี้`)
      }
    }

    console.log('\n✅ การตรวจสอบเสร็จสิ้น')
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
