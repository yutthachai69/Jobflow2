-- ============================================================
-- เพิ่ม Exhaust Fan: ICU8 ตัวที่3, ICU8 ตัวที่4, ICU10 (รพ.พญาไท)
-- QR ต่อจากเลขล่าสุดอัตโนมัติ
-- ============================================================

-- STEP 1: เช็คเลข EX-2026 ล่าสุดก่อน (ดูก่อนรัน INSERT)
SELECT
  "qrCode",
  CAST(split_part("qrCode", '-', 3) AS INT) AS เลข
FROM "Asset"
WHERE "qrCode" LIKE 'EX-2026-%'
ORDER BY CAST(split_part("qrCode", '-', 3) AS INT) DESC
LIMIT 5;

-- ============================================================
-- STEP 2: INSERT โดยต่อเลขจากล่าสุดอัตโนมัติ
-- ============================================================
WITH last_num AS (
  SELECT COALESCE(
    MAX(CAST(split_part("qrCode", '-', 3) AS INT)),
    0
  ) AS n
  FROM "Asset"
  WHERE "qrCode" LIKE 'EX-2026-%'
),
new_qr AS (
  SELECT
    'EX-2026-' || LPAD((n + 1)::text, 3, '0') AS qr1,
    'EX-2026-' || LPAD((n + 2)::text, 3, '0') AS qr2,
    'EX-2026-' || LPAD((n + 3)::text, 3, '0') AS qr3
  FROM last_num
),
rooms AS (
  SELECT
    r.name,
    r.id AS room_id
  FROM "Room" r
  JOIN "Floor"    f ON f.id = r."floorId"
  JOIN "Building" b ON b.id = f."buildingId"
  JOIN "Site"     s ON s.id = b."siteId"
  WHERE r.name IN ('ICU8 ตัวที่3', 'ICU8 ตัวที่4', 'ICU10')
    AND s.name LIKE '%พญาไท%'
)
INSERT INTO "Asset" (
  id, "qrCode", "assetType", "machineType", status, "roomId", "createdAt", "updatedAt"
)
SELECT
  concat('c', translate(gen_random_uuid()::text, '-', '')),
  qr,
  'EXHAUST',
  NULL,
  'ACTIVE',
  room_id,
  NOW(), NOW()
FROM (
  SELECT (SELECT qr1 FROM new_qr) AS qr, room_id FROM rooms WHERE name = 'ICU8 ตัวที่3'
  UNION ALL
  SELECT (SELECT qr2 FROM new_qr),            room_id FROM rooms WHERE name = 'ICU8 ตัวที่4'
  UNION ALL
  SELECT (SELECT qr3 FROM new_qr),            room_id FROM rooms WHERE name = 'ICU10'
) inserts
WHERE room_id IS NOT NULL;

-- ============================================================
-- STEP 3: ยืนยันผล
-- ============================================================
SELECT
  a."qrCode",
  r.name AS ห้อง,
  b.name AS อาคาร,
  s.name AS สาขา,
  a.status,
  a."createdAt"
FROM "Asset" a
JOIN "Room"     r ON r.id = a."roomId"
JOIN "Floor"    f ON f.id = r."floorId"
JOIN "Building" b ON b.id = f."buildingId"
JOIN "Site"     s ON s.id = b."siteId"
WHERE a."qrCode" LIKE 'EX-2026-%'
ORDER BY CAST(split_part(a."qrCode", '-', 3) AS INT) DESC
LIMIT 10;
