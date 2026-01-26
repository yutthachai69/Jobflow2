/**
 * Script สำหรับ reset password ของ admin user
 * ใช้เมื่อต้องการเปลี่ยน password หรือแก้ไข password hash ที่ผิด
 */

const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  console.log('🔐 กำลัง reset password สำหรับ admin user...\n')

  try {
    // 1. หา admin user
    const adminUser = await prisma.user.findUnique({
      where: { username: 'admin' },
    })

    if (!adminUser) {
      console.error('❌ ไม่พบ admin user ในฐานข้อมูล!')
      console.log('💡 ลองรัน seed script: npm run db:seed')
      process.exit(1)
    }

    console.log(`✅ พบ admin user: ${adminUser.username} (ID: ${adminUser.id})`)

    // 2. Hash password ใหม่ (admin123)
    const newPassword = 'admin123'
    const passwordHash = await bcrypt.hash(newPassword, 10)
    console.log(`\n🔑 กำลัง hash password: "${newPassword}"`)

    // 3. อัพเดท password
    await prisma.user.update({
      where: { id: adminUser.id },
      data: {
        password: passwordHash,
        locked: false,
        lockedUntil: null,
        lockedReason: null,
      },
    })

    console.log('✅ อัพเดท password สำเร็จ!')
    console.log(`\n📝 ข้อมูลการ login:`)
    console.log(`   Username: admin`)
    console.log(`   Password: ${newPassword}`)
    console.log(`\n💡 ลอง login ด้วยข้อมูลนี้ดูครับ`)

  } catch (error) {
    console.error('\n❌ เกิดข้อผิดพลาด:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
