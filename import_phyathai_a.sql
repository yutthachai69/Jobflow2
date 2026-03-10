-- =========================================================================
-- สคริปต์ลงข้อมูลแอร์ชุดล่าสุด (รพ.พญาไท อาคาร A ชั้น 2 และ 3)
-- คำสั่งนี้สามารถก๊อปปี้ไปวางและรันใน SQL Editor ของ Supabase ได้เลยครับ
-- =========================================================================

BEGIN;

-- 1. สร้าง โครงสร้างตึกและชั้น (รพ.พญาไท) ก่อนให้มั่นใจ
INSERT INTO "Client" (id, name, "createdAt")
SELECT 'CLIENT_DEFAULT', 'ลูกค้าทั่วไป', NOW()
WHERE NOT EXISTS (SELECT 1 FROM "Client" WHERE id = 'CLIENT_DEFAULT');

INSERT INTO "Site" (id, name, "clientId")
SELECT 'SITE_PHYATHAI', 'รพ.พญาไท', 'CLIENT_DEFAULT'
WHERE NOT EXISTS (SELECT 1 FROM "Site" WHERE id = 'SITE_PHYATHAI');

INSERT INTO "Building" (id, name, "siteId")
SELECT 'BLD_PHY_A', 'A', 'SITE_PHYATHAI'
WHERE NOT EXISTS (SELECT 1 FROM "Building" WHERE id = 'BLD_PHY_A');

-- เพิ่ม 2 ชั้น
INSERT INTO "Floor" (id, name, "buildingId")
SELECT 'FLR_PHY_A_2', 'ชั้น 2', 'BLD_PHY_A'
WHERE NOT EXISTS (SELECT 1 FROM "Floor" WHERE id = 'FLR_PHY_A_2');

INSERT INTO "Floor" (id, name, "buildingId")
SELECT 'FLR_PHY_A_3', 'ชั้น 3', 'BLD_PHY_A'
WHERE NOT EXISTS (SELECT 1 FROM "Floor" WHERE id = 'FLR_PHY_A_3');

-- 2. สร้างห้อง (Room) และ อุปกรณ์ (Asset) 


COMMIT;
