/**
 * Script สำหรับสร้างข้อมูลตัวอย่าง Work Orders และ Job Items
 * เพื่อให้เห็นภาพ flow ของโปรแกรม
 * 
 * สร้าง:
 * - Work Orders หลายใบ (PM, CM, INSTALL)
 * - Job Items ที่มีสถานะต่างๆ (PENDING, IN_PROGRESS, DONE, ISSUE_FOUND)
 * - Job Photos สำหรับงานที่เสร็จแล้ว (BEFORE, AFTER, DEFECT, METER)
 * 
 * Usage: node scripts/create-sample-work-orders.js
 */

const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

// ฟังก์ชันสร้างเลขที่งาน (8vxgpup####)
async function generateWorkOrderNumber(prisma) {
  const WORK_ORDER_PREFIX = '8vxgpup'
  
  // หาเลขลำดับสูงสุดจากงานทั้งหมดที่มี prefix "8vxgpup"
  const existingOrders = await prisma.workOrder.findMany({
    where: {
      workOrderNumber: {
        startsWith: WORK_ORDER_PREFIX,
      },
    },
    select: {
      workOrderNumber: true,
    },
    orderBy: {
      workOrderNumber: 'desc',
    },
    take: 1,
  })
  
  // หาเลขลำดับสูงสุด
  let maxSequence = 0
  if (existingOrders.length > 0 && existingOrders[0].workOrderNumber) {
    const woNumber = existingOrders[0].workOrderNumber
    const sequenceStr = woNumber.replace(WORK_ORDER_PREFIX, '')
    const sequence = parseInt(sequenceStr, 10)
    if (!isNaN(sequence)) {
      maxSequence = sequence
    }
  }
  
  // สร้างเลขลำดับถัดไป
  const nextSequence = maxSequence + 1
  const sequenceStr = String(nextSequence).padStart(4, '0')
  
  return `${WORK_ORDER_PREFIX}${sequenceStr}`
}

// ฟังก์ชันสร้าง placeholder image URL (ใช้ placeholder service)
function getPlaceholderImageUrl(type) {
  const colors = {
    BEFORE: '4A90E2', // Blue
    AFTER: '50C878',  // Green
    DEFECT: 'FF6B6B', // Red
    METER: 'FFA500'   // Orange
  }
  const color = colors[type] || 'CCCCCC'
  return `https://via.placeholder.com/800x600/${color}/FFFFFF?text=${encodeURIComponent(type)}`
}

async function main() {
  console.log('🚀 กำลังสร้างข้อมูลตัวอย่าง Work Orders และ Job Items...\n')

  try {
    // 1. ตรวจสอบข้อมูลพื้นฐาน
    const users = await prisma.user.findMany({
      where: { role: 'TECHNICIAN' },
      select: { id: true, username: true, fullName: true }
    })

    if (users.length === 0) {
      console.error('❌ ไม่พบช่างในระบบ!')
      console.log('💡 กรุณารัน seed ก่อน: npm run db:seed')
      process.exit(1)
    }

    const sites = await prisma.site.findMany({
      include: {
        client: true
      }
    })

    if (sites.length === 0) {
      console.error('❌ ไม่พบ Site ในระบบ!')
      console.log('💡 กรุณารัน seed ก่อน: npm run db:seed')
      process.exit(1)
    }

    const assets = await prisma.asset.findMany({
      where: { status: 'ACTIVE' },
      select: { id: true, qrCode: true, brand: true, model: true }
    })

    if (assets.length === 0) {
      console.error('❌ ไม่พบ Assets ในระบบ!')
      console.log('💡 กรุณารัน script สร้าง assets ก่อน: node scripts/create-50-assets-mixed.js')
      process.exit(1)
    }

    console.log(`✅ พบข้อมูลพื้นฐาน:`)
    console.log(`   - ช่าง: ${users.length} คน`)
    console.log(`   - Site: ${sites.length} แห่ง`)
    console.log(`   - Assets: ${assets.length} รายการ\n`)

    // 2. นับข้อมูลที่มีอยู่แล้ว
    const existingWorkOrders = await prisma.workOrder.count()
    console.log(`📊 มี Work Orders อยู่แล้ว: ${existingWorkOrders} ใบ\n`)

    // 3. สร้าง Work Orders และ Job Items
    const jobTypes = ['PM', 'CM', 'INSTALL']
    const orderStatuses = ['OPEN', 'IN_PROGRESS', 'COMPLETED']
    const jobItemStatuses = ['PENDING', 'IN_PROGRESS', 'DONE', 'ISSUE_FOUND']
    const teams = ['ทีม A', 'ทีม B', 'ทีม C', null]

    const workOrdersToCreate = []
    const now = new Date()

    // สร้าง 15 Work Orders
    for (let i = 0; i < 15; i++) {
      const randomSite = sites[Math.floor(Math.random() * sites.length)]
      const jobType = jobTypes[Math.floor(Math.random() * jobTypes.length)]
      
      // สร้างวันที่นัดหมาย (สุ่มระหว่าง 7 วันที่ผ่านมา ถึง 30 วันข้างหน้า)
      const daysOffset = Math.floor(Math.random() * 37) - 7
      const scheduledDate = new Date(now)
      scheduledDate.setDate(scheduledDate.getDate() + daysOffset)
      scheduledDate.setHours(9 + Math.floor(Math.random() * 8), Math.floor(Math.random() * 4) * 15, 0, 0)

      // สุ่มสถานะ Work Order
      let orderStatus = orderStatuses[Math.floor(Math.random() * orderStatuses.length)]
      
      // ถ้าเป็น COMPLETED ให้มีโอกาสสูงที่จะมี Job Items ที่ DONE
      if (orderStatus === 'COMPLETED' && Math.random() < 0.3) {
        orderStatus = 'IN_PROGRESS' // บางส่วนเสร็จ
      }

      const assignedTeam = teams[Math.floor(Math.random() * teams.length)]

      workOrdersToCreate.push({
        siteId: randomSite.id,
        jobType,
        scheduledDate,
        status: orderStatus,
        assignedTeam,
        jobItems: []
      })
    }

    // 4. สร้าง Job Items สำหรับแต่ละ Work Order
    let totalJobItems = 0
    let totalPhotos = 0

    for (const wo of workOrdersToCreate) {
      // สุ่มจำนวน Assets ต่อ Work Order (1-5 รายการ)
      const numAssets = Math.floor(Math.random() * 5) + 1
      const selectedAssets = assets
        .filter(a => Math.random() < 0.3) // เลือก assets แบบสุ่ม
        .slice(0, numAssets)

      if (selectedAssets.length === 0) {
        // ถ้าไม่มี assets ที่เลือก ให้เลือกแบบสุ่ม
        selectedAssets.push(...assets.slice(0, Math.min(numAssets, assets.length)))
      }

      // สุ่มช่าง (บางงานอาจยังไม่ได้มอบหมาย)
      const assignedTechnician = users.length > 0 && Math.random() > 0.2
        ? users[Math.floor(Math.random() * users.length)].id
        : null

      // สร้าง Job Items
      for (const asset of selectedAssets) {
        // สุ่มสถานะ Job Item ตามสถานะ Work Order
        let jobItemStatus = 'PENDING'
        if (wo.status === 'IN_PROGRESS') {
          // ถ้า Work Order กำลังดำเนินการ อาจมี Job Items ที่ IN_PROGRESS หรือ DONE
          const rand = Math.random()
          if (rand < 0.4) {
            jobItemStatus = 'DONE'
          } else if (rand < 0.7) {
            jobItemStatus = 'IN_PROGRESS'
          } else if (rand < 0.9) {
            jobItemStatus = 'PENDING'
          } else {
            jobItemStatus = 'ISSUE_FOUND'
          }
        } else if (wo.status === 'COMPLETED') {
          // ถ้า Work Order เสร็จแล้ว Job Items ควรเป็น DONE
          jobItemStatus = 'DONE'
        }

        // สร้าง startTime และ endTime ตามสถานะ
        let startTime = null
        let endTime = null
        if (jobItemStatus === 'IN_PROGRESS' || jobItemStatus === 'DONE' || jobItemStatus === 'ISSUE_FOUND') {
          startTime = new Date(wo.scheduledDate)
          startTime.setHours(9 + Math.floor(Math.random() * 4), Math.floor(Math.random() * 60), 0, 0)
          
          if (jobItemStatus === 'DONE') {
            // ถ้าเสร็จแล้ว ให้มี endTime (ใช้เวลา 30-180 นาที)
            endTime = new Date(startTime)
            endTime.setMinutes(endTime.getMinutes() + 30 + Math.floor(Math.random() * 150))
          }
        }

        // สร้าง techNote สำหรับงานที่ทำแล้ว
        let techNote = null
        if (jobItemStatus === 'DONE' || jobItemStatus === 'IN_PROGRESS' || jobItemStatus === 'ISSUE_FOUND') {
          const notes = [
            'ล้างแอร์เสร็จเรียบร้อย ตรวจสอบแล้วใช้งานได้ปกติ',
            'เปลี่ยนแผ่นกรองอากาศ ตรวจสอบระบบระบายความร้อน',
            'เติมน้ำยาแอร์ ตรวจสอบการทำงานของคอมเพรสเซอร์',
            'ทำความสะอาดคอยล์ ตรวจสอบท่อน้ำทิ้ง',
            'พบปัญหา: แผ่นกรองอากาศสกปรกมาก ต้องเปลี่ยนใหม่',
            'ตรวจสอบแล้วพบว่าคอมเพรสเซอร์ทำงานผิดปกติ ต้องซ่อม',
            'ทำความสะอาดและตรวจสอบระบบทั้งหมด ใช้งานได้ปกติ',
            'เปลี่ยนชิ้นส่วนที่ชำรุด ตรวจสอบแล้วใช้งานได้',
          ]
          techNote = notes[Math.floor(Math.random() * notes.length)]
        }

        wo.jobItems.push({
          assetId: asset.id,
          technicianId: assignedTechnician,
          status: jobItemStatus,
          startTime,
          endTime,
          techNote
        })
        totalJobItems++
      }
    }

    // 5. สร้าง Work Orders และ Job Items ในฐานข้อมูล
    console.log('📝 กำลังสร้าง Work Orders และ Job Items...')
    let createdWorkOrders = 0
    let createdJobItems = 0

    for (const wo of workOrdersToCreate) {
      try {
        // สร้างเลขที่งาน
        const workOrderNumber = await generateWorkOrderNumber(prisma)
        
        // สร้าง Work Order
        const workOrder = await prisma.workOrder.create({
          data: {
            siteId: wo.siteId,
            jobType: wo.jobType,
            scheduledDate: wo.scheduledDate,
            status: wo.status,
            workOrderNumber: workOrderNumber,
            assignedTeam: wo.assignedTeam,
            jobItems: {
              create: wo.jobItems.map(ji => ({
                assetId: ji.assetId,
                technicianId: ji.technicianId,
                status: ji.status,
                startTime: ji.startTime,
                endTime: ji.endTime,
                techNote: ji.techNote
              }))
            }
          },
          include: {
            jobItems: true
          }
        })

        createdWorkOrders++
        createdJobItems += workOrder.jobItems.length

        // 6. สร้าง Photos สำหรับ Job Items ที่ DONE
        for (const jobItem of workOrder.jobItems) {
          if (jobItem.status === 'DONE') {
            // งานที่เสร็จแล้วต้องมีรูป BEFORE และ AFTER
            const photos = [
              { type: 'BEFORE', url: getPlaceholderImageUrl('BEFORE') },
              { type: 'AFTER', url: getPlaceholderImageUrl('AFTER') }
            ]

            // บางงานอาจมีรูป DEFECT หรือ METER ด้วย
            if (Math.random() < 0.4) {
              photos.push({ type: 'DEFECT', url: getPlaceholderImageUrl('DEFECT') })
            }
            if (Math.random() < 0.3) {
              photos.push({ type: 'METER', url: getPlaceholderImageUrl('METER') })
            }

            // สร้าง Photos
            for (const photo of photos) {
              await prisma.jobPhoto.create({
                data: {
                  jobItemId: jobItem.id,
                  type: photo.type,
                  url: photo.url,
                  createdAt: jobItem.startTime || new Date()
                }
              })
              totalPhotos++
            }
          } else if (jobItem.status === 'IN_PROGRESS') {
            // งานที่กำลังทำอาจมีรูป BEFORE
            if (Math.random() < 0.6) {
              await prisma.jobPhoto.create({
                data: {
                  jobItemId: jobItem.id,
                  type: 'BEFORE',
                  url: getPlaceholderImageUrl('BEFORE'),
                  createdAt: jobItem.startTime || new Date()
                }
              })
              totalPhotos++
            }
          } else if (jobItem.status === 'ISSUE_FOUND') {
            // งานที่พบปัญหาอาจมีรูป DEFECT
            if (Math.random() < 0.7) {
              await prisma.jobPhoto.create({
                data: {
                  jobItemId: jobItem.id,
                  type: 'DEFECT',
                  url: getPlaceholderImageUrl('DEFECT'),
                  createdAt: jobItem.startTime || new Date()
                }
              })
              totalPhotos++
            }
          }
        }
      } catch (error) {
        if (error.code === 'P2002') {
          // Duplicate workOrderNumber - ข้าม
          console.log(`   ⚠️  ข้าม Work Order (เลขที่ซ้ำ)`)
        } else {
          throw error
        }
      }
    }

    // 7. สรุปผล
    console.log(`\n✅ สร้างข้อมูลสำเร็จ:`)
    console.log(`   - Work Orders: ${createdWorkOrders} ใบ`)
    console.log(`   - Job Items: ${createdJobItems} รายการ`)
    console.log(`   - Photos: ${totalPhotos} รูป`)

    // 8. แสดงสถิติ
    const stats = await prisma.workOrder.groupBy({
      by: ['status'],
      _count: true,
    })

    const jobItemStats = await prisma.jobItem.groupBy({
      by: ['status'],
      _count: true,
    })

    console.log(`\n📈 สถิติ Work Orders:`)
    stats.forEach(stat => {
      const statusNames = {
        'OPEN': 'เปิด',
        'IN_PROGRESS': 'กำลังดำเนินการ',
        'COMPLETED': 'เสร็จสิ้น',
        'CANCELLED': 'ยกเลิก'
      }
      console.log(`   ${statusNames[stat.status] || stat.status}: ${stat._count} ใบ`)
    })

    console.log(`\n📈 สถิติ Job Items:`)
    jobItemStats.forEach(stat => {
      const statusNames = {
        'PENDING': 'รอดำเนินการ',
        'IN_PROGRESS': 'กำลังทำงาน',
        'DONE': 'เสร็จสิ้น',
        'ISSUE_FOUND': 'พบปัญหา'
      }
      console.log(`   ${statusNames[stat.status] || stat.status}: ${stat._count} รายการ`)
    })

    // 9. ตรวจสอบ Job Items ที่ DONE ว่ามีรูปครบหรือไม่
    const doneJobItems = await prisma.jobItem.findMany({
      where: { status: 'DONE' },
      include: {
        photos: true
      }
    })

    const itemsWithoutPhotos = doneJobItems.filter(ji => {
      const hasBefore = ji.photos.some(p => p.type === 'BEFORE')
      const hasAfter = ji.photos.some(p => p.type === 'AFTER')
      return !hasBefore || !hasAfter
    })

    if (itemsWithoutPhotos.length > 0) {
      console.log(`\n⚠️  พบ Job Items ที่ DONE แต่ไม่มีรูปครบ: ${itemsWithoutPhotos.length} รายการ`)
      console.log(`   (ควรมีรูป BEFORE และ AFTER สำหรับงานที่เสร็จแล้ว)`)
    } else {
      console.log(`\n✅ ทุก Job Item ที่ DONE มีรูป BEFORE และ AFTER ครบถ้วน`)
    }

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
