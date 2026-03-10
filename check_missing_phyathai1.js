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

  console.log(`Found ${assets.length} assets for รพ.พญาไท`);
  // Print some missing numbers assuming they are sequentially PHY2568-XX
  
  const acPrefix = 'PHY2568-';
  const qrCodes = assets.map(a => a.qrCode);
  
  const numbers = qrCodes
    .filter(q => q.startsWith(acPrefix))
    .map(q => parseInt(q.replace(acPrefix, '')))
    .filter(n => !isNaN(n))
    .sort((a,b) => a-b);
    
  if (numbers.length > 0) {
    const maxNum = Math.max(...numbers);
    const missing = [];
    for(let i=1; i<=maxNum; i++) {
        if(!numbers.includes(i)) missing.push(i);
    }
    console.log(`Missing sequence numbers up to ${maxNum}:`, missing);
  } else {
    console.log('Could not find sequentially numbered assets.');
  }

}
main().finally(() => prisma.$disconnect());
