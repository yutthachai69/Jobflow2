/**
 * Script สำหรับ reset database และ seed ข้อมูลใหม่
 * ใช้เมื่อเจอ drift หรือต้องการเริ่มต้นใหม่
 * 
 * Usage:
 *   node scripts/reset-and-seed.js
 */

const { execSync } = require('child_process')
const path = require('path')

console.log('🔄 Resetting database and seeding...\n')

try {
  // 1. Reset database (ลบทั้งหมด + migrate ใหม่)
  console.log('📦 Step 1: Resetting database...')
  execSync('npx prisma migrate reset --force', {
    stdio: 'inherit',
    cwd: path.join(__dirname, '..'),
  })

  console.log('\n✅ Database reset completed!')
  console.log('✅ You can now run: npm run dev')
} catch (error) {
  console.error('\n❌ Error:', error.message)
  process.exit(1)
}
