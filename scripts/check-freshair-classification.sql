-- เช็คว่า Fresh Air / AHU ถูก classify เป็นอะไรในระบบ
-- รัน: Supabase → SQL Editor → Run

-- 1. ดู asset ทุกประเภทที่มีใน รพ.พญาไท พร้อม assetType และ machineType
SELECT
  a."assetType",
  a."machineType",
  COUNT(*)        AS จำนวน,
  STRING_AGG(DISTINCT s.name, ', ') AS สาขา
FROM "Asset" a
JOIN "Room"     r ON r.id = a."roomId"
JOIN "Floor"    f ON f.id = r."floorId"
JOIN "Building" b ON b.id = f."buildingId"
JOIN "Site"     s ON s.id = b."siteId"
WHERE s.name ILIKE '%พญาไท%'
GROUP BY a."assetType", a."machineType"
ORDER BY a."assetType", a."machineType";

-- 2. ดู asset ทุกตัวที่ machineType เป็น AHU (ทั้งระบบ)
SELECT
  a."qrCode",
  a."assetType",
  a."machineType",
  r.name AS ห้อง,
  f.name AS ชั้น,
  b.name AS อาคาร,
  s.name AS สาขา
FROM "Asset" a
JOIN "Room"     r ON r.id = a."roomId"
JOIN "Floor"    f ON f.id = r."floorId"
JOIN "Building" b ON b.id = f."buildingId"
JOIN "Site"     s ON s.id = b."siteId"
WHERE a."machineType" = 'AHU'
ORDER BY s.name, a."qrCode";

-- 3. ดู asset ที่เป็น OTHER ทั้งหมด (เผื่อ freshair อยู่ตรงนี้)
SELECT
  a."qrCode",
  a."assetType",
  a."machineType",
  a.btu,
  r.name AS ห้อง,
  b.name AS อาคาร,
  s.name AS สาขา
FROM "Asset" a
JOIN "Room"     r ON r.id = a."roomId"
JOIN "Floor"    f ON f.id = r."floorId"
JOIN "Building" b ON b.id = f."buildingId"
JOIN "Site"     s ON s.id = b."siteId"
WHERE a."assetType" = 'OTHER'
ORDER BY s.name, a."qrCode";

-- 4. สรุปภาพรวม asset ทุกประเภท ทุกสาขา
SELECT
  a."assetType",
  a."machineType",
  COUNT(*) AS จำนวน
FROM "Asset" a
GROUP BY a."assetType", a."machineType"
ORDER BY a."assetType", COUNT(*) DESC;
