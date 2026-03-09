-- =========================================================================================
-- สคริปต์แก้ไขรหัส QR Code และ Serial No. สำหรับข้อมูล MOCK เป็นรันเลข (001, 002, ...)
-- รันสคริปต์นี้ทับได้เลย ข้อมูลเก่าที่เป็น UUID จะถูกอัปเดตให้สวยงาม
-- =========================================================================================

-- รันเลขใหม่ให้กับกลุ่ม AHU
WITH ranked_ahu AS (
  SELECT id, row_number() OVER (ORDER BY "createdAt") as rn
  FROM "Asset"
  WHERE "qrCode" LIKE 'AHU-MOCK-%'
)
UPDATE "Asset" a
SET "qrCode" = 'AHU-MOCK-' || LPAD(r.rn::text, 3, '0'),
    "serialNo" = 'SN-AHU-' || LPAD(r.rn::text, 3, '0')
FROM ranked_ahu r
WHERE a.id = r.id;

-- รันเลขใหม่ให้กับกลุ่ม FCU
WITH ranked_fcu AS (
  SELECT id, row_number() OVER (ORDER BY "createdAt") as rn
  FROM "Asset"
  WHERE "qrCode" LIKE 'FCU-MOCK-%'
)
UPDATE "Asset" a
SET "qrCode" = 'FCU-MOCK-' || LPAD(r.rn::text, 3, '0'),
    "serialNo" = 'SN-FCU-' || LPAD(r.rn::text, 3, '0')
FROM ranked_fcu r
WHERE a.id = r.id;

-- รันเลขใหม่ให้กับกลุ่ม SPLIT_TYPE
WITH ranked_split AS (
  SELECT id, row_number() OVER (ORDER BY "createdAt") as rn
  FROM "Asset"
  WHERE "qrCode" LIKE 'SPLIT-MOCK-%'
)
UPDATE "Asset" a
SET "qrCode" = 'SPLIT-MOCK-' || LPAD(r.rn::text, 3, '0'),
    "serialNo" = 'SN-SPLIT-' || LPAD(r.rn::text, 3, '0')
FROM ranked_split r
WHERE a.id = r.id;

-- รันเลขใหม่ให้กับกลุ่ม EXHAUST
WITH ranked_exh AS (
  SELECT id, row_number() OVER (ORDER BY "createdAt") as rn
  FROM "Asset"
  WHERE "qrCode" LIKE 'EXH-MOCK-%'
)
UPDATE "Asset" a
SET "qrCode" = 'EXH-MOCK-' || LPAD(r.rn::text, 3, '0'),
    "serialNo" = 'SN-EXH-' || LPAD(r.rn::text, 3, '0')
FROM ranked_exh r
WHERE a.id = r.id;
