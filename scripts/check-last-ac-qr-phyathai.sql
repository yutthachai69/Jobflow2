-- เช็คเลข QR ล่าสุดของแอร์ รพ.พญาไท ทุกอาคาร
-- รัน: Supabase → SQL Editor → Run

-- 1. QR ล่าสุด 10 อันดับ (เพื่อดู pattern และเลขถัดไป)
SELECT
  a."qrCode",
  a."assetType",
  r.name  AS ห้อง,
  f.name  AS ชั้น,
  b.name  AS อาคาร,
  s.name  AS สาขา
FROM "Asset" a
JOIN "Room"     r ON r.id = a."roomId"
JOIN "Floor"    f ON f.id = r."floorId"
JOIN "Building" b ON b.id = f."buildingId"
JOIN "Site"     s ON s.id = b."siteId"
WHERE s.name ILIKE '%พญาไท%'
  AND a."assetType" = 'AIR_CONDITIONER'
ORDER BY a."qrCode" DESC
LIMIT 10;

-- 2. สรุป: QR สูงสุด + จำนวนทั้งหมด แยกตามอาคาร
SELECT
  b.name          AS อาคาร,
  s.name          AS สาขา,
  COUNT(a.id)     AS จำนวนแอร์ทั้งหมด,
  MAX(a."qrCode") AS qr_ล่าสุด
FROM "Asset" a
JOIN "Room"     r ON r.id = a."roomId"
JOIN "Floor"    f ON f.id = r."floorId"
JOIN "Building" b ON b.id = f."buildingId"
JOIN "Site"     s ON s.id = b."siteId"
WHERE s.name ILIKE '%พญาไท%'
  AND a."assetType" = 'AIR_CONDITIONER'
GROUP BY b.name, s.name
ORDER BY b.name;
