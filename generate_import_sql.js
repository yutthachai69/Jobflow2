const fs = require('fs');

const data = `
INSERT INTO aircon_plan_minimal VALUES ('1', 'A', '2.0', 'แผนกNCU 1.', '1.0');
INSERT INTO aircon_plan_minimal VALUES ('2', 'A', '2.0', 'แผนกNCU 2.', '2.0');
INSERT INTO aircon_plan_minimal VALUES ('3', 'A', '2.0', 'ส่วนเภสัชกรรม 1', '3.0');
INSERT INTO aircon_plan_minimal VALUES ('4', 'A', '2.0', 'ส่วนเภสัชกรรม 2 (ห้องผจก.)', '4.0');
INSERT INTO aircon_plan_minimal VALUES ('5', 'A', '2.0', 'LAB ห้องเปลี่ยนรองเท้าและเสื้อกาวด์', '5.0');
INSERT INTO aircon_plan_minimal VALUES ('6', 'A', '2.0', 'LAB ห้องผจก.', '6.0');
INSERT INTO aircon_plan_minimal VALUES ('7', 'A', '2.0', 'LAB ห้องตู้เบรคเกอร์ไฟฟ้า', '7.0');
INSERT INTO aircon_plan_minimal VALUES ('8', 'A', '2.0', 'LAB Document room', '8.0');
INSERT INTO aircon_plan_minimal VALUES ('9', 'A', '2.0', 'LAB ห้องStaff Lounge', '9.0');
INSERT INTO aircon_plan_minimal VALUES ('10', 'A', '2.0', 'LAB BLOOD BANK', '10.0');
INSERT INTO aircon_plan_minimal VALUES ('302', 'A', '3.0', 'หน้าลิฟต์1,2ตัวที่3', '302.0');
`;

const lines = data.split('\n').filter(line => line.trim() && line.includes('VALUES (\''));

let sqlOutput = `-- =========================================================================
-- สคริปต์ลงข้อมูลแอร์ชุดล่าสุด (รพ.พญาไท อาคาร A ชั้น 2 และ 3)
-- คำสั่งนี้สามารถก๊อปปี้ไปวางและรันใน SQL Editor ของ Supabase ได้เลยครับ
-- =========================================================================

BEGIN;

-- 1. สร้าง โครงสร้างตึกและชั้น (รพ.พญาไท) ก่อนให้มั่นใจ
INSERT INTO "Client" (id, name, "createdAt", "updatedAt")
SELECT 'CLIENT_DEFAULT', 'ลูกค้าทั่วไป', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM "Client" WHERE id = 'CLIENT_DEFAULT');

INSERT INTO "Site" (id, name, "clientId", "createdAt", "updatedAt")
SELECT 'SITE_PHYATHAI', 'รพ.พญาไท', 'CLIENT_DEFAULT', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM "Site" WHERE id = 'SITE_PHYATHAI');

INSERT INTO "Building" (id, name, "siteId", "createdAt", "updatedAt")
SELECT 'BLD_PHY_A', 'A', 'SITE_PHYATHAI', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM "Building" WHERE id = 'BLD_PHY_A');

-- เพิ่ม 2 ชั้น
INSERT INTO "Floor" (id, name, "buildingId", "createdAt", "updatedAt")
SELECT 'FLR_PHY_A_2', 'ชั้น 2', 'BLD_PHY_A', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM "Floor" WHERE id = 'FLR_PHY_A_2');

INSERT INTO "Floor" (id, name, "buildingId", "createdAt", "updatedAt")
SELECT 'FLR_PHY_A_3', 'ชั้น 3', 'BLD_PHY_A', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM "Floor" WHERE id = 'FLR_PHY_A_3');

-- 2. สร้างห้อง (Room) และ อุปกรณ์ (Asset) 
`;

const rooms = new Set();
const ops = [];

for (const line of lines) {
  const match = line.match(/VALUES \('([^']+)', '([^']+)', '([^']+)', '([^']+)', '([^']+)'\);/);
  if (match) {
    const [, no, building, floorRaw, roomNameRaw, assetCodeRaw] = match;
    const roomName = roomNameRaw.trim().replace(/'/g, "''");
    const floor = floorRaw.replace('.0', '');
    const floorId = floor === '2' ? 'FLR_PHY_A_2' : 'FLR_PHY_A_3';
    const roomId = 'RM_PHY_A_' + floor + '_' + no;
    const assetCode = assetCodeRaw.replace('.0', '');
    
    if (!rooms.has(roomId)) {
      rooms.add(roomId);
      ops.push(`
-- ทรัพย์สินลำดับที่ ${no}
INSERT INTO "Room" (id, name, "floorId", "createdAt", "updatedAt")
SELECT '${roomId}', '${roomName}', '${floorId}', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM "Room" WHERE id = '${roomId}');
`);
    }

    ops.push(`INSERT INTO "Asset" (id, "qrCode", "assetType", "machineType", "serialNo", "status", "roomId", "createdAt", "updatedAt")
VALUES ('ASSET_${assetCode}', '${assetCode}', 'AIR_CONDITIONER', 'SPLIT_TYPE', '${assetCode}', 'ACTIVE', '${roomId}', NOW(), NOW())
ON CONFLICT ("qrCode") DO NOTHING;`);
  }
}

sqlOutput += ops.join('\n');
sqlOutput += `\n\nCOMMIT;\n`;

fs.writeFileSync('d:/jobflow2.1/import_phyathai_a.sql', sqlOutput);
console.log('Generated import_phyathai_a.sql');
