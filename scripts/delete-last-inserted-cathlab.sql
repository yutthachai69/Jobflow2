-- ลบ Asset ที่เพิ่งเพิ่มเข้าไปล่าสุดใน Cath lab อาคาร A รพ.พญาไท
-- รัน: Supabase → SQL Editor → Run

-- STEP 1: ดูก่อนว่าจะลบอะไร (ตัวล่าสุดใน Cath lab)
SELECT
  a.id,
  a."qrCode",
  a."assetType",
  a."machineType",
  a."createdAt",
  r.name AS ห้อง,
  b.name AS อาคาร,
  s.name AS สาขา
FROM "Asset" a
JOIN "Room"     r ON r.id = a."roomId"
JOIN "Floor"    f ON f.id = r."floorId"
JOIN "Building" b ON b.id = f."buildingId"
JOIN "Site"     s ON s.id = b."siteId"
WHERE r.name ILIKE '%cath lab%'
  AND b.name ILIKE '%A%'
  AND s.name ILIKE '%พญาไท%'
ORDER BY a."createdAt" DESC
LIMIT 3;

-- ============================================================
-- STEP 2: ลบ (ลบตัวที่ createdAt ล่าสุดใน Cath lab)
-- ============================================================
DELETE FROM "Asset"
WHERE id = (
  SELECT a.id
  FROM "Asset" a
  JOIN "Room"     r ON r.id = a."roomId"
  JOIN "Floor"    f ON f.id = r."floorId"
  JOIN "Building" b ON b.id = f."buildingId"
  JOIN "Site"     s ON s.id = b."siteId"
  WHERE r.name ILIKE '%cath lab%'
    AND b.name ILIKE '%A%'
    AND s.name ILIKE '%พญาไท%'
  ORDER BY a."createdAt" DESC
  LIMIT 1
);

-- STEP 3: ยืนยันว่าเหลืออะไรในห้องนี้
SELECT a."qrCode", a."assetType", a."machineType", a."createdAt",
       r.name AS ห้อง
FROM "Asset" a
JOIN "Room" r ON r.id = a."roomId"
JOIN "Floor"    f ON f.id = r."floorId"
JOIN "Building" b ON b.id = f."buildingId"
JOIN "Site"     s ON s.id = b."siteId"
WHERE r.name ILIKE '%cath lab%'
  AND b.name ILIKE '%A%'
  AND s.name ILIKE '%พญาไท%'
ORDER BY a."createdAt";
