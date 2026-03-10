const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const assets = await prisma.asset.findMany({
    where: {
      room: {
        floor: {
          building: {
            site: {
              name: 'รพ.พญาไท'
            }
          }
        }
      }
    },
    select: {
      qrCode: true,
      assetType: true
    }
  });

  const qrCodes = assets.map(a => a.qrCode);
  console.log(`Examples of QR Codes for รพ.พญาไท:`);
  console.log(qrCodes.slice(0, 5));
  console.log(qrCodes.slice(-5));
  
  // Total assets in DB?
  const allAssetsCount = await prisma.asset.count();
  console.log(`Total Assets in the whole database (all sites): ${allAssetsCount}`);

}
main().finally(() => prisma.$disconnect());
