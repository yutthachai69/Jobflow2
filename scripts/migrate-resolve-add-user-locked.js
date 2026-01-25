/**
 * ทำเทียบเท่า: prisma migrate resolve --applied 20260125000000_add_user_locked
 * ใช้เมื่อเรา apply migration add_user_locked ไปแล้วด้วย raw SQL
 * Usage: node scripts/migrate-resolve-add-user-locked.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') })
const fs = require('fs')
const crypto = require('crypto')
const path = require('path')
const { PrismaClient } = require('@prisma/client')

const MIGRATION_NAME = '20260125000000_add_user_locked'
const MIGRATION_DIR = path.join(__dirname, '..', 'prisma', 'migrations', MIGRATION_NAME)

const prisma = new PrismaClient()

async function main() {
  const sqlPath = path.join(MIGRATION_DIR, 'migration.sql')
  if (!fs.existsSync(sqlPath)) {
    console.error('Migration file not found:', sqlPath)
    process.exit(1)
  }

  const sql = fs.readFileSync(sqlPath, 'utf8')
  const checksum = crypto.createHash('sha256').update(sql).digest('hex')
  const id = crypto.randomUUID()
  const now = new Date().toISOString()

  const existing = await prisma.$queryRawUnsafe(
    'SELECT 1 FROM _prisma_migrations WHERE migration_name = ?',
    MIGRATION_NAME
  )
  if (existing && existing.length > 0) {
    console.log('Migration already marked as applied. Skip.')
    return
  }

  await prisma.$executeRawUnsafe(
    `INSERT INTO _prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count)
     VALUES (?, ?, ?, ?, NULL, NULL, ?, 1)`,
    id,
    checksum,
    now,
    MIGRATION_NAME,
    now
  )

  console.log('OK: Marked migration', MIGRATION_NAME, 'as applied.')
}

main()
  .finally(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
