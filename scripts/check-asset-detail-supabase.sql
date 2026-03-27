-- =============================================================================
-- เช็กว่ามีทรัพย์สินในฐานข้อมูลหรือไม่ + รายละเอียดที่หน้าแอปใช้ (รันใน Supabase SQL Editor)
--
-- แก้แค่บรรทัด INSERT ด้านล่าง:
--   - ใส่ id (cuid จาก URL /assets/[id]) ในคอลัมน์แรก หรือ
--   - ใส่ qrCode ในคอลัมน์ที่สอง
--   อย่างใดอย่างหนึ่ง — อีกค่าให้เป็น NULL
--
-- รันทั้งไฟล์ครั้งเดียว (หลายผลลัพธ์แท็บละชุด) หรือรันทีละบล็อกก็ได้
--
-- ถ้า error: syntax error near "FROM" — มักเกิดจากลบบรรทัด SELECT ของ "ผล 4" ใน editor
-- ให้ copy ไฟล์นี้ทั้งก้อนใหม่ อย่าตัดเฉพาะท้ายไฟล์
-- =============================================================================

DROP TABLE IF EXISTS _chk_asset_params;
CREATE TEMP TABLE _chk_asset_params (
  by_asset_id text,
  by_qr_code text
);

INSERT INTO _chk_asset_params (by_asset_id, by_qr_code)
VALUES (
  NULL,    -- ตัวอย่าง id: 'clxxxxxxxxxxxxxxxxxxxxxxxx'
  '289'    -- ตัวอย่าง qrCode — ถ้าใช้ id แทน ให้เป็น NULL
);

DROP TABLE IF EXISTS _chk_asset_row;
CREATE TEMP TABLE _chk_asset_row AS
SELECT a.*
FROM "Asset" a
JOIN _chk_asset_params p ON TRUE
WHERE
  (p.by_asset_id IS NOT NULL AND a.id = p.by_asset_id)
  OR (p.by_qr_code IS NOT NULL AND a."qrCode" = p.by_qr_code);

-- ผล 1: มีหรือไม่
SELECT
  CASE
    WHEN EXISTS (SELECT 1 FROM _chk_asset_row) THEN 'พบทรัพย์สิน'
    ELSE 'ไม่พบ — ตรวจ id / qrCode ใน INSERT'
  END AS summary,
  (SELECT COUNT(*)::int FROM _chk_asset_row) AS match_count;

-- ผล 2: รายละเอียด + สถานที่
SELECT
  a.id,
  a."qrCode",
  a."assetType",
  a."machineType",
  a.btu,
  a."installDate",
  a.status,
  a."roomId",
  r.name AS room_name,
  f.name AS floor_name,
  b.name AS building_name,
  s.name AS site_name,
  c.name AS client_name,
  a."createdAt",
  a."updatedAt"
FROM _chk_asset_row a
LEFT JOIN "Room" r ON r.id = a."roomId"
LEFT JOIN "Floor" f ON f.id = r."floorId"
LEFT JOIN "Building" b ON b.id = f."buildingId"
LEFT JOIN "Site" s ON s.id = b."siteId"
LEFT JOIN "Client" c ON c.id = s."clientId";

-- ผล 3: โซ่สถานที่ครบหรือไม่ (หน้าแอปแจ้งถ้าขาด)
SELECT
  a.id,
  a."qrCode",
  CASE
    WHEN a."roomId" IS NULL THEN 'ไม่มี roomId'
    WHEN r.id IS NULL THEN 'roomId ชี้ไป Room ที่ไม่มีในระบบ'
    WHEN f.id IS NULL THEN 'Room ไม่มี Floor'
    WHEN b.id IS NULL THEN 'Floor ไม่มี Building'
    WHEN s.id IS NULL THEN 'Building ไม่มี Site'
    WHEN c.id IS NULL THEN 'Site ไม่มี Client'
    ELSE 'โซ่สถานที่ครบ'
  END AS location_chain_status
FROM _chk_asset_row a
LEFT JOIN "Room" r ON r.id = a."roomId"
LEFT JOIN "Floor" f ON f.id = r."floorId"
LEFT JOIN "Building" b ON b.id = f."buildingId"
LEFT JOIN "Site" s ON s.id = b."siteId"
LEFT JOIN "Client" c ON c.id = s."clientId";

-- ผล 4: งาน (JobItem) ที่ผูกทรัพย์สิน
-- ใช้ LEFT JOIN เพื่อให้ได้ 1 แถวเสมอ (ถ้าไม่มีงาน = เลข 0) — INNER JOIN จะได้ 0 แถวแล้วเข้าใจผิดว่า query พัง
SELECT
  COUNT(ji.id) FILTER (WHERE ji.status = 'DONE') AS jobitems_done,
  COUNT(ji.id) FILTER (WHERE ji.status IN ('PENDING', 'IN_PROGRESS')) AS jobitems_pending_or_active,
  COUNT(ji.id)::int AS jobitems_total
FROM _chk_asset_row a
LEFT JOIN "JobItem" ji ON ji."assetId" = a.id
GROUP BY a.id;

-- ผล 5: แผน PM
-- pm_schedule_rows = 0 หมายถึงยังไม่มีแถวใน PMSchedule สำหรับเครื่องนี้ (ปกติ)
-- หน้า /assets/[id] แสดงกล่อง "แผนบำรุงรักษา" เฉพาะเมื่อ pmSchedules.length > 0 และเป็น AIR_CONDITIONER หรือ EXHAUST
SELECT COUNT(ps.id)::int AS pm_schedule_rows
FROM _chk_asset_row a
LEFT JOIN "PMSchedule" ps ON ps."assetId" = a.id
GROUP BY a.id;

-- -----------------------------------------------------------------------------
-- ทางเลือก: ค้นหาก่อน (รันแยก) ถ้ายังไม่รู้ id / qrCode ตรงกับ DB
-- -----------------------------------------------------------------------------
-- SELECT id, "qrCode", status, "roomId"
-- FROM "Asset"
-- WHERE "qrCode" ILIKE '%289%'
-- ORDER BY "updatedAt" DESC
-- LIMIT 30;
