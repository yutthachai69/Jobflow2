/**
 * เปิด Prisma Studio เชื่อมต่อกับ Deployed Database
 * 
 * วิธีใช้:
 *   1. สร้างไฟล์ .env.deployed และใส่ DATABASE_URL ของ deployed database
 *   2. รัน: node scripts/open-deployed-studio.js
 * 
 * หรือ:
 *   DATABASE_URL="postgresql://..." node scripts/open-deployed-studio.js
 */

const path = require('path')
const fs = require('fs')
const { spawn } = require('child_process')

// โหลด .env.deployed ถ้ามี
const deployedEnvPath = path.join(__dirname, '..', '.env.deployed')
if (fs.existsSync(deployedEnvPath)) {
  const dotenv = require('dotenv')
  dotenv.config({ path: deployedEnvPath })
  console.log('📄 Loaded .env.deployed\n')
}

const databaseUrl = process.env.DATABASE_URL

if (!databaseUrl) {
  console.error('❌ DATABASE_URL is not set!')
  console.error('\nวิธีตั้งค่า:')
  console.error('1. สร้างไฟล์ .env.deployed และใส่ DATABASE_URL ของ deployed database')
  console.error('2. หรือรัน: DATABASE_URL="postgresql://..." node scripts/open-deployed-studio.js')
  console.error('\nตัวอย่าง .env.deployed:')
  console.error('DATABASE_URL="postgresql://user:password@host:5432/database"')
  process.exit(1)
}

// Mask password
const maskedUrl = databaseUrl.replace(/:[^:@]+@/, ':****@')
console.log(`🔗 Opening Prisma Studio for: ${maskedUrl}\n`)
console.log('⚠️  WARNING: You are connecting to DEPLOYED database!')
console.log('   Be careful when making changes!\n')

// ตั้งค่า DATABASE_URL ใน environment
process.env.DATABASE_URL = databaseUrl

// รัน Prisma Studio
const studio = spawn('npx', ['prisma', 'studio'], {
  stdio: 'inherit',
  shell: true,
  env: {
    ...process.env,
    DATABASE_URL: databaseUrl
  }
})

studio.on('error', (error) => {
  console.error('❌ Failed to start Prisma Studio:', error.message)
  process.exit(1)
})

studio.on('exit', (code) => {
  if (code !== 0) {
    console.error(`\n❌ Prisma Studio exited with code ${code}`)
  }
})

// Handle Ctrl+C
process.on('SIGINT', () => {
  console.log('\n\n🛑 Stopping Prisma Studio...')
  studio.kill()
  process.exit(0)
})

console.log('✅ Prisma Studio is starting...')
console.log('   Open http://localhost:5555 in your browser')
console.log('   Press Ctrl+C to stop\n')
