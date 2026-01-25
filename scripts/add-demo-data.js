// scripts/add-demo-data.js
// เพิ่มข้อมูลตัวอย่างให้ครบทุกหน้าเพื่อโชว์ให้ลูกค้า
const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  console.log('🎨 กำลังเพิ่มข้อมูลตัวอย่างให้ครบทุกหน้า...\n')

  try {
    // 1. ตรวจสอบว่ามีข้อมูลพื้นฐานหรือยัง
    const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } })
    const client = await prisma.user.findFirst({ where: { role: 'CLIENT' } })
    const technician = await prisma.user.findFirst({ where: { role: 'TECHNICIAN' } })
    const site = await prisma.site.findFirst()
    const assets = await prisma.asset.findMany({ take: 10 })

    if (!admin || !client || !technician || !site || assets.length === 0) {
      console.log('⚠️  ยังไม่มีข้อมูลพื้นฐาน กรุณารัน seed ก่อน: npx prisma db seed')
      return
    }

    console.log('✅ พบข้อมูลพื้นฐานแล้ว\n')

    // 2. สร้าง Work Orders ตัวอย่าง (PM และ CM)
    console.log('📋 สร้าง Work Orders ตัวอย่าง...')
    
    const workOrders = []
    
    // Work Order 1: PM ที่เสร็จแล้ว (สำหรับแบบสำรวจ)
    const wo1 = await prisma.workOrder.create({
      data: {
        jobType: 'PM',
        scheduledDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 วันที่แล้ว
        status: 'COMPLETED',
        siteId: site.id,
        assignedTeam: 'ทีม A',
        jobItems: {
          create: assets.slice(0, 3).map((asset) => ({
            assetId: asset.id,
            technicianId: technician.id,
            status: 'DONE',
            startTime: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000),
            endTime: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000),
            techNote: 'ทำความสะอาดและตรวจสอบระบบเรียบร้อย',
            photos: {
              create: [
                {
                  url: '/api/placeholder/400/300',
                  type: 'BEFORE',
                },
                {
                  url: '/api/placeholder/400/300',
                  type: 'AFTER',
                },
              ],
            },
          })),
        },
      },
    })
    workOrders.push(wo1)
    console.log(`   ✅ สร้าง Work Order PM เสร็จแล้ว (${wo1.id.slice(-8)})`)

    // Work Order 2: CM ที่เสร็จแล้ว (สำหรับแบบสำรวจ)
    const wo2 = await prisma.workOrder.create({
      data: {
        jobType: 'CM',
        scheduledDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 วันที่แล้ว
        status: 'COMPLETED',
        siteId: site.id,
        assignedTeam: 'ทีม B',
        jobItems: {
          create: assets.slice(3, 5).map((asset) => ({
            assetId: asset.id,
            technicianId: technician.id,
            status: 'DONE',
            startTime: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 + 1 * 60 * 60 * 1000),
            endTime: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000),
            techNote: 'แก้ไขปัญหาและทดสอบระบบเรียบร้อย',
            photos: {
              create: [
                {
                  url: '/api/placeholder/400/300',
                  type: 'BEFORE',
                },
                {
                  url: '/api/placeholder/400/300',
                  type: 'AFTER',
                },
              ],
            },
          })),
        },
      },
    })
    workOrders.push(wo2)
    console.log(`   ✅ สร้าง Work Order CM เสร็จแล้ว (${wo2.id.slice(-8)})`)

    // Work Order 3: PM ที่เสร็จแล้ว (จะสร้าง Feedback ภายหลัง)
    const wo3 = await prisma.workOrder.create({
      data: {
        jobType: 'PM',
        scheduledDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), // 14 วันที่แล้ว
        status: 'COMPLETED',
        siteId: site.id,
        assignedTeam: 'ทีม A',
        jobItems: {
          create: assets.slice(5, 7).map((asset) => ({
            assetId: asset.id,
            technicianId: technician.id,
            status: 'DONE',
            startTime: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000),
            endTime: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000),
            techNote: 'บำรุงรักษาตามมาตรฐาน',
            photos: {
              create: [
                {
                  url: '/api/placeholder/400/300',
                  type: 'BEFORE',
                },
                {
                  url: '/api/placeholder/400/300',
                  type: 'AFTER',
                },
              ],
            },
          })),
        },
      },
    })
    workOrders.push(wo3)
    console.log(`   ✅ สร้าง Work Order PM (${wo3.id.slice(-8)})`)

    // Work Order 4: PM กำลังดำเนินการ
    const wo4 = await prisma.workOrder.create({
      data: {
        jobType: 'PM',
        scheduledDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 วันข้างหน้า
        status: 'IN_PROGRESS',
        siteId: site.id,
        assignedTeam: 'ทีม A',
        jobItems: {
          create: assets.slice(7, 9).map((asset, idx) => ({
            assetId: asset.id,
            technicianId: technician.id,
            status: idx === 0 ? 'IN_PROGRESS' : 'PENDING',
            startTime: idx === 0 ? new Date() : null,
            techNote: idx === 0 ? 'กำลังดำเนินการ...' : null,
            photos: idx === 0 ? {
              create: {
                url: '/api/placeholder/400/300',
                type: 'BEFORE',
              },
            } : undefined,
          })),
        },
      },
    })
    workOrders.push(wo4)
    console.log(`   ✅ สร้าง Work Order PM กำลังดำเนินการ (${wo4.id.slice(-8)})`)

    // Work Order 5: CM เปิดใหม่
    const wo5 = await prisma.workOrder.create({
      data: {
        jobType: 'CM',
        scheduledDate: new Date(),
        status: 'OPEN',
        siteId: site.id,
        assignedTeam: 'ทีม B',
        jobItems: {
          create: assets.slice(9, 10).map((asset) => ({
            assetId: asset.id,
            status: 'PENDING',
            techNote: 'รอการมอบหมาย',
          })),
        },
      },
    })
    workOrders.push(wo5)
    console.log(`   ✅ สร้าง Work Order CM เปิดใหม่ (${wo5.id.slice(-8)})`)

    // 3. สร้าง Notifications สำหรับ CLIENT
    console.log('\n🔔 สร้าง Notifications...')
    
    // Notification สำหรับงานที่เสร็จแล้ว (รอให้คะแนน)
    const notif1 = await prisma.notification.create({
      data: {
        type: 'WORK_ORDER_COMPLETED',
        title: 'งานเสร็จสมบูรณ์',
        message: `งานเลขที่ ${wo1.id.slice(-8)} เสร็จสมบูรณ์แล้ว กรุณาให้คะแนนความพึงพอใจ`,
        userId: client.id,
        relatedId: wo1.id,
        isRead: false,
      },
    })
    console.log(`   ✅ สร้าง Notification สำหรับงานที่เสร็จแล้ว`)

    const notif2 = await prisma.notification.create({
      data: {
        type: 'WORK_ORDER_COMPLETED',
        title: 'งานเสร็จสมบูรณ์',
        message: `งานเลขที่ ${wo2.id.slice(-8)} เสร็จสมบูรณ์แล้ว กรุณาให้คะแนนความพึงพอใจ`,
        userId: client.id,
        relatedId: wo2.id,
        isRead: false,
      },
    })
    console.log(`   ✅ สร้าง Notification อีก 1 รายการ`)

    // 4. สร้าง Feedback ตัวอย่าง (เพื่อให้มีตัวอย่างที่ให้คะแนนแล้ว)
    console.log('\n⭐ สร้าง Feedback ตัวอย่าง...')
    
    // สร้าง Feedback สำหรับ wo1 (เพื่อให้มีตัวอย่าง)
    const feedback1 = await prisma.feedback.create({
      data: {
        rating: 4,
        comment: 'บริการดี แต่รอนานหน่อย',
        workOrderId: wo1.id,
        clientId: client.id,
        isRead: true,
      },
    })
    console.log(`   ✅ สร้าง Feedback สำหรับ wo1 (${feedback1.id.slice(-8)})`)
    
    // สร้าง Feedback สำหรับ wo3
    const feedback3 = await prisma.feedback.create({
      data: {
        rating: 5,
        comment: 'บริการดีมาก ช่างทำงานเรียบร้อยและเป็นมืออาชีพ',
        workOrderId: wo3.id,
        clientId: client.id,
        isRead: false,
      },
    })
    console.log(`   ✅ สร้าง Feedback สำหรับ wo3 (${feedback3.id.slice(-8)})`)
    
    // สร้าง Notification สำหรับ ADMIN เมื่อมี Feedback
    await prisma.notification.create({
      data: {
        type: 'FEEDBACK_RECEIVED',
        title: 'ได้รับแบบสำรวจความพึงพอใจใหม่',
        message: `งานเลขที่ ${wo1.id.slice(-8)} ได้รับแบบสำรวจความพึงพอใจ 4 ดาว`,
        userId: admin.id,
        relatedId: feedback1.id,
        isRead: false,
      },
    })
    console.log(`   ✅ สร้าง Notification สำหรับ ADMIN (Feedback wo1)`)
    
    await prisma.notification.create({
      data: {
        type: 'FEEDBACK_RECEIVED',
        title: 'ได้รับแบบสำรวจความพึงพอใจใหม่',
        message: `งานเลขที่ ${wo3.id.slice(-8)} ได้รับแบบสำรวจความพึงพอใจ 5 ดาว`,
        userId: admin.id,
        relatedId: feedback3.id,
        isRead: false,
      },
    })
    console.log(`   ✅ สร้าง Notification สำหรับ ADMIN (Feedback wo3)`)

    // 5. สร้าง Security Incidents ตัวอย่าง (สำหรับ ADMIN)
    console.log('\n🔒 สร้าง Security Incidents ตัวอย่าง...')
    
    const incidents = [
      {
        type: 'LOGIN_SUCCESS',
        severity: 'LOW',
        description: 'ผู้ใช้ admin เข้าสู่ระบบสำเร็จ',
        username: 'admin',
        ipAddress: '192.168.1.100',
        resolved: true,
        resolvedAt: new Date(),
      },
      {
        type: 'FAILED_LOGIN',
        severity: 'MEDIUM',
        description: 'พยายามเข้าสู่ระบบด้วย username ที่ไม่ถูกต้อง',
        username: 'unknown',
        ipAddress: '192.168.1.200',
        resolved: false,
      },
      {
        type: 'ACCOUNT_LOCKED',
        severity: 'HIGH',
        description: 'บัญชีถูกล็อคเนื่องจากพยายามเข้าสู่ระบบผิดหลายครั้ง',
        username: 'testuser',
        ipAddress: '192.168.1.201',
        resolved: true,
        resolvedAt: new Date(),
      },
    ]

    for (const incident of incidents) {
      await prisma.securityIncident.create({
        data: incident,
      })
    }
    console.log(`   ✅ สร้าง Security Incidents ${incidents.length} รายการ`)

    // 6. สร้าง Contact Messages ตัวอย่าง
    console.log('\n📧 สร้าง Contact Messages ตัวอย่าง...')
    
    const messages = [
      {
        userId: client.id,
        phone: '081-234-5678',
        message: 'ต้องการสอบถามเกี่ยวกับการบำรุงรักษาแอร์',
        isRead: false,
      },
      {
        userId: client.id,
        phone: '081-234-5678',
        message: 'ขอบคุณสำหรับบริการที่ดี',
        isRead: true,
      },
    ]

    for (const msg of messages) {
      await prisma.contactMessage.create({
        data: msg,
      })
    }
    console.log(`   ✅ สร้าง Contact Messages ${messages.length} รายการ`)

    // 7. สรุปผล
    console.log('\n📊 สรุปผล:')
    const workOrderCount = await prisma.workOrder.count()
    const jobItemCount = await prisma.jobItem.count()
    const feedbackCount = await prisma.feedback.count()
    const notificationCount = await prisma.notification.count()
    const incidentCount = await prisma.securityIncident.count()
    const messageCount = await prisma.contactMessage.count()

    console.log(`   📋 Work Orders: ${workOrderCount} รายการ`)
    console.log(`   🔧 Job Items: ${jobItemCount} รายการ`)
    console.log(`   ⭐ Feedback: ${feedbackCount} รายการ`)
    console.log(`   🔔 Notifications: ${notificationCount} รายการ`)
    console.log(`   🔒 Security Incidents: ${incidentCount} รายการ`)
    console.log(`   📧 Contact Messages: ${messageCount} รายการ`)

    console.log('\n✅ เพิ่มข้อมูลตัวอย่างเสร็จสิ้น!')
    console.log('💡 ตอนนี้ระบบมีข้อมูลครบทุกหน้าแล้ว พร้อมโชว์ให้ลูกค้า')
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
