/**
 * Script สำหรับ migrate data จาก SQLite ไป PostgreSQL
 * 
 * Usage:
 *   # Set environment variables
 *   set SQLITE_DATABASE_URL=file:./prisma/dev.db
 *   set POSTGRES_DATABASE_URL=postgresql://user:password@localhost:5432/airservice
 *   
 *   # Run migration
 *   node scripts/migrate-data-to-postgresql.js
 * 
 * Prerequisites:
 *   - SQLite database ต้องมีข้อมูล
 *   - PostgreSQL database ต้องถูกสร้างแล้ว (empty)
 *   - ต้อง switch schema เป็น PostgreSQL ก่อน: npm run db:switch:postgres
 *   - Environment variables ต้องตั้งค่า SQLITE_DATABASE_URL และ POSTGRES_DATABASE_URL
 */

const { PrismaClient } = require('@prisma/client')

// SQLite connection
const sqliteUrl = process.env.SQLITE_DATABASE_URL || 'file:./prisma/dev.db'
if (!sqliteUrl.startsWith('file:')) {
  console.error('❌ Error: SQLITE_DATABASE_URL must be a SQLite connection string (file:...)')
  process.exit(1)
}

const sqlitePrisma = new PrismaClient({
  datasources: {
    db: {
      url: sqliteUrl,
    },
  },
})

// PostgreSQL connection
const postgresUrl = process.env.POSTGRES_DATABASE_URL || process.env.DATABASE_URL
if (!postgresUrl || !postgresUrl.startsWith('postgresql://')) {
  console.error('❌ Error: POSTGRES_DATABASE_URL or DATABASE_URL must be set to PostgreSQL connection string')
  console.error('   Example: postgresql://user:password@localhost:5432/airservice')
  console.error('\n   Set it with:')
  console.error('   Windows: set POSTGRES_DATABASE_URL=postgresql://...')
  console.error('   Linux/Mac: export POSTGRES_DATABASE_URL=postgresql://...')
  process.exit(1)
}

const postgresPrisma = new PrismaClient({
  datasources: {
    db: {
      url: postgresUrl,
    },
  },
})

async function migrateData() {
  console.log('🚀 Starting data migration from SQLite to PostgreSQL...\n')
  console.log(`📦 Source (SQLite): ${sqliteUrl}`)
  console.log(`📦 Target (PostgreSQL): ${postgresUrl.replace(/:[^:@]+@/, ':****@')}\n`)

  try {
    // Test connections
    console.log('🔌 Testing connections...')
    await sqlitePrisma.$connect()
    console.log('✅ SQLite connection OK')
    
    await postgresPrisma.$connect()
    console.log('✅ PostgreSQL connection OK\n')

    // 1. Migrate Clients
    console.log('📦 Migrating Clients...')
    const clients = await sqlitePrisma.client.findMany()
    for (const client of clients) {
      await postgresPrisma.client.upsert({
        where: { id: client.id },
        update: {},
        create: client,
      })
    }
    console.log(`✅ Migrated ${clients.length} clients`)

    // 2. Migrate Sites
    console.log('\n📦 Migrating Sites...')
    const sites = await sqlitePrisma.site.findMany()
    for (const site of sites) {
      await postgresPrisma.site.upsert({
        where: { id: site.id },
        update: {},
        create: site,
      })
    }
    console.log(`✅ Migrated ${sites.length} sites`)

    // 3. Migrate Buildings
    console.log('\n📦 Migrating Buildings...')
    const buildings = await sqlitePrisma.building.findMany()
    for (const building of buildings) {
      await postgresPrisma.building.upsert({
        where: { id: building.id },
        update: {},
        create: building,
      })
    }
    console.log(`✅ Migrated ${buildings.length} buildings`)

    // 4. Migrate Floors
    console.log('\n📦 Migrating Floors...')
    const floors = await sqlitePrisma.floor.findMany()
    for (const floor of floors) {
      await postgresPrisma.floor.upsert({
        where: { id: floor.id },
        update: {},
        create: floor,
      })
    }
    console.log(`✅ Migrated ${floors.length} floors`)

    // 5. Migrate Rooms
    console.log('\n📦 Migrating Rooms...')
    const rooms = await sqlitePrisma.room.findMany()
    for (const room of rooms) {
      await postgresPrisma.room.upsert({
        where: { id: room.id },
        update: {},
        create: room,
      })
    }
    console.log(`✅ Migrated ${rooms.length} rooms`)

    // 6. Migrate Users
    console.log('\n📦 Migrating Users...')
    const users = await sqlitePrisma.user.findMany()
    for (const user of users) {
      await postgresPrisma.user.upsert({
        where: { id: user.id },
        update: {},
        create: user,
      })
    }
    console.log(`✅ Migrated ${users.length} users`)

    // 7. Migrate Assets
    console.log('\n📦 Migrating Assets...')
    const assets = await sqlitePrisma.asset.findMany()
    for (const asset of assets) {
      await postgresPrisma.asset.upsert({
        where: { id: asset.id },
        update: {},
        create: asset,
      })
    }
    console.log(`✅ Migrated ${assets.length} assets`)

    // 8. Migrate Work Orders
    console.log('\n📦 Migrating Work Orders...')
    const workOrders = await sqlitePrisma.workOrder.findMany()
    for (const workOrder of workOrders) {
      await postgresPrisma.workOrder.upsert({
        where: { id: workOrder.id },
        update: {},
        create: workOrder,
      })
    }
    console.log(`✅ Migrated ${workOrders.length} work orders`)

    // 9. Migrate Job Items
    console.log('\n📦 Migrating Job Items...')
    const jobItems = await sqlitePrisma.jobItem.findMany()
    for (const jobItem of jobItems) {
      await postgresPrisma.jobItem.upsert({
        where: { id: jobItem.id },
        update: {},
        create: jobItem,
      })
    }
    console.log(`✅ Migrated ${jobItems.length} job items`)

    // 10. Migrate Job Photos
    console.log('\n📦 Migrating Job Photos...')
    const jobPhotos = await sqlitePrisma.jobPhoto.findMany()
    for (const jobPhoto of jobPhotos) {
      await postgresPrisma.jobPhoto.upsert({
        where: { id: jobPhoto.id },
        update: {},
        create: jobPhoto,
      })
    }
    console.log(`✅ Migrated ${jobPhotos.length} job photos`)

    // 11. Migrate Contact Info
    console.log('\n📦 Migrating Contact Info...')
    const contactInfos = await sqlitePrisma.contactInfo.findMany()
    for (const contactInfo of contactInfos) {
      await postgresPrisma.contactInfo.upsert({
        where: { id: contactInfo.id },
        update: {},
        create: contactInfo,
      })
    }
    console.log(`✅ Migrated ${contactInfos.length} contact info records`)

    // 12. Migrate Contact Messages
    console.log('\n📦 Migrating Contact Messages...')
    const contactMessages = await sqlitePrisma.contactMessage.findMany()
    for (const contactMessage of contactMessages) {
      await postgresPrisma.contactMessage.upsert({
        where: { id: contactMessage.id },
        update: {},
        create: contactMessage,
      })
    }
    console.log(`✅ Migrated ${contactMessages.length} contact messages`)

    // 13. Migrate Security Incidents
    console.log('\n📦 Migrating Security Incidents...')
    const securityIncidents = await sqlitePrisma.securityIncident.findMany()
    for (const incident of securityIncidents) {
      await postgresPrisma.securityIncident.upsert({
        where: { id: incident.id },
        update: {},
        create: incident,
      })
    }
    console.log(`✅ Migrated ${securityIncidents.length} security incidents`)

    console.log('\n🎉 Migration completed successfully!')
    console.log('\n⚠️  Next steps:')
    console.log('1. Update DATABASE_URL in .env to PostgreSQL connection string')
    console.log('2. Run: npm run db:generate')
    console.log('3. Test the application')
    console.log('4. Verify all data is correct')

  } catch (error) {
    console.error('\n❌ Migration failed:', error)
    console.error('\nTroubleshooting:')
    console.error('1. Make sure PostgreSQL database is created and empty')
    console.error('2. Make sure schema is switched to PostgreSQL: npm run db:switch:postgres')
    console.error('3. Check connection strings are correct')
    process.exit(1)
  } finally {
    await sqlitePrisma.$disconnect()
    await postgresPrisma.$disconnect()
  }
}

// Run migration
migrateData()
