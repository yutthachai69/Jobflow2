/**
 * Script สำหรับตรวจสอบ database connection และ provider
 * 
 * Usage:
 *   node scripts/check-database.js
 */

const { PrismaClient } = require('@prisma/client')
const fs = require('fs')
const path = require('path')

async function checkDatabase() {
  console.log('🔍 Checking database configuration...\n')

  // Check schema.prisma
  const schemaPath = path.join(__dirname, '..', 'prisma', 'schema.prisma')
  if (!fs.existsSync(schemaPath)) {
    console.error('❌ schema.prisma not found')
    process.exit(1)
  }

  const schemaContent = fs.readFileSync(schemaPath, 'utf-8')
  const providerMatch = schemaContent.match(/provider\s*=\s*"(\w+)"/)
  const provider = providerMatch ? providerMatch[1] : 'unknown'

  console.log(`📄 Schema Provider: ${provider.toUpperCase()}`)

  // Check DATABASE_URL
  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) {
    console.error('❌ DATABASE_URL is not set')
    process.exit(1)
  }

  console.log(`🔗 DATABASE_URL: ${databaseUrl.replace(/:[^:@]+@/, ':****@')}`)

  // Detect provider from URL
  let detectedProvider = 'unknown'
  if (databaseUrl.startsWith('file:')) {
    detectedProvider = 'sqlite'
  } else if (databaseUrl.startsWith('postgresql://')) {
    detectedProvider = 'postgresql'
  }

  console.log(`🔍 Detected Provider: ${detectedProvider.toUpperCase()}`)

  // Check if provider matches
  if (provider !== detectedProvider) {
    console.warn(`\n⚠️  WARNING: Schema provider (${provider}) doesn't match DATABASE_URL provider (${detectedProvider})`)
    console.warn('   You may need to switch schema:')
    if (detectedProvider === 'postgresql') {
      console.warn('   npm run db:switch:postgres')
    } else {
      console.warn('   npm run db:switch:sqlite')
    }
  }

  // Test connection
  console.log('\n🔌 Testing database connection...')
  try {
    const prisma = new PrismaClient()
    await prisma.$connect()
    console.log('✅ Database connection successful')
    
    // Test query
    const userCount = await prisma.user.count()
    console.log(`📊 Users in database: ${userCount}`)
    
    await prisma.$disconnect()
  } catch (error) {
    console.error('❌ Database connection failed:', error.message)
    console.error('\nTroubleshooting:')
    console.error('1. Check DATABASE_URL is correct')
    console.error('2. Check database server is running')
    console.error('3. Check network/firewall settings')
    process.exit(1)
  }

  console.log('\n✅ Database check completed')
}

checkDatabase()

