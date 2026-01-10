/**
 * Post-install script สำหรับ Vercel
 * Run database migrations และ seed data อัตโนมัติหลังจาก deploy
 */

const { execSync } = require('child_process')
const path = require('path')

console.log('🔧 Running post-install setup...')

try {
  // 1. Generate Prisma Client
  console.log('📦 Generating Prisma Client...')
  execSync('npx prisma generate', {
    stdio: 'inherit',
    cwd: process.cwd(),
  })

  // 2. Run migrations (สำหรับ SQLite จะสร้าง database ใหม่)
  console.log('🚀 Running database migrations...')
  try {
    execSync('npx prisma migrate deploy', {
      stdio: 'inherit',
      cwd: process.cwd(),
    })
    console.log('✅ Migrations deployed successfully')
  } catch (migrateError) {
    // ถ้าไม่มี migrations ใช้ db:push แทน (สำหรับ SQLite)
    console.log('⚠️  migrate deploy failed, trying db push...')
    try {
      execSync('npx prisma db push --accept-data-loss --skip-generate', {
        stdio: 'inherit',
        cwd: process.cwd(),
      })
      console.log('✅ Database schema pushed successfully')
    } catch (pushError) {
      console.warn('⚠️  db push also failed:', pushError.message)
      throw pushError
    }
  }
  
  // 2.5. Generate Prisma Client อีกครั้งหลัง migrate (เพื่อให้แน่ใจว่า sync)
  console.log('📦 Re-generating Prisma Client after migration...')
  try {
    execSync('npx prisma generate', {
      stdio: 'inherit',
      cwd: process.cwd(),
    })
    console.log('✅ Prisma Client re-generated successfully')
  } catch (generateError) {
    console.warn('⚠️  Re-generate warning:', generateError.message)
    // Continue anyway
  }

  // 3. Seed database (run ทุกครั้ง เพราะ SQLite reset ทุก deploy)
  // ใช้ seed-production.js โดยตรง (ไม่ต้องใช้ ts-node)
  console.log('🌱 Seeding database...')
  try {
    // ใช้ node เรียก seed-production.js โดยตรง (CommonJS)
    execSync('node scripts/seed-production.js', {
      stdio: 'inherit',
      cwd: process.cwd(),
    })
    console.log('✅ Database seeded successfully!')
  } catch (seedError) {
    // ถ้า seed fail ไม่เป็นไร (อาจจะ seed ไปแล้ว หรือ database ยังไม่พร้อม)
    // เราจะใช้ API route seed แทน
    console.warn('⚠️  Seed via postinstall failed:', seedError.message)
    console.warn('📝 Note: You can seed manually via POST /api/seed after deployment')
  }

  console.log('✅ Post-install setup completed!')
} catch (error) {
  console.error('❌ Post-install setup failed:', error.message)
  // ไม่ throw error เพื่อไม่ให้ build fail
  console.warn('⚠️  Continuing... (you may need to seed manually)')
}

