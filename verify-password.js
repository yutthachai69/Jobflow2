
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkPassword() {
    try {
        const user = await prisma.user.findUnique({
            where: { username: 'admin' },
        });

        if (!user) {
            console.log('User admin not found');
            return;
        }

        console.log('Checking password for user:', user.username);
        const password = 'admin123';
        const isValid = await bcrypt.compare(password, user.password);

        console.log(`Password ${password} is valid:`, isValid);
    } catch (error) {
        console.error('Error checking password:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkPassword();
