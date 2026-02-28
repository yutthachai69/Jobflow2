import { PrismaClient, MachineType, AssetType } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('Seeding mock data for Phyathai Sriracha 1 & 2...')

    // 1. Get or Create Client
    let client = await prisma.client.findFirst({
        where: { name: 'โรงพยาบาลพญาไท ศรีราชา' }
    })
    if (!client) {
        client = await prisma.client.create({
            data: { name: 'โรงพยาบาลพญาไท ศรีราชา' }
        })
        console.log('Created Client: โรงพยาบาลพญาไท ศรีราชา')
    }

    // 2. Get or Create Site 1
    let site1 = await prisma.site.findFirst({
        where: { name: 'รพ.พญาไท ศรีราชา 1' }
    })
    if (!site1) {
        site1 = await prisma.site.create({
            data: { name: 'รพ.พญาไท ศรีราชา 1', clientId: client.id }
        })
        console.log('Created Site 1: รพ.พญาไท ศรีราชา 1')
    }

    // 3. Get or Create Site 2
    let site2 = await prisma.site.findFirst({
        where: { name: 'รพ.พญาไท ศรีราชา 2' }
    })
    if (!site2) {
        site2 = await prisma.site.create({
            data: { name: 'รพ.พญาไท ศรีราชา 2', clientId: client.id }
        })
        console.log('Created Site 2: รพ.พญาไท ศรีราชา 2')
    }

    // 4. Setup Locations for Site 1
    let b1 = await prisma.building.findFirst({ where: { siteId: site1.id, name: 'อาคารหลัก' } })
    if (!b1) b1 = await prisma.building.create({ data: { name: 'อาคารหลัก', siteId: site1.id } })

    let f1 = await prisma.floor.findFirst({ where: { buildingId: b1.id, name: 'ชั้นรวม' } })
    if (!f1) f1 = await prisma.floor.create({ data: { name: 'ชั้นรวม', buildingId: b1.id } })

    let r1 = await prisma.room.findFirst({ where: { floorId: f1.id, name: 'พื้นที่รวม' } })
    if (!r1) r1 = await prisma.room.create({ data: { name: 'พื้นที่รวม', floorId: f1.id } })

    // 5. Setup Locations for Site 2
    let b2 = await prisma.building.findFirst({ where: { siteId: site2.id, name: 'อาคาร 2' } })
    if (!b2) b2 = await prisma.building.create({ data: { name: 'อาคาร 2', siteId: site2.id } })

    let f2 = await prisma.floor.findFirst({ where: { buildingId: b2.id, name: 'ชั้นรวม' } })
    if (!f2) f2 = await prisma.floor.create({ data: { name: 'ชั้นรวม', buildingId: b2.id } })

    let r2 = await prisma.room.findFirst({ where: { floorId: f2.id, name: 'พื้นที่รวม' } })
    if (!r2) r2 = await prisma.room.create({ data: { name: 'พื้นที่รวม', floorId: f2.id } })

    // Helper function to create assets in batches
    async function createAssets(roomId: string, prefix: string, machineType: MachineType, count: number) {
        console.log(`Creating ${count} ${machineType} for ${prefix}...`)
        const assets = []
        // Add timestamp to ensure unique QR codes if script is run multiple times
        const uniqueId = Date.now().toString().slice(-4)

        for (let i = 1; i <= count; i++) {
            const code = `${prefix}-${machineType}-${uniqueId}-${i.toString().padStart(3, '0')}`
            assets.push({
                roomId,
                qrCode: code,
                assetType: AssetType.AIR_CONDITIONER,
                machineType,
                brand: 'Default Brand',
                model: `Model-${machineType}`,
                serialNo: code,
                status: 'ACTIVE' as const
            })
        }

        // Prisma createMany is efficient for bulk inserts
        await prisma.asset.createMany({
            data: assets,
            skipDuplicates: true // Just in case
        })
    }

    // Site 1 Data: AHU 30, FCU 96, Split Type 25, Exhaust 151
    console.log('--- Setting up Site 1 Assets ---')
    await createAssets(r1.id, 'PT1', MachineType.AHU, 30)
    await createAssets(r1.id, 'PT1', MachineType.FCU, 96)
    await createAssets(r1.id, 'PT1', MachineType.SPLIT_TYPE, 25)
    await createAssets(r1.id, 'PT1', MachineType.EXHAUST, 151)

    // Site 2 Data: AHU 2, FCU 82, Split Type 1, Exhaust 113
    console.log('--- Setting up Site 2 Assets ---')
    await createAssets(r2.id, 'PT2', MachineType.AHU, 2)
    await createAssets(r2.id, 'PT2', MachineType.FCU, 82)
    await createAssets(r2.id, 'PT2', MachineType.SPLIT_TYPE, 1)
    await createAssets(r2.id, 'PT2', MachineType.EXHAUST, 113)

    console.log('✅ Seeding completed successfully!')

    const totalAssets = await prisma.asset.count()
    console.log(`Total assets in database: ${totalAssets}`)
}

main()
    .catch((e) => {
        console.error('Error during seeding:', e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
