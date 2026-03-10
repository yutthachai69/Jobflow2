const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const site = await prisma.site.findFirst({
      where: { name: 'รพ.พญาไท ศรีราชา 2' }
    });

    if (!site) {
      console.log('Site not found!');
      return;
    }

    const building = await prisma.building.findFirst({
      where: { siteId: site.id }
    });

    const floor3 = await prisma.floor.findFirst({
      where: { buildingId: building.id, name: 'ชั้น 3' }
    });

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

    let updatedCount = 0;
    for (const [index, line] of acDataRaw.entries()) {
      const parts = line.split('\t');
      if (parts.length < 5) continue;
      
      const seq = index + 1;
      const qrCode = `PHY2569-AC-${seq}`;
      const roomNameRaw = parts[2].trim();
      
      // Clean up the room name to just be the label part
      // e.g., "F-3/1 CAS 1 WAY 500CFM" -> "F-3/1"
      const roomNameMatch = roomNameRaw.match(/^([A-Z0-9\-\/]+)/);
      const roomName = roomNameMatch ? roomNameMatch[1] : roomNameRaw;

      // 1. Find or create the room on Floor 3
      let room = await prisma.room.findFirst({
        where: { floorId: floor3.id, name: roomName }
      });

      if (!room) {
        room = await prisma.room.create({
          data: {
            floorId: floor3.id,
            name: roomName
          }
        });
        console.log(`Created new room: ${roomName}`);
      }

      // 2. Update the asset to point to this room
      await prisma.asset.update({
        where: { qrCode },
        data: { roomId: room.id }
      });
      updatedCount++;
    }
    
    console.log(`Updated ${updatedCount} ACs with proper room names.`);

  } catch (e) {
    console.error('Error during update:', e);
  }
}

main().finally(() => prisma.$disconnect());
