/**
 * Script สำหรับสร้างตารางใน PostgreSQL โดยใช้ Prisma db push
 * ใช้เมื่อ migrations เก่าเป็น SQLite syntax
 */

const { execSync } = require('child_process')
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  console.log('🚀 กำลังสร้างตารางใน PostgreSQL...\n')

  try {
    // 1. ตรวจสอบว่ามีตารางอยู่แล้วหรือไม่
    console.log('📋 ตรวจสอบตารางที่มีอยู่...')
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
    `
    
    console.log(`   พบตาราง ${tables.length} ตาราง:`)
    tables.forEach(t => console.log(`   - ${t.table_name}`))
    
    if (tables.length > 0) {
      console.log('\n⚠️  มีตารางอยู่แล้ว! ต้องการลบและสร้างใหม่หรือไม่?')
      console.log('   (ถ้าใช่ ให้รัน: npx prisma db push --force-reset)')
      return
    }

    // 2. ใช้ db push เพื่อสร้างตาราง
    console.log('\n📝 กำลังสร้างตารางด้วย prisma db push...')
    try {
      execSync('npx prisma db push --skip-generate', {
        stdio: 'inherit',
        cwd: process.cwd(),
      })
      console.log('\n✅ สร้างตารางสำเร็จ!')
    } catch (error) {
      console.error('\n❌ db push ล้มเหลว:', error.message)
      throw error
    }

    // 3. ตรวจสอบอีกครั้ง
    console.log('\n📋 ตรวจสอบตารางที่สร้างแล้ว...')
    const newTables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `
    
    console.log(`\n✅ พบตาราง ${newTables.length} ตาราง:`)
    newTables.forEach(t => console.log(`   ✓ ${t.table_name}`))

  } catch (error) {
    console.error('\n❌ เกิดข้อผิดพลาด:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
