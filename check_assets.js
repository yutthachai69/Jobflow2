const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const assets = await prisma.asset.findMany({
    include: {
      room: {
        include: {
          floor: {
            include: {
              building: {
                include: {
                  site: true
                }
              }
            }
          }
        }
      }
    }
  });
  console.log('Total assets:', assets.length);
  // Just log a few to see the structure and names
  console.log(JSON.stringify(assets.slice(0, 3), null, 2));
}

main().finally(() => prisma.$disconnect());
