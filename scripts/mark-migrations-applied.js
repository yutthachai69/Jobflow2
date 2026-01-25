// scripts/mark-migrations-applied.js
// Mark migrations as applied without running them
const { execSync } = require('child_process')

const migrationsToMark = [
  '20260125000002_add_feedback_notification',
  '20260125000003_add_work_order_number',
]

console.log('🔧 กำลัง mark migrations เป็น applied...\n')

for (const migration of migrationsToMark) {
  try {
    console.log(`📋 Marking ${migration} as applied...`)
    execSync(`npx prisma migrate resolve --applied ${migration}`, {
      stdio: 'inherit',
      cwd: process.cwd(),
    })
    console.log(`   ✅ ${migration} marked as applied\n`)
  } catch (error) {
    console.error(`   ❌ Error marking ${migration}:`, error.message)
  }
}

console.log('✅ เสร็จสิ้น!')
console.log('💡 ตอนนี้ลองรัน: npx prisma migrate dev')
