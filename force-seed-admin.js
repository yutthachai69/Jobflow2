
// force-seed-admin.js
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

// ⚠️ สำคัญ: สคริปต์นี้จะใช้ DATABASE_URL จาก .env หรือที่กำหนดในบรรทัดนี้
// ถ้าจะรันใส่ Production ต้องแก้ DATABASE_URL ใน .env ชั่วคราว หรือส่ง environment variable มาตอนรัน
const prisma = new PrismaClient();

async function main() {
    console.log('🔄 Checking Admin User...');

    const adminExists = await prisma.user.findUnique({
        where: { username: 'admin' },
    });

    if (adminExists) {
        console.log('✅ Admin user already exists.');
        // Optional: Reset password just in case
        // const newPassword = await bcrypt.hash('admin123', 10);
        // await prisma.user.update({
        //   where: { username: 'admin' },
        //   data: { password: newPassword },
        // });
        // console.log('🔄 Password reset to "admin123" just in case.');
    } else {
        console.log('⚠️ Admin user NOT found. Creating...');
        const hashedPassword = await bcrypt.hash('admin123', 10);

        await prisma.user.create({
            data: {
                username: 'admin',
                password: hashedPassword,
                fullName: 'System Admin',
                role: 'ADMIN',
            },
        });
        console.log('✅ Admin user created successfully.');
    }
}

main()
    .catch((e) => {
        console.error('❌ Error:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
