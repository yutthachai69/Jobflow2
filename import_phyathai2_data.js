const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    // 1. Get the Client "โรงพยาบาลพญาไท ศรีราชา"
    let client = await prisma.client.findFirst({
      where: { name: 'โรงพยาบาลพญาไท ศรีราชา' }
    });

    if (!client) {
      console.log('Client not found, creating...');
      client = await prisma.client.create({
        data: {
          name: 'โรงพยาบาลพญาไท ศรีราชา',
          contactInfo: 'admin@phyathai.com'
        }
      });
    }

    // 2. Create the Site "รพ.พญาไท ศรีราชา 2"
    let site = await prisma.site.findFirst({
      where: { name: 'รพ.พญาไท ศรีราชา 2' }
    });

    if (!site) {
      console.log('Site not found, creating...');
      site = await prisma.site.create({
        data: {
          clientId: client.id,
          name: 'รพ.พญาไท ศรีราชา 2',
          address: 'ศรีราชา'
        }
      });
    }

    // 3. Create a default "อาคารหลัก" (Main Building) since Prisma requires Site -> Building -> Floor -> Room
    let building = await prisma.building.findFirst({
      where: { siteId: site.id }
    });

    if (!building) {
      console.log('Building not found, creating default (อาคารหลัก)...');
      building = await prisma.building.create({
        data: {
          siteId: site.id,
          name: 'อาคารหลัก' // Default building name since it's just floors
        }
      });
    }

    // 4. Create Floor 3
    let floor3 = await prisma.floor.findFirst({
      where: { buildingId: building.id, name: 'ชั้น 3' }
    });

    if (!floor3) {
      console.log('Floor 3 not found, creating...');
      floor3 = await prisma.floor.create({
        data: {
          buildingId: building.id,
          name: 'ชั้น 3'
        }
      });
    }

    // 5. Create Default Floor for unknown Exhausts (if we don't know the floor)
    let floorUnknown = await prisma.floor.findFirst({
      where: { buildingId: building.id, name: 'ไม่ระบุชั้น' }
    });

    if (!floorUnknown) {
      console.log('Unknown Floor not found, creating...');
      floorUnknown = await prisma.floor.create({
        data: {
          buildingId: building.id,
          name: 'ไม่ระบุชั้น'
        }
      });
    }

    // 6. Create a Default Room for the ACs (since we don't have explicit rooms, just descriptions)
    let roomAC = await prisma.room.findFirst({
      where: { floorId: floor3.id, name: 'พื้นที่ส่วนกลาง (แอร์)' }
    });

    if (!roomAC) {
       console.log('AC Room not found, creating...');
       roomAC = await prisma.room.create({
        data: {
          floorId: floor3.id,
          name: 'พื้นที่ส่วนกลาง (แอร์)'
        }
       });
    }

    // 7. Create a Default Room for the Exhausts
    let roomExhaust = await prisma.room.findFirst({
      where: { floorId: floorUnknown.id, name: 'พื้นที่ส่วนกลาง (พัดลมดูดอากาศ)' }
    });

    if (!roomExhaust) {
       console.log('Exhaust Room not found, creating...');
       roomExhaust = await prisma.room.create({
        data: {
          floorId: floorUnknown.id,
          name: 'พื้นที่ส่วนกลาง (พัดลมดูดอากาศ)'
        }
       });
    }

    // ============================================
    // 8. INSERT AIR CONDITIONERS (35 items)
    // ============================================
    const acDataRaw = `
1	3	F-3/1 CAS 1 WAY   500CFM	CARRIER	40VQS018W-10FR
2	3	F-3/2 MHC 600CFM	CARRIER	42CMS006W212RE
3	3	F-3/3 MHC 720CFM	CARRIER	42CMS006W312LE
4	3	F-3/4 CAS 1 WAY   300CFM	CARRIER	40VQS012W-10FR
5	3	F-3/6 CAS 1 WAY   300CFM	CARRIER	40VQS012W-10FR
6	3	F-3/7 CAS 1 WAY   300CFM	CARRIER	40VQS012W-10FR
7	3	F-3/8 MHC 500CFM	CARRIER	42CMS004W312RE
8	3	F-3/9  MHC 750CFM	CARRIER	42CMS006W312RE
9	3	F-3/10 CAS 1 WAY   500CFM	CARRIER	40VQS018W-10FR
10	3	F-3/11  MHC 1200CFM	CARRIER	42CMS012W312RE
11	3	F-3/12 CAS 1 WAY   500CFM	CARRIER	40VQS018W-10FR
12	3	F-3/13 MHC 300CFM	CARRIER	42CMS004W212RE
13	3	F-3/14 MHC 300CFM	CARRIER	42CMS004W212RE
14	3	F-3/15 MHC 300CFM	CARRIER	42CMS004W212RE
15	3	F-3/16 CAS 1 WAY   720CFM	CARRIER	40VNS024W-10FR
16	3	F-3/17 CAS 1 WAY   300CFM	CARRIER	40VQS012W-10FR
17	3	F-3/18 MHC 720CFM	CARRIER	42CMS006W312RE
18	3	F-3/19 +B139:B160CAS 1 WAY   300CFM	CARRIER	40VQS012W-10FR
19	3	F-3/20 MHC 600CFM	CARRIER	42CMS006W212RE
20	3	F-3/21 MHC 600CFM	CARRIER	42CMS006W212RE
21	3	F-3/22 MHC 400CFM	CARRIER	42CLS004W217LP
22	3	F-3/23 MHC 600CFM	CARRIER	42CLS006W217RP
23	3	F-3/24 MHC 600CFM	CARRIER	42CLS006W217RP
24	3	F-3/25 CAS 1 WAY   720CFM	CARRIER	40VNS024W-10FR
25	3	F-3/26 CAS 1 WAY   1200CFM	CARRIER	40VNS024W-10FR
26	3	F-3/28 CAS 1 WAY   300CFM	CARRIER	42CMS004W212LE
27	3	F-3/29 MHC 600CFM	CARRIER	42CMS006W212LE
28	3	F-3/30 MHC 600CFM	CARRIER	42CMS006W212LE
29	3	F-3/31 MHC 600CFM	CARRIER	42CMS006W212RE
30	3	F-3/32 MHC 600CFM	CARRIER	42CMS006W212RE
31	3	F-3/33 MHC 600CFM	CARRIER	42CMS006W212RE
32	3	F-3/34 MHC 400CFM	CARRIER	40VQS012W-10FR
33	3	OAU-3/1   750 CFM	CARRIER	39GNS0609
34	3	A-3/1 MHC  2200CFM	CARRIER	40LCS006W4LH
35	3	A-3/2 MHC  2200CFM	CARRIER	40LCS006W4LH
`.trim().split('\n');

    let acCount = 0;
    for (const [index, line] of acDataRaw.entries()) {
      const parts = line.split('\t');
      if (parts.length < 5) continue;
      
      const seq = index + 1; // Start at 1 for this site
      const qrCode = `PHY2569-AC-${seq}`;
      const typeDesc = parts[2].trim();
      const model = parts[4].trim();
      
      let machineType = 'SPLIT_TYPE';
      if (typeDesc.includes('AHU') || typeDesc.includes('OAU') || typeDesc.includes('A-3/')) machineType = 'AHU';
      if (typeDesc.includes('FCU') || typeDesc.includes('MHC') || typeDesc.includes('CAS')) machineType = 'FCU';

      // Parse BTU roughly from CFM (1 CFM ≈ 30 BTU roughly for estimation if needed, or leave empty if we don't know exactly)
      let btuMatch = typeDesc.match(/(\d+)\s*(CFM|BTU)/i);
      let btu = null;
      if (btuMatch) {
         if (btuMatch[2].toUpperCase() === 'CFM') {
             btu = parseInt(btuMatch[1]) * 30; // Rough assumption for demo 
         } else {
             btu = parseInt(btuMatch[1]);
         }
      }

      const existing = await prisma.asset.findUnique({ where: { qrCode } });
      if (!existing) {
        await prisma.asset.create({
          data: {
            qrCode: qrCode,
            assetType: 'AIR_CONDITIONER',
            machineType: machineType,
            btu: btu,
            roomId: roomAC.id, // Put them in Room
            status: 'ACTIVE'
          }
        });
        acCount++;
      }
    }
    console.log(`Inserted ${acCount} Air Conditioners.`);

    // ============================================
    // 9. INSERT EXHAUSTS (113 items)
    // ============================================
    let exhaustCount = 0;
    for (let i = 1; i <= 113; i++) {
        const qrCode = `PHY2569-EX-${i}`;
        
        const existing = await prisma.asset.findUnique({ where: { qrCode } });
        if (!existing) {
          await prisma.asset.create({
            data: {
              qrCode: qrCode,
              assetType: 'EXHAUST',
              machineType: null, // Exhausts don't use MachineType enum anymore in our setup, they use EXHAUST assetType
              btu: null,
              roomId: roomExhaust.id, // Put them in the unknown floor room
              status: 'ACTIVE'
            }
          });
          exhaustCount++;
        }
    }
    console.log(`Inserted ${exhaustCount} Exhausts.`);

    console.log('✅ Import Completed successfully!');

  } catch (e) {
    console.error('Error during import:', e);
  }
}

main().finally(() => prisma.$disconnect());
