const fs = require('fs');
const rawData = fs.readFileSync('raw_aircon.sql', 'utf8');
const lines = rawData.split('\n').filter(line => line.trim() && line.includes('aircon_plan_minimal'));

let codeOutput = `const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  await prisma.client.upsert({
    where: { id: 'CLIENT_DEFAULT' },
    update: {},
    create: { id: 'CLIENT_DEFAULT', name: 'ลูกค้าทั่วไป' }
  });

  await prisma.site.upsert({
    where: { id: 'SITE_PHYATHAI' },
    update: {},
    create: { id: 'SITE_PHYATHAI', name: 'รพ.พญาไท', clientId: 'CLIENT_DEFAULT' }
  });

  await prisma.building.upsert({
    where: { id: 'BLD_PHY_A' },
    update: {},
    create: { id: 'BLD_PHY_A', name: 'A', siteId: 'SITE_PHYATHAI' }
  });

  await prisma.floor.upsert({
    where: { id: 'FLR_PHY_A_2' },
    update: {},
    create: { id: 'FLR_PHY_A_2', name: 'ชั้น 2', buildingId: 'BLD_PHY_A' }
  });

  await prisma.floor.upsert({
    where: { id: 'FLR_PHY_A_3' },
    update: {},
    create: { id: 'FLR_PHY_A_3', name: 'ชั้น 3', buildingId: 'BLD_PHY_A' }
  });
`;

const rooms = new Set();
const ops = [];

for (const line of lines) {
  const match = line.match(/aircon_plan_minimal\s*\(\s*'([^']+)'\s*,\s*(?:'([^']+)'|NULL)\s*,\s*(?:'([^']+)'|NULL)\s*,\s*(?:'([^']+)'|NULL)\s*,\s*(?:'([^']+)'|NULL)\s*\);/);
  if (match) {
    let [, no, building, floorRaw, roomNameRaw, assetCodeRaw] = match;
    const roomName = roomNameRaw.trim();
    
    // Convert 2.0 to 2, 3.0 to 3
    const floor = floorRaw.replace('.0', '');
    const floorId = floor === '2' ? 'FLR_PHY_A_2' : 'FLR_PHY_A_3';
    
    // Normalize Room ID
    const roomId = 'RM_PHY_A_' + floor + '_' + no;
    
    // Asset Code and types
    const assetCode = assetCodeRaw.replace('.0', ''); // Clean the .0 up
    const assetId = 'ASSET_' + assetCode;

    if (!rooms.has(roomId)) {
      rooms.add(roomId);
      ops.push(`  await prisma.room.upsert({
    where: { id: '${roomId}' },
    update: {},
    create: { id: '${roomId}', name: '${roomName}', floorId: '${floorId}' }
  });`);
    }

    ops.push(`  await prisma.asset.upsert({
    where: { qrCode: '${assetCode}' },
    update: {},
    create: { id: '${assetId}', qrCode: '${assetCode}', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: '${roomId}' }
  });`);
  }
}

codeOutput += ops.join('\n');
codeOutput += `\n  const count = await prisma.asset.count();\n  console.log('Final Asset Count:', count);\n}\n\nmain().catch(console.error).finally(() => prisma.$disconnect());\n`;

fs.writeFileSync('import_prsm.js', codeOutput);
console.log('Generated import_prsm.js');
