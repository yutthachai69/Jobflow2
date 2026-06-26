-- ตรวจสอบ Asset ในอาคาร A ชั้น 2 ห้อง LAB
-- รัน: Supabase → SQL Editor → Run

-- 1. ดู asset ทั้งหมดในห้อง LAB ชั้น 2 อาคาร A
SELECT
  a."qrCode",
  a."assetType",
  a."machineType",
  a.status,
  a.btu,
  r.name   AS ห้อง,
  f.name   AS ชั้น,
  b.name   AS อาคาร,
  s.name   AS สาขา
FROM "Asset" a
JOIN "Room"     r ON r.id = a."roomId"
JOIN "Floor"    f ON f.id = r."floorId"
JOIN "Building" b ON b.id = f."buildingId"
JOIN "Site"     s ON s.id = b."siteId"
WHERE b.name ILIKE '%A%'
  AND f.name ILIKE '%2%'
  AND r.name ILIKE '%LAB%'
ORDER BY a."qrCode";

-- 2. นับจำนวน asset ต่อห้อง LAB ทั้งหมดในชั้น 2 อาคาร A
SELECT
  r.name          AS ห้อง,
  f.name          AS ชั้น,
  b.name          AS อาคาร,
  s.name          AS สาขา,
  COUNT(a.id)     AS จำนวน_asset,
  STRING_AGG(a."qrCode", ', ' ORDER BY a."qrCode") AS qr_codes
FROM "Room" r
LEFT JOIN "Asset"    a ON a."roomId" = r.id
JOIN "Floor"    f ON f.id = r."floorId"
JOIN "Building" b ON b.id = f."buildingId"
JOIN "Site"     s ON s.id = b."siteId"
WHERE b.name ILIKE '%A%'
  AND f.name ILIKE '%2%'
  AND r.name ILIKE '%LAB%'
GROUP BY r.name, f.name, b.name, s.name
ORDER BY r.name;

-- 3. ดูห้องทั้งหมดในชั้น 2 อาคาร A พร้อมแยกประเภท asset
SELECT
  r.name                                                        AS ห้อง,
  COUNT(a.id)                                                   AS จำนวน_asset,
  COUNT(a.id) FILTER (WHERE a."assetType" = 'AIR_CONDITIONER') AS แอร์,
  COUNT(a.id) FILTER (WHERE a."assetType" = 'EXHAUST')         AS พัดลมดูด,
  COUNT(a.id) FILTER (WHERE a."assetType" = 'OTHER')           AS อื่นๆ,
  STRING_AGG(
    a."qrCode" || '(' || a."assetType" || ')',
    ', ' ORDER BY a."qrCode"
  )                                                             AS รายการ_qr,
  b.name                                                        AS อาคาร,
  s.name                                                        AS สาขา
FROM "Room" r
LEFT JOIN "Asset" a ON a."roomId" = r.id
JOIN "Floor"    f ON f.id = r."floorId"
JOIN "Building" b ON b.id = f."buildingId"
JOIN "Site"     s ON s.id = b."siteId"
WHERE b.name ILIKE '%A%'
  AND f.name ILIKE '%2%'
GROUP BY r.name, b.name, s.name
ORDER BY r.name;
