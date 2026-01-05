/**
 * Script สำหรับสลับ database provider ระหว่าง SQLite และ PostgreSQL
 * 
 * Usage:
 *   node scripts/switch-database.js postgresql
 *   node scripts/switch-database.js sqlite
 */

const fs = require('fs')
const path = require('path')

const targetProvider = process.argv[2]

if (!targetProvider || !['postgresql', 'sqlite'].includes(targetProvider)) {
  console.error('❌ Error: Invalid provider')
  console.error('Usage: node scripts/switch-database.js [postgresql|sqlite]')
  process.exit(1)
}

const schemaPath = path.join(__dirname, '..', 'prisma', 'schema.prisma')
const sourceSchemaPath = path.join(__dirname, '..', 'prisma', `schema.${targetProvider}.prisma`)

if (!fs.existsSync(sourceSchemaPath)) {
  console.error(`❌ Error: Schema file not found: ${sourceSchemaPath}`)
  process.exit(1)
}

try {
  // Backup current schema
  if (fs.existsSync(schemaPath)) {
    const backupPath = `${schemaPath}.backup.${Date.now()}`
    fs.copyFileSync(schemaPath, backupPath)
    console.log(`📦 Backed up current schema to: ${backupPath}`)
  }

  // Copy target schema
  fs.copyFileSync(sourceSchemaPath, schemaPath)
  console.log(`✅ Switched to ${targetProvider.toUpperCase()}`)
  console.log(`\n📝 Next steps:`)
  console.log(`   1. Update DATABASE_URL in .env`)
  console.log(`   2. Run: npm run db:generate`)
  console.log(`   3. Run: npm run db:migrate`)
  
} catch (error) {
  console.error('❌ Error switching database:', error)
  process.exit(1)
}

