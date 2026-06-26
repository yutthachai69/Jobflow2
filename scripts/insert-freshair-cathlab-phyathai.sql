-- เพิ่ม Fresh Air (AHU) 1 ตัว ในห้อง Cath lab อาคาร A ชั้น 2 รพ.พญาไท
-- QR ต่อจากแอร์ตัวล่าสุดอัตโนมัติ
-- รัน: Supabase → SQL Editor → Run

-- STEP 1: ตรวจก่อน (ดูว่า QR ถัดไปคืออะไร + roomId ถูกต้อง)
SELECT
  'QR ล่าสุดของแอร์ รพ.พญาไท' AS info,
  MAX(a."qrCode")              AS qr_ล่าสุด
FROM "Asset" a
JOIN "Room"     r ON r.id = a."roomId"
JOIN "Floor"    f ON f.id = r."floorId"
JOIN "Building" b ON b.id = f."buildingId"
JOIN "Site"     s ON s.id = b."siteId"
WHERE s.name ILIKE '%พญาไท%'
  AND a."assetType" = 'AIR_CONDITIONER';

SELECT
  r.name AS ห้อง, r.id AS room_id,
  f.name AS ชั้น, b.name AS อาคาร, s.name AS สาขา
FROM "Room" r
JOIN "Floor"    f ON f.id = r."floorId"
JOIN "Building" b ON b.id = f."buildingId"
JOIN "Site"     s ON s.id = b."siteId"
WHERE r.name ILIKE '%cath lab%'
  AND b.name ILIKE '%A%'
  AND s.name ILIKE '%พญาไท%';

-- ============================================================
-- STEP 2: INSERT (รันหลัง verify STEP 1 แล้ว)
-- ============================================================
WITH last_num AS (
  SELECT COALESCE(
    MAX(CAST(split_part(a."qrCode", '-', 3) AS INT)), 0
  ) AS n
  FROM "Asset" a
  JOIN "Room"     r ON r.id = a."roomId"
  JOIN "Floor"    f ON f.id = r."floorId"
  JOIN "Building" b ON b.id = f."buildingId"
  JOIN "Site"     s ON s.id = b."siteId"
  WHERE s.name ILIKE '%พญาไท%'
    AND a."assetType" = 'AIR_CONDITIONER'
    AND a."qrCode" ~ '^\d{2}-\d{4}-\d+$'
)
INSERT INTO "Asset" (
  id, "qrCode", "assetType", "machineType", btu, status, "roomId", "createdAt", "updatedAt"
)
SELECT
  concat('c', translate(gen_random_uuid()::text, '-', '')),
  -- สร้าง QR ต่อจากล่าสุด (format เดิมเช่น AC-2026-XXX)
  'AC-' || to_char(EXTRACT(YEAR FROM NOW())::int, 'FM9999')
    || '-' || LPAD((n + 1)::text, 3, '0'),
  'AIR_CONDITIONER',
  'AHU',
  NULL,   -- freshair ไม่มี BTU
  'ACTIVE',
  (SELECT r.id FROM "Room" r
   JOIN "Floor"    f ON f.id = r."floorId"
   JOIN "Building" b ON b.id = f."buildingId"
   JOIN "Site"     s ON s.id = b."siteId"
   WHERE r.name ILIKE '%cath lab%'
     AND b.name ILIKE '%A%'
     AND s.name ILIKE '%พญาไท%'
   LIMIT 1),
  NOW(), NOW()
FROM last_num;

-- STEP 3: ยืนยัน
SELECT a."qrCode", a."assetType", a."machineType", a.btu,
       r.name AS ห้อง, b.name AS อาคาร, s.name AS สาขา
FROM "Asset" a
JOIN "Room"     r ON r.id = a."roomId"
JOIN "Floor"    f ON f.id = r."floorId"
JOIN "Building" b ON b.id = f."buildingId"
JOIN "Site"     s ON s.id = b."siteId"
WHERE r.name ILIKE '%cath lab%'
  AND b.name ILIKE '%A%'
  AND s.name ILIKE '%พญาไท%'
ORDER BY a."createdAt" DESC;
