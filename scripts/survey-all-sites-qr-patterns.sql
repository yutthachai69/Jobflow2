-- สำรวจ Site ทั้งหมดและ QR pattern ที่ใช้อยู่
-- รัน: Supabase → SQL Editor → Run

-- 1. ดู Site ทั้งหมด
SELECT
  s.id, s.name AS สาขา, c.name AS ลูกค้า,
  COUNT(DISTINCT b.id) AS อาคาร,
  COUNT(DISTINCT a.id) AS asset_ทั้งหมด
FROM "Site" s
JOIN "Client" c ON c.id = s."clientId"
LEFT JOIN "Building" b ON b."siteId" = s.id
LEFT JOIN "Floor"    f ON f."buildingId" = b.id
LEFT JOIN "Room"     r ON r."floorId" = f.id
LEFT JOIN "Asset"    a ON a."roomId" = r.id
GROUP BY s.id, s.name, c.name
ORDER BY s.name;

-- 2. ดู QR pattern ของแต่ละ site (5 ตัวแรก + 5 ตัวหลัง)
SELECT 'TOP 5' AS pos, s.name AS สาขา, a."qrCode", a."assetType"
FROM "Asset" a
JOIN "Room"     r ON r.id = a."roomId"
JOIN "Floor"    f ON f.id = r."floorId"
JOIN "Building" b ON b.id = f."buildingId"
JOIN "Site"     s ON s.id = b."siteId"
WHERE a."assetType" IN ('AIR_CONDITIONER','EXHAUST')
ORDER BY s.name, a."qrCode"
LIMIT 10;

-- 3. ดู QR สูงสุดต่อ site+assetType (เพื่อรู้ว่าเลขถัดไปคืออะไร)
SELECT
  s.name        AS สาขา,
  a."assetType",
  COUNT(*)      AS จำนวน,
  MIN(a."qrCode") AS qr_แรก,
  MAX(a."qrCode") AS qr_ล่าสุด
FROM "Asset" a
JOIN "Room"     r ON r.id = a."roomId"
JOIN "Floor"    f ON f.id = r."floorId"
JOIN "Building" b ON b.id = f."buildingId"
JOIN "Site"     s ON s.id = b."siteId"
WHERE a."assetType" IN ('AIR_CONDITIONER','EXHAUST')
GROUP BY s.name, a."assetType"
ORDER BY s.name, a."assetType";
