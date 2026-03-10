const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient();
const sql = fs.readFileSync('import_phyathai_a.sql', 'utf8');

async function main() {
  console.log('Running SQL...');
  try {
    const queries = sql.split(';').map(s => s.trim()).filter(Boolean);
    for (const q of queries) {
      if (q.toUpperCase() === 'BEGIN' || q.toUpperCase() === 'COMMIT') continue;
      await prisma.$executeRawUnsafe(q);
    }
    console.log('Success! Count:', await prisma.asset.count());
  } catch (error) {
    console.error('Error executing SQL:', error);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
