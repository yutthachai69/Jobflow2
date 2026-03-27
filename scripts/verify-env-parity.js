/**
 * ตรวจว่า DB ที่ชี้ด้วย DATABASE_URL "พร้อม" กับ Prisma schema หรือไม่
 * ใช้เทียบ dev / prod / Vercel โดยชี้ URL คนละชุดแล้วรันสคริปต์เดียวกัน
 *
 * ใช้งาน:
 *   npm run verify:parity
 *   npm run verify:parity -- path/to/.env.production.local
 *
 * เทียบกับ Vercel:
 *   npx vercel env pull .env.production.local
 *   npm run verify:parity -- .env.production.local
 */

const path = require('path')
const { execSync } = require('child_process')

const envPath =
  process.argv[2] || path.join(__dirname, '..', '.env')

require('dotenv').config({ path: envPath })

/** คอลัมน์ที่ schema ใช้ — ถ้า DB ไม่มี Prisma จะ error ตอนรัน (เช่น P2022) */
const PG_COLUMN_CHECKS = [
  {
    table: 'JobItem',
    column: 'adHocPmType',
    note: 'PM มือ + กราฟล้าง — ถ้าไม่มีให้รัน migration หรือ npm run db:add-adhoc-pm-type',
  },
]

function redactDbUrl(url) {
  if (!url || typeof url !== 'string') return '(ไม่มี DATABASE_URL)'
  try {
    const u = new URL(url.replace(/^postgres(ql)?:/i, 'http:'))
    const db = (u.pathname || '').replace(/^\//, '') || '(ไม่มีชื่อ DB)'
    const q = u.search ? `${u.search.slice(0, 40)}…` : ''
    return `${u.hostname}:${u.port || '5432'} / ${db}${q ? ` ${q}` : ''} (user: ${u.username || '?'})`
  } catch {
    if (url.startsWith('file:')) return `SQLite ${url.slice(0, 60)}…`
    return '(parse URL ไม่ได้ — ตรวจรูปแบบ DATABASE_URL)'
  }
}

function isPostgresUrl(url) {
  if (!url || typeof url !== 'string') return false
  return /^postgres(ql)?:/i.test(url)
}

async function main() {
  console.log('=== verify-env-parity ===\n')
  console.log(`ไฟล์ env: ${path.resolve(envPath)}`)
  console.log(`DATABASE_URL → ${redactDbUrl(process.env.DATABASE_URL)}`)

  if (process.env.DIRECT_URL) {
    console.log(`DIRECT_URL   → ${redactDbUrl(process.env.DIRECT_URL)}`)
  } else if (isPostgresUrl(process.env.DATABASE_URL)) {
    console.log(
      'คำเตือน: ไม่มี DIRECT_URL — migrate deploy บางทีต้องใช้ direct connection (Supabase 5432)'
    )
  }

  if (!process.env.DATABASE_URL) {
    console.error('\nล้มเหลว: ไม่มี DATABASE_URL')
    process.exit(1)
  }

  try {
    execSync('npx prisma validate', {
      cwd: path.join(__dirname, '..'),
      stdio: 'inherit',
    })
  } catch {
    console.error('\nล้มเหลว: prisma validate')
    process.exit(1)
  }

  const { PrismaClient } = require('@prisma/client')
  const prisma = new PrismaClient()

  let failed = false

  try {
    await prisma.$queryRaw`SELECT 1 AS ok`
    console.log('\nการเชื่อมต่อ DB: สำเร็จ')

    if (!isPostgresUrl(process.env.DATABASE_URL)) {
      console.log(
        '(ข้ามการเช็กคอลัมน์ PostgreSQL — ใช้ SQLite หรือ provider อื่น)'
      )
      return
    }

    for (const { table, column, note } of PG_COLUMN_CHECKS) {
      const rows = await prisma.$queryRaw`
        SELECT 1 AS ok
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = ${table}
          AND column_name = ${column}
        LIMIT 1
      `
      const ok = Array.isArray(rows) && rows.length > 0
      if (ok) {
        console.log(`  ✓ "${table}"."${column}" มีอยู่`)
      } else {
        console.log(`  ✗ "${table}"."${column}" ไม่มี — ${note}`)
        failed = true
      }
    }

    try {
      const migrations = await prisma.$queryRaw`
        SELECT migration_name, finished_at
        FROM "_prisma_migrations"
        WHERE rolled_back_at IS NULL
        ORDER BY finished_at DESC NULLS LAST
        LIMIT 8
      `
      if (Array.isArray(migrations) && migrations.length > 0) {
        console.log('\n_migration ล่าสุด (สูงสุด 8 แถว):')
        for (const m of migrations) {
          const name = m.migration_name || '?'
          const at = m.finished_at ? new Date(m.finished_at).toISOString() : '(ยังไม่จบ)'
          console.log(`  - ${name}  @ ${at}`)
        }
      }
    } catch (e) {
      console.log(
        '\nคำเตือน: อ่าน _prisma_migrations ไม่ได้ (DB อาจ baseline มือ / ไม่มีประวัติ migration)'
      )
      if (e && e.message) console.log(`  (${e.message})`)
    }
  } catch (e) {
    console.error('\nล้มเหลว: เชื่อมต่อหรือ query DB')
    console.error(e)
    failed = true
  } finally {
    await prisma.$disconnect()
  }

  if (failed) {
    console.error(
      '\nสรุป: DB นี้ไม่ตรงกับที่ schema คาดไว้ — แก้บน DB ชุดนี้แล้วรันสคริปต์นี้ซ้ำ'
    )
    process.exit(1)
  }

  console.log(
    '\nผ่าน — ถ้า Vercel ยังพัง ให้ยืนยันว่า Vercel ใช้ DATABASE_URL ชี้มาที่ host/DB เดียวกับที่รันสคริปต์นี้'
  )
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
