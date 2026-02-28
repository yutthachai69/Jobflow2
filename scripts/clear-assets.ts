import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('Deleting all work orders and assets...')

    // Delete in order to respect foreign key constraints
    await prisma.jobPhoto.deleteMany()
    await prisma.feedback.deleteMany()
    await prisma.jobItem.deleteMany()
    await prisma.workOrder.deleteMany()
    await prisma.asset.deleteMany()

    console.log('Successfully deleted all assets and work orders.')
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
