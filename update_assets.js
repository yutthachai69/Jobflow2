const fs = require('fs');
const readline = require('readline');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const fileStream = fs.createReadStream('raw_assets_updates.txt');
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  const updates = [];

  for await (const line of rl) {
    if (!line.trim()) continue;
    const parts = line.split('\t');
    
    // Some lines might only have 2 or 3 parts if missing assetCode
    // text format: 1	AHU/180,000BTU	AC-PTS1-A-F2-001 (or similar)
    // Actually the raw file was: "1	A	2	แผนกNCU 1.	1	AHU/180,000BTU	AC-PTS1-A-F2-001"
    // Wait, let's look at raw_assets_updates.txt exactly. 
    // Wait, I saw it has less columns than that.
    
    const seq = parseInt(parts[0], 10);
    const typeAndBtu = parts[1] ? parts[1].trim() : '';
    const code = parts[2] ? parts[2].trim() : (parts.length > 2 ? parts[parts.length - 1].trim() : null);

    let machineType = 'OTHER';
    let btu = null;
    let assetType = 'AIR_CONDITIONER';

    if (typeAndBtu) {
      const lowerType = typeAndBtu.toLowerCase();
      if (lowerType.includes('ahu')) machineType = 'AHU';
      else if (lowerType.includes('fcu')) machineType = 'FCU';
      else if (lowerType.includes('split')) machineType = 'SPLIT_TYPE';
      else if (lowerType.includes('exhaust') || lowerType.includes('พัดลม')) {
        machineType = 'EXHAUST';
        assetType = 'OTHER';
      } else if (lowerType.includes('fresh air')) {
        machineType = 'OTHER';
        assetType = 'OTHER';
      }

      // extract BTU: looking for numbers before BTU or just numbers with commas
      const btuMatch = typeAndBtu.match(/([\d,]+)\s*BTU/i);
      if (btuMatch && btuMatch[1]) {
        btu = parseInt(btuMatch[1].replace(/,/g, ''), 10);
      }
    }

    if (!seq) continue;

    updates.push({
      qrCode: String(seq),
      assetCode: code || null,
      machineType,
      btu,
      assetType
    });
  }

  console.log(`Parsed ${updates.length} updates. Preview of first 5:`);
  console.log(updates.slice(0, 5));

  for (const update of updates) {
    const dataToUpdate = {
      machineType: update.machineType,
      btu: update.btu,
      assetType: update.assetType,
    };
    if (update.assetCode && update.assetCode.startsWith('AC-PTS')) {
      dataToUpdate.qrCode = update.assetCode;
    }

    await prisma.asset.updateMany({
      where: { qrCode: update.qrCode },
      data: dataToUpdate
    });
  }

  console.log('Update completed successfully.');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
