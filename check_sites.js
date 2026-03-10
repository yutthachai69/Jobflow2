const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const sites = await prisma.site.findMany({
    include: { buildings: true }
  });
  console.log('Existing sites:');
  sites.forEach(s => console.log(`- ${s.name} (Buildings: ${s.buildings.map(b=>b.name).join(', ')})`));
}
main().finally(() => prisma.$disconnect());
