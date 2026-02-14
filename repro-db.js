
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('Testing database connection...');
    try {
        const user = await prisma.user.findUnique({
            where: { username: 'admin' },
        });
        console.log('User found:', user);
    } catch (error) {
        console.error('Database connection error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
