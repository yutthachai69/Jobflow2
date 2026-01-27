/**
 * สคริปต์สำหรับดูข้อมูลจาก Deployed Database
 * 
 * วิธีใช้:
 *   DATABASE_URL="postgresql://user:pass@host:5432/dbname" node scripts/view-deployed-data.js
 * 
 * หรือสร้างไฟล์ .env.deployed แล้วรัน:
 *   node scripts/view-deployed-data.js
 */

const path = require('path')
const fs = require('fs')

// โหลด .env.deployed ถ้ามี
const deployedEnvPath = path.join(__dirname, '..', '.env.deployed')
if (fs.existsSync(deployedEnvPath)) {
  const dotenv = require('dotenv')
  dotenv.config({ path: deployedEnvPath })
}

const databaseUrl = process.env.DATABASE_URL

if (!databaseUrl) {
  console.error('❌ DATABASE_URL is not set!')
  console.error('\nวิธีตั้งค่า:')
  console.error('1. สร้างไฟล์ .env.deployed และใส่ DATABASE_URL')
  console.error('2. หรือรัน: DATABASE_URL="postgresql://..." node scripts/view-deployed-data.js')
  process.exit(1)
}

const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: databaseUrl
    }
  }
})

async function viewData() {
  try {
    await prisma.$connect()
    console.log('✅ Connected to deployed database\n')

    // 1. Users
    console.log('='.repeat(60))
    console.log('👥 USERS')
    console.log('='.repeat(60))
    const users = await prisma.user.findMany({
      include: {
        site: {
          include: {
            client: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
    
    users.forEach(user => {
      const location = user.site 
        ? `${user.site.name} (${user.site.client.name})` 
        : '-'
      const status = user.locked ? '🔒 LOCKED' : '✅ Active'
      console.log(`\n${user.username} (${user.fullName})`)
      console.log(`  Role: ${user.role}`)
      console.log(`  Location: ${location}`)
      console.log(`  Status: ${status}`)
      console.log(`  Created: ${user.createdAt.toLocaleString('th-TH')}`)
    })

    // 2. Work Orders
    console.log('\n' + '='.repeat(60))
    console.log('📋 WORK ORDERS')
    console.log('='.repeat(60))
    const workOrders = await prisma.workOrder.findMany({
      include: {
        site: {
          include: {
            client: true
          }
        },
        jobItems: {
          include: {
            asset: true,
            technician: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    })

    workOrders.forEach(wo => {
      console.log(`\n${wo.workOrderNumber} - ${wo.jobType}`)
      console.log(`  Status: ${wo.status}`)
      console.log(`  Site: ${wo.site.name} (${wo.site.client.name})`)
      console.log(`  Job Items: ${wo.jobItems.length}`)
      console.log(`  Scheduled: ${wo.scheduledDate?.toLocaleDateString('th-TH') || 'N/A'}`)
    })

    // 3. Assets
    console.log('\n' + '='.repeat(60))
    console.log('📦 ASSETS')
    console.log('='.repeat(60))
    const assets = await prisma.asset.findMany({
      include: {
        room: {
          include: {
            floor: {
              include: {
                building: {
                  include: {
                    site: {
                      include: {
                        client: true
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    })

    assets.forEach(asset => {
      const location = asset.room 
        ? `${asset.room.name} > ${asset.room.floor.name} > ${asset.room.floor.building.name} > ${asset.room.floor.building.site.name}`
        : '-'
      console.log(`\n${asset.qrCode} - ${asset.assetType}`)
      console.log(`  Brand/Model: ${asset.brand || '-'} ${asset.model || '-'}`)
      console.log(`  Status: ${asset.status}`)
      console.log(`  Location: ${location}`)
    })

    // 4. Summary
    console.log('\n' + '='.repeat(60))
    console.log('📊 SUMMARY')
    console.log('='.repeat(60))
    const [userCount, assetCount, woCount, jiCount] = await Promise.all([
      prisma.user.count(),
      prisma.asset.count(),
      prisma.workOrder.count(),
      prisma.jobItem.count()
    ])

    console.log(`Total Users:       ${userCount}`)
    console.log(`Total Assets:      ${assetCount}`)
    console.log(`Total Work Orders: ${woCount}`)
    console.log(`Total Job Items:   ${jiCount}`)

    await prisma.$disconnect()
    console.log('\n✅ Done!')
  } catch (error) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  }
}

viewData()
