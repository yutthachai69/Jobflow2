/**
 * Script สำหรับตรวจสอบและแก้ไข password ของ admin user
 * ใช้เมื่อ login ไม่ได้แม้ว่าจะมี user ในฐานข้อมูล
 */

const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  console.log('🔍 กำลังตรวจสอบ admin user และ password...\n')

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

    console.log(`✅ พบ admin user:`)
    console.log(`   ID: ${adminUser.id}`)
    console.log(`   Username: ${adminUser.username}`)
    console.log(`   Role: ${adminUser.role}`)
    console.log(`   Locked: ${adminUser.locked}`)
    console.log(`   Password Hash: ${adminUser.password.substring(0, 20)}...`)

    // 2. ทดสอบ password ที่เป็นไปได้
    const testPasswords = ['admin123', 'admin', 'password', '123456']
    console.log(`\n🔐 กำลังทดสอบ password...`)

    let foundMatch = false
    for (const testPassword of testPasswords) {
      const isValid = await bcrypt.compare(testPassword, adminUser.password)
      if (isValid) {
        console.log(`✅ Password ที่ถูกต้อง: "${testPassword}"`)
        foundMatch = true
        break
      }
    }

    if (!foundMatch) {
      console.log(`❌ ไม่พบ password ที่ตรงกับ hash ในฐานข้อมูล`)
      console.log(`\n🔧 กำลัง reset password เป็น "admin123"...`)
      
      const newPassword = 'admin123'
      const passwordHash = await bcrypt.hash(newPassword, 10)
      
      await prisma.user.update({
        where: { id: adminUser.id },
        data: {
          password: passwordHash,
          locked: false,
          lockedUntil: null,
          lockedReason: null,
        },
      })

      console.log('✅ Reset password สำเร็จ!')
      console.log(`\n📝 ข้อมูลการ login:`)
      console.log(`   Username: admin`)
      console.log(`   Password: ${newPassword}`)
    } else {
      console.log(`\n✅ Password hash ถูกต้อง ไม่ต้อง reset`)
    }

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
