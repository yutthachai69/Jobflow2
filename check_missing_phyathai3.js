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
      qrCode: true
    }
  });

  const qrCodes = assets.map(a => a.qrCode);
  
  // Extract trailing numbers from QR codes
  // We have formats like 'AC-PTS1-A-F2-001' and '298'
  const numbers = qrCodes.map(q => {
    const match = q.match(/(\d+)$/);
    return match ? parseInt(match[1]) : null;
  }).filter(n => n !== null).sort((a,b) => a-b);
  
  const allExpected = Array.from({length: 302}, (_, i) => i + 1);
  const missing = allExpected.filter(n => !numbers.includes(n));
  
  console.log('Missing sequence numbers:', missing);
}
main().finally(() => prisma.$disconnect());
