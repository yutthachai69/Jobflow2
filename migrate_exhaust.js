const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const res = await prisma.asset.updateMany({
    where: { assetType: 'OTHER', machineType: 'EXHAUST' },
    data: { assetType: 'EXHAUST' }
  });
  console.log('Updated:', res.count);
}
main().finally(() => prisma.$disconnect());
