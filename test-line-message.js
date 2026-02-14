
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const https = require('https');

async function testLineMessage() {
    try {
        console.log('--- 1. Checking Database for Users with LINE ID ---');
        const users = await prisma.user.findMany({
            where: {
                lineUserId: { not: null }
            },
            select: {
                id: true,
                username: true,
                fullName: true,
                role: true,
                lineUserId: true,
                site: {
                    select: { name: true }
                }
            }
        });

        if (users.length === 0) {
            console.log('❌ No users found with Line User ID.');
            console.log('Please edit a user and add a Line User ID first.');
            return;
        }

        console.log(`✅ Found ${users.length} users with Line User ID:`);
        console.log(JSON.stringify(users, null, 2));

        console.log('\n--- 2. Sending Test Message ---');

        // Check if Token Exists (We can't access process.env easily here if not loaded, assume user runs with dotenv or we hardcode for test if needed)
        // For this script, we will try to load from .env using a helper or just ask user to set it.
        // Actually, prisma client loads env, but standard process.env might not be populated for other libs unless we use dotenv.
        // Let's try to read it or just use what we have.

        // Simplest way: relying on pre-loaded env or instructing user. 
        // But since I am running it via `node`, I should probably use `dotenv`.
        // I'll try to require dotenv if available, otherwise warn.
        try { require('dotenv').config(); } catch (e) { console.log('Note: dotenv not found, assuming env vars are set.'); }

        const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
        if (!token) {
            console.error('❌ LINE_CHANNEL_ACCESS_TOKEN is missing in .env file');
            return;
        }

        for (const user of users) {
            if (!user.lineUserId) continue;

            console.log(`Sending test message to ${user.username} (${user.lineUserId})...`);

            const message = {
                to: user.lineUserId,
                messages: [
                    {
                        type: "text",
                        text: "🔔 ทดสอบการเชื่อมต่อ LINE Notification สำเร็จ! (Jobflow System)"
                    }
                ]
            };

            await new Promise((resolve, reject) => {
                const req = https.request({
                    hostname: 'api.line.me',
                    path: '/v2/bot/message/push',
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    }
                }, (res) => {
                    let data = '';
                    res.on('data', chunk => data += chunk);
                    res.on('end', () => {
                        if (res.statusCode === 200) {
                            console.log(`✅ Success! Message sent to ${user.username}`);
                            resolve();
                        } else {
                            console.error(`❌ Failed to send to ${user.username}. Status: ${res.statusCode}`);
                            console.error(`Response: ${data}`);
                            resolve(); // Resolve to verify others
                        }
                    });
                });

                req.on('error', (e) => {
                    console.error(`❌ Error sending request: ${e.message}`);
                    resolve();
                });

                req.write(JSON.stringify(message));
                req.end();
            });
        }

    } catch (error) {
        console.error('Unexpected error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

testLineMessage();
