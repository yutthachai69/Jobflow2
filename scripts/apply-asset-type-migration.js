// scripts/apply-asset-type-migration.js
const { PrismaClient } = require('@prisma/client')
const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

const prisma = new PrismaClient()

async function main() {
  console.log('🔧 กำลังตรวจสอบและเพิ่ม assetType field...')

  try {
    // ตรวจสอบว่า assetType field มีอยู่แล้วหรือไม่
    const result = await prisma.$queryRaw`
      SELECT sql FROM sqlite_master 
      WHERE type='table' AND name='Asset'
    `
    
    const tableSql = result[0]?.sql || ''
    const hasAssetType = tableSql.includes('assetType')

    if (hasAssetType) {
      console.log('✅ assetType field มีอยู่แล้ว')
    } else {
      console.log('⚠️  ยังไม่มี assetType field กำลังเพิ่ม...')
      
      // เพิ่ม column assetType
      await prisma.$executeRaw`
        ALTER TABLE "Asset" ADD COLUMN "assetType" TEXT NOT NULL DEFAULT 'AIR_CONDITIONER'
      `
      
      console.log('✅ เพิ่ม assetType column สำเร็จ')
      
      // สร้าง index
      try {
        await prisma.$executeRaw`
          CREATE INDEX IF NOT EXISTS "Asset_assetType_idx" ON "Asset"("assetType")
        `
        console.log('✅ สร้าง index สำเร็จ')
      } catch (e) {
        console.log('⚠️  index อาจจะมีอยู่แล้ว:', e.message)
      }
    }

    // ตรวจสอบจำนวน assets
    const assetCount = await prisma.asset.count()
    console.log(`📊 จำนวนทรัพย์สินในระบบ: ${assetCount} รายการ`)

    if (assetCount === 0) {
      console.log('\n💡 ยังไม่มีทรัพย์สินในระบบ')
      console.log('   รันคำสั่ง: npx prisma db seed')
      console.log('   หรือ: npx tsx scripts/add-50-assets.ts')
    }

    console.log('\n✅ เสร็จสิ้น')
  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาด:', error)
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
