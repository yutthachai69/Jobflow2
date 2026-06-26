-- พัดลมฝังฝ้า ชีท: อาคาร A ชั้น 2 สถานที่ ICU10
-- ห้องที่มีแอร์อยู่คือ "ICU 10." (id RM_PHY_A_2_68) — ใช้ room นี้เท่านั้น
-- ไม่ใช่ RM_PHY_A_2_98 (ชื่อ ICU10, 0 ทรัพย์สิน = แถวซ้ำจาก import)
--
-- id ใช้แพทเทิร์น ASSET_EX_* ให้สอดคล้องกับทรัพย์สิน import แบบ ASSET_* (ไม่ใช้ hex จาก uuid)
-- รันใน SQL Editor แล้วดูผลลัพธ์: ถ้าได้ 0 แถว = มี EXHAUST ในห้องนี้แล้ว หรือแก้เงื่อนไขเอง
BEGIN;

WITH next_n AS (
  SELECT COALESCE(
    MAX((substring(a."qrCode" FROM '^EX-2026-(\d+)$'))::int),
    0
  ) + 1 AS n
  FROM "Asset" a
  WHERE a."qrCode" ~ '^EX-2026-\d+$'
),
ins AS (
  INSERT INTO "Asset" (id, "qrCode", "assetType", "machineType", "btu", "status", "roomId", "createdAt", "updatedAt")
  SELECT
    'ASSET_EX_RM_PHY_A_2_68',
    'EX-2026-' || lpad(next_n.n::text, 3, '0'),
    'EXHAUST',
    'EXHAUST',
    NULL,
    'ACTIVE',
    'RM_PHY_A_2_68',
    NOW(),
    NOW()
  FROM next_n
  WHERE NOT EXISTS (
    SELECT 1
    FROM "Asset" x
    WHERE x."roomId" = 'RM_PHY_A_2_68'
      AND x."assetType" = 'EXHAUST'
  )
  RETURNING id, "qrCode", "roomId"
)
SELECT * FROM ins;

COMMIT;

-- -----------------------------------------------------------------------------
-- แก้แถวที่รันสคริปต์เวอร์เก่า (id เป็น hex 32 ตัว) ให้เป็นแพทเทิร์นเดียวกัน — รันแยกทีหลังได้ครั้งเดียว
-- ถ้าได้ error เรื่อง FK/ซ้ำ ให้หยุดแล้วเช็คว่ามี id 'ASSET_EX_RM_PHY_A_2_68' อยู่แล้วหรือไม่
-- -----------------------------------------------------------------------------
/*
BEGIN;

UPDATE "Asset"
SET
  id = 'ASSET_EX_RM_PHY_A_2_68',
  "updatedAt" = NOW()
WHERE "roomId" = 'RM_PHY_A_2_68'
  AND "assetType" = 'EXHAUST'
  AND length(id) = 32
  AND id ~ '^[0-9a-f]+$'
  AND NOT EXISTS (SELECT 1 FROM "Asset" z WHERE z.id = 'ASSET_EX_RM_PHY_A_2_68');

COMMIT;
*/
