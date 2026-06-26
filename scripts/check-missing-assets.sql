-- ============================================================
-- ตรวจสอบ Asset ที่อาจหายไป (ICU8 ตัวที่3, ICU8 ตัวที่4, ICU10)
-- วิธีรัน: เปิด Supabase → SQL Editor → วางทั้งหมด → Run
-- ============================================================

-- 1. เช็ค QR Code 96, 97, 98 ตรงๆ
SELECT
  'เช็ค QR 96,97,98' AS ขั้นตอน,
  a."qrCode",
  a."assetType",
  a."status",
  r.name   AS ห้อง,
  f.name   AS ชั้น,
  b.name   AS อาคาร,
  s.name   AS สาขา,
  c.name   AS ลูกค้า
FROM "Asset" a
JOIN "Room"     r ON r.id = a."roomId"
JOIN "Floor"    f ON f.id = r."floorId"
JOIN "Building" b ON b.id = f."buildingId"
JOIN "Site"     s ON s.id = b."siteId"
JOIN "Client"   c ON c.id = s."clientId"
WHERE a."qrCode" IN ('96','97','98')
ORDER BY a."qrCode";

-- ============================================================

-- 2. ดู QR ช่วง 90–100 ทั้งหมด (เพื่อเห็น pattern)
SELECT
  'QR ช่วง 90-100' AS ขั้นตอน,
  a."qrCode",
  a."assetType",
  r.name AS ห้อง,
  b.name AS อาคาร,
  s.name AS สาขา
FROM "Asset" a
JOIN "Room"     r ON r.id = a."roomId"
JOIN "Floor"    f ON f.id = r."floorId"
JOIN "Building" b ON b.id = f."buildingId"
JOIN "Site"     s ON s.id = b."siteId"
WHERE a."qrCode" ~ '^\d+$'                  -- เฉพาะ QR ที่เป็นตัวเลขล้วน
  AND a."qrCode"::int BETWEEN 90 AND 100
ORDER BY a."qrCode"::int;

-- ============================================================

-- 3. เช็คห้อง ICU8 และ ICU10 มี asset กี่ตัว
SELECT
  'จำนวน asset ต่อห้อง ICU8/ICU10' AS ขั้นตอน,
  r.name                            AS ห้อง,
  f.name                            AS ชั้น,
  b.name                            AS อาคาร,
  s.name                            AS สาขา,
  COUNT(a.id)                       AS จำนวน_asset,
  STRING_AGG(a."qrCode", ', ' ORDER BY a."qrCode") AS qr_codes
FROM "Room" r
LEFT JOIN "Asset" a ON a."roomId" = r.id
JOIN "Floor"    f ON f.id = r."floorId"
JOIN "Building" b ON b.id = f."buildingId"
JOIN "Site"     s ON s.id = b."siteId"
WHERE r.name IN ('ICU8','ICU10','ICU 8','ICU 10')
GROUP BY r.name, f.name, b.name, s.name
ORDER BY r.name;

-- ============================================================

-- 4. ดู asset ทุกห้อง ICU ทั้งหมด (เพื่อเทียบกับ Excel)
SELECT
  r.name   AS ห้อง,
  COUNT(a.id) AS จำนวน_asset,
  STRING_AGG(a."qrCode", ', ' ORDER BY a."qrCode") AS qr_codes,
  s.name   AS สาขา
FROM "Room" r
LEFT JOIN "Asset" a ON a."roomId" = r.id
JOIN "Floor"    f ON f.id = r."floorId"
JOIN "Building" b ON b.id = f."buildingId"
JOIN "Site"     s ON s.id = b."siteId"
WHERE r.name LIKE 'ICU%'
GROUP BY r.name, s.name
ORDER BY s.name, r.name;
