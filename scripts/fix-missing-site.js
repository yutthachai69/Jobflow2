// scripts/fix-missing-site.js
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  console.log('🔧 กำลังแก้ไขปัญหา Site ที่หายไป...\n')

  try {
    // 1. ตรวจสอบ CLIENT users ที่มี siteId
    console.log('📋 ขั้นตอนที่ 1: ตรวจสอบ CLIENT users...')
    const clientUsers = await prisma.user.findMany({
      where: { role: 'CLIENT' },
      include: {
        site: true
      }
    })

    console.log(`   พบ CLIENT users: ${clientUsers.length} คน\n`)

    for (const user of clientUsers) {
      console.log(`   👤 User: ${user.username} (${user.fullName})`)
      console.log(`      siteId: ${user.siteId || '(ไม่มี)'}`)

      if (!user.siteId) {
        console.log(`      ⚠️  User นี้ไม่มี siteId`)
        continue
      }

      // ตรวจสอบว่า site มีอยู่จริงหรือไม่
      const site = await prisma.site.findUnique({
        where: { id: user.siteId }
      })

      if (!site) {
        console.log(`      ❌ Site (${user.siteId}) ไม่พบใน database`)

        // ตรวจสอบว่ามี assets ที่ผูกกับ siteId นี้หรือไม่
        const assets = await prisma.asset.findMany({
          where: {
            room: {
              floor: {
                building: {
                  siteId: user.siteId
                }
              }
            }
          },
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

        if (assets.length > 0) {
          // ถ้ามี assets แสดงว่า site ควรจะมีอยู่
          const actualSiteId = assets[0].room.floor.building.siteId
          console.log(`      💡 พบ assets ${assets.length} รายการที่ผูกกับ siteId: ${actualSiteId}`)

          // ตรวจสอบว่า actualSiteId มี site จริงๆ หรือไม่
          const actualSite = await prisma.site.findUnique({
            where: { id: actualSiteId }
          })

          if (actualSite) {
            console.log(`      ✅ พบ Site จริง: ${actualSite.name} (${actualSiteId})`)
            console.log(`      🔄 กำลังอัพเดท user.siteId...`)

            // อัพเดท user.siteId ให้ตรงกับ site ที่มีจริง
            await prisma.user.update({
              where: { id: user.id },
              data: { siteId: actualSiteId }
            })

            console.log(`      ✅ อัพเดทสำเร็จ: user.siteId = ${actualSiteId}\n`)
          } else {
            console.log(`      ❌ Site (${actualSiteId}) ก็ไม่พบใน database เช่นกัน`)
            console.log(`      💡 ต้องสร้าง Site ใหม่หรือตรวจสอบข้อมูล\n`)
          }
        } else {
          console.log(`      ⚠️  ไม่มี assets ที่ผูกกับ siteId นี้`)
          console.log(`      💡 อาจต้องสร้าง Site ใหม่หรือลบ siteId จาก user\n`)
        }
      } else {
        console.log(`      ✅ Site พบ: ${site.name} (${site.id})\n`)
      }
    }

    // 2. ตรวจสอบ Sites ทั้งหมด
    console.log('\n📋 ขั้นตอนที่ 2: ตรวจสอบ Sites ทั้งหมด...')
    const allSites = await prisma.site.findMany({
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

    console.log(`   พบ Sites: ${allSites.length} แห่ง`)
    allSites.forEach(site => {
      const totalAssets = site.buildings.flatMap(b =>
        b.floors.flatMap(f =>
          f.rooms.flatMap(r => r.assets)
        )
      ).length
      console.log(`   - ${site.name} (${site.id}): ${totalAssets} ทรัพย์สิน`)
    })

    console.log('\n✅ การแก้ไขเสร็จสิ้น')
    console.log('💡 ลอง refresh หน้าเว็บดูได้เลย')
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
