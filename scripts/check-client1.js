
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
    const user = await prisma.user.findUnique({
        where: { username: 'client1' },
        select: { id: true, username: true, lineUserId: true, role: true }
    })
    console.log('User Data:', user)
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect()
    })
