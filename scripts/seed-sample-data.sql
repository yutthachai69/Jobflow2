-- ============================================
-- Seed Sample Data for Jobflow2
-- สร้างข้อมูลตัวอย่าง: ลูกค้า, สถานที่, อุปกรณ์ 50 ชิ้น, และใบงาน
-- ============================================

-- 1. สร้าง Client (ลูกค้า)
INSERT INTO "Client" (id, name, "contactInfo", "logoUrl", "createdAt") VALUES
('client_001', 'บริษัท เอบีซี คอร์ปอเรชั่น จำกัด', 'Tel: 02-123-4567', NULL, NOW()),
('client_002', 'บริษัท เดลต้า อินดัสตรี จำกัด', 'Tel: 02-234-5678', NULL, NOW()),
('client_003', 'ห้างหุ้นส่วนจำกัด แกมม่า เซอร์วิส', 'Tel: 02-345-6789', NULL, NOW())
ON CONFLICT (id) DO NOTHING;

-- 2. สร้าง Site (สถานที่)
INSERT INTO "Site" (id, name, address, latitude, longitude, "clientId") VALUES
('site_001', 'สำนักงานใหญ่ ABC', '123 ถนนสุขุมวิท แขวงคลองเตย เขตคลองเตย กรุงเทพฯ 10110', 13.7353, 100.5530, 'client_001'),
('site_002', 'โรงงาน ABC ชลบุรี', '456 ถนนสุขุมวิท ตำบลหนองขาม อำเภอศรีราชา ชลบุรี 20230', 13.1774, 100.9308, 'client_001'),
('site_003', 'สำนักงาน Delta พระราม 9', '789 ถนนพระราม 9 แขวงห้วยขวาง เขตห้วยขวาง กรุงเทพฯ 10310', 13.7579, 100.5696, 'client_002'),
('site_004', 'โกดัง Gamma บางนา', '321 ถนนบางนา-ตราด แขวงบางนา เขตบางนา กรุงเทพฯ 10260', 13.6680, 100.6023, 'client_003')
ON CONFLICT (id) DO NOTHING;

-- 3. สร้าง Building (อาคาร)
INSERT INTO "Building" (id, name, "siteId") VALUES
('bldg_001', 'อาคาร A', 'site_001'),
('bldg_002', 'อาคาร B', 'site_001'),
('bldg_003', 'โรงงาน 1', 'site_002'),
('bldg_004', 'อาคารสำนักงาน', 'site_003'),
('bldg_005', 'โกดังหลัก', 'site_004')
ON CONFLICT (id) DO NOTHING;

-- 4. สร้าง Floor (ชั้น)
INSERT INTO "Floor" (id, name, "buildingId") VALUES
('floor_001', 'ชั้น 1', 'bldg_001'),
('floor_002', 'ชั้น 2', 'bldg_001'),
('floor_003', 'ชั้น 3', 'bldg_001'),
('floor_004', 'ชั้น 1', 'bldg_002'),
('floor_005', 'ชั้น 2', 'bldg_002'),
('floor_006', 'ชั้น 1', 'bldg_003'),
('floor_007', 'ชั้น 2', 'bldg_003'),
('floor_008', 'ชั้น 1', 'bldg_004'),
('floor_009', 'ชั้น 2', 'bldg_004'),
('floor_010', 'ชั้น 3', 'bldg_004'),
('floor_011', 'ชั้น 1', 'bldg_005')
ON CONFLICT (id) DO NOTHING;

-- 5. สร้าง Room (ห้อง)
INSERT INTO "Room" (id, name, "floorId") VALUES
-- อาคาร A
('room_001', 'ห้องประชุม A1', 'floor_001'),
('room_002', 'ห้องผู้จัดการ', 'floor_001'),
('room_003', 'ห้อง Server', 'floor_001'),
('room_004', 'ห้องทำงาน 2A', 'floor_002'),
('room_005', 'ห้องทำงาน 2B', 'floor_002'),
('room_006', 'ห้องประชุม 2C', 'floor_002'),
('room_007', 'ห้องผู้บริหาร', 'floor_003'),
('room_008', 'ห้องรับรอง VIP', 'floor_003'),
-- อาคาร B
('room_009', 'ห้องประชุม B1', 'floor_004'),
('room_010', 'ห้องฝ่ายขาย', 'floor_004'),
('room_011', 'ห้องฝ่ายบัญชี', 'floor_005'),
('room_012', 'ห้องฝ่าย IT', 'floor_005'),
-- โรงงาน
('room_013', 'สำนักงานโรงงาน', 'floor_006'),
('room_014', 'ห้องควบคุม', 'floor_006'),
('room_015', 'ห้องพักพนักงาน', 'floor_007'),
('room_016', 'ห้องประชุมโรงงาน', 'floor_007'),
-- Delta
('room_017', 'ห้องประชุม D1', 'floor_008'),
('room_018', 'ห้อง Open Office 1', 'floor_008'),
('room_019', 'ห้อง Open Office 2', 'floor_009'),
('room_020', 'ห้องผู้บริหาร Delta', 'floor_010'),
-- Gamma
('room_021', 'สำนักงานโกดัง', 'floor_011'),
('room_022', 'ห้องพักคนงาน', 'floor_011')
ON CONFLICT (id) DO NOTHING;

-- 6. สร้าง Asset (อุปกรณ์) 50 ชิ้น
INSERT INTO "Asset" (id, "qrCode", "assetType", brand, model, "serialNo", btu, "installDate", status, "roomId", "createdAt", "updatedAt") VALUES
-- แอร์ห้องประชุม A1
('asset_001', 'QR-AC-001', 'AIR_CONDITIONER', 'Daikin', 'FTKM25SV2S', 'DK2024001', 24000, '2023-01-15', 'ACTIVE', 'room_001', NOW(), NOW()),
('asset_002', 'QR-AC-002', 'AIR_CONDITIONER', 'Daikin', 'FTKM25SV2S', 'DK2024002', 24000, '2023-01-15', 'ACTIVE', 'room_001', NOW(), NOW()),
-- ห้องผู้จัดการ
('asset_003', 'QR-AC-003', 'AIR_CONDITIONER', 'Mitsubishi Electric', 'MSY-GS18VA', 'ME2024001', 18000, '2023-02-20', 'ACTIVE', 'room_002', NOW(), NOW()),
-- ห้อง Server
('asset_004', 'QR-AC-004', 'AIR_CONDITIONER', 'Daikin', 'FTKQ35SAVMG', 'DK2024003', 36000, '2022-06-10', 'ACTIVE', 'room_003', NOW(), NOW()),
('asset_005', 'QR-AC-005', 'AIR_CONDITIONER', 'Daikin', 'FTKQ35SAVMG', 'DK2024004', 36000, '2022-06-10', 'ACTIVE', 'room_003', NOW(), NOW()),
-- ห้องทำงาน 2A, 2B, 2C
('asset_006', 'QR-AC-006', 'AIR_CONDITIONER', 'Samsung', 'AR18TYHYCWK', 'SS2024001', 18000, '2023-03-01', 'ACTIVE', 'room_004', NOW(), NOW()),
('asset_007', 'QR-AC-007', 'AIR_CONDITIONER', 'Samsung', 'AR18TYHYCWK', 'SS2024002', 18000, '2023-03-01', 'ACTIVE', 'room_005', NOW(), NOW()),
('asset_008', 'QR-AC-008', 'AIR_CONDITIONER', 'LG', 'IQ18R1', 'LG2024001', 18000, '2023-03-15', 'ACTIVE', 'room_006', NOW(), NOW()),
-- ห้องผู้บริหาร, VIP
('asset_009', 'QR-AC-009', 'AIR_CONDITIONER', 'Daikin', 'FTKM35SV2S', 'DK2024005', 32000, '2022-12-01', 'ACTIVE', 'room_007', NOW(), NOW()),
('asset_010', 'QR-AC-010', 'AIR_CONDITIONER', 'Daikin', 'FTKM35SV2S', 'DK2024006', 32000, '2022-12-01', 'ACTIVE', 'room_008', NOW(), NOW()),
-- อาคาร B
('asset_011', 'QR-AC-011', 'AIR_CONDITIONER', 'Carrier', '38FVS024', 'CR2024001', 24000, '2023-04-01', 'ACTIVE', 'room_009', NOW(), NOW()),
('asset_012', 'QR-AC-012', 'AIR_CONDITIONER', 'Carrier', '38FVS018', 'CR2024002', 18000, '2023-04-01', 'ACTIVE', 'room_010', NOW(), NOW()),
('asset_013', 'QR-AC-013', 'AIR_CONDITIONER', 'Mitsubishi Heavy', 'SRK18YXS', 'MH2024001', 18000, '2023-05-10', 'ACTIVE', 'room_011', NOW(), NOW()),
('asset_014', 'QR-AC-014', 'AIR_CONDITIONER', 'Mitsubishi Heavy', 'SRK25YXS', 'MH2024002', 25000, '2023-05-10', 'BROKEN', 'room_012', NOW(), NOW()),
-- โรงงาน
('asset_015', 'QR-AC-015', 'AIR_CONDITIONER', 'Daikin', 'FTKQ50SAVMG', 'DK2024007', 48000, '2022-01-20', 'ACTIVE', 'room_013', NOW(), NOW()),
('asset_016', 'QR-AC-016', 'AIR_CONDITIONER', 'Daikin', 'FTKQ50SAVMG', 'DK2024008', 48000, '2022-01-20', 'ACTIVE', 'room_014', NOW(), NOW()),
('asset_017', 'QR-AC-017', 'AIR_CONDITIONER', 'Carrier', '38FVS030', 'CR2024003', 30000, '2022-03-15', 'ACTIVE', 'room_015', NOW(), NOW()),
('asset_018', 'QR-AC-018', 'AIR_CONDITIONER', 'LG', 'IQ25R1', 'LG2024002', 25000, '2022-03-15', 'ACTIVE', 'room_016', NOW(), NOW()),
-- Delta
('asset_019', 'QR-AC-019', 'AIR_CONDITIONER', 'Samsung', 'AR24TYHYCWK', 'SS2024003', 24000, '2023-06-01', 'ACTIVE', 'room_017', NOW(), NOW()),
('asset_020', 'QR-AC-020', 'AIR_CONDITIONER', 'Samsung', 'AR24TYHYCWK', 'SS2024004', 24000, '2023-06-01', 'ACTIVE', 'room_017', NOW(), NOW()),
('asset_021', 'QR-AC-021', 'AIR_CONDITIONER', 'Daikin', 'FTKM25SV2S', 'DK2024009', 24000, '2023-06-15', 'ACTIVE', 'room_018', NOW(), NOW()),
('asset_022', 'QR-AC-022', 'AIR_CONDITIONER', 'Daikin', 'FTKM25SV2S', 'DK2024010', 24000, '2023-06-15', 'ACTIVE', 'room_018', NOW(), NOW()),
('asset_023', 'QR-AC-023', 'AIR_CONDITIONER', 'Daikin', 'FTKM25SV2S', 'DK2024011', 24000, '2023-06-15', 'ACTIVE', 'room_019', NOW(), NOW()),
('asset_024', 'QR-AC-024', 'AIR_CONDITIONER', 'Daikin', 'FTKM25SV2S', 'DK2024012', 24000, '2023-06-15', 'ACTIVE', 'room_019', NOW(), NOW()),
('asset_025', 'QR-AC-025', 'AIR_CONDITIONER', 'Mitsubishi Electric', 'MSY-GS25VA', 'ME2024002', 25000, '2023-07-01', 'ACTIVE', 'room_020', NOW(), NOW()),
-- Gamma
('asset_026', 'QR-AC-026', 'AIR_CONDITIONER', 'Carrier', '38FVS024', 'CR2024004', 24000, '2023-08-01', 'ACTIVE', 'room_021', NOW(), NOW()),
('asset_027', 'QR-AC-027', 'AIR_CONDITIONER', 'LG', 'IQ18R1', 'LG2024003', 18000, '2023-08-01', 'BROKEN', 'room_022', NOW(), NOW()),
-- เพิ่มแอร์เพิ่มเติม
('asset_028', 'QR-AC-028', 'AIR_CONDITIONER', 'Daikin', 'FTKM18SV2S', 'DK2024013', 18000, '2023-09-01', 'ACTIVE', 'room_001', NOW(), NOW()),
('asset_029', 'QR-AC-029', 'AIR_CONDITIONER', 'Panasonic', 'CS-PU18VKT', 'PN2024001', 18000, '2023-09-15', 'ACTIVE', 'room_004', NOW(), NOW()),
('asset_030', 'QR-AC-030', 'AIR_CONDITIONER', 'Panasonic', 'CS-PU24VKT', 'PN2024002', 24000, '2023-09-15', 'ACTIVE', 'room_005', NOW(), NOW()),
('asset_031', 'QR-AC-031', 'AIR_CONDITIONER', 'Haier', 'HSU-18VNR', 'HR2024001', 18000, '2023-10-01', 'ACTIVE', 'room_010', NOW(), NOW()),
('asset_032', 'QR-AC-032', 'AIR_CONDITIONER', 'Haier', 'HSU-24VNR', 'HR2024002', 24000, '2023-10-01', 'ACTIVE', 'room_011', NOW(), NOW()),
('asset_033', 'QR-AC-033', 'AIR_CONDITIONER', 'TCL', 'TAC-18CHS', 'TCL2024001', 18000, '2023-10-15', 'RETIRED', 'room_015', NOW(), NOW()),
('asset_034', 'QR-AC-034', 'AIR_CONDITIONER', 'Sharp', 'AH-X18VED', 'SH2024001', 18000, '2023-11-01', 'ACTIVE', 'room_016', NOW(), NOW()),
('asset_035', 'QR-AC-035', 'AIR_CONDITIONER', 'Sharp', 'AH-X24VED', 'SH2024002', 24000, '2023-11-01', 'ACTIVE', 'room_018', NOW(), NOW()),

-- อุปกรณ์อื่นๆ (Spare Parts, Tools, Refrigerant)
('asset_036', 'QR-SP-001', 'SPARE_PART', 'Daikin', 'Compressor 24K', 'COMP24K001', NULL, NULL, 'ACTIVE', 'room_003', NOW(), NOW()),
('asset_037', 'QR-SP-002', 'SPARE_PART', 'Generic', 'Fan Motor', 'FM2024001', NULL, NULL, 'ACTIVE', 'room_003', NOW(), NOW()),
('asset_038', 'QR-SP-003', 'SPARE_PART', 'Generic', 'Capacitor 35uF', 'CAP35001', NULL, NULL, 'ACTIVE', 'room_003', NOW(), NOW()),
('asset_039', 'QR-SP-004', 'SPARE_PART', 'Generic', 'PCB Control Board', 'PCB2024001', NULL, NULL, 'ACTIVE', 'room_003', NOW(), NOW()),
('asset_040', 'QR-SP-005', 'SPARE_PART', 'Generic', 'Thermistor Sensor', 'THERM001', NULL, NULL, 'ACTIVE', 'room_003', NOW(), NOW()),
('asset_041', 'QR-RF-001', 'REFRIGERANT', 'Refrigerant', 'R32 10kg', 'R32-2024-001', NULL, NULL, 'ACTIVE', 'room_003', NOW(), NOW()),
('asset_042', 'QR-RF-002', 'REFRIGERANT', 'Refrigerant', 'R410A 11.3kg', 'R410A-2024-001', NULL, NULL, 'ACTIVE', 'room_003', NOW(), NOW()),
('asset_043', 'QR-RF-003', 'REFRIGERANT', 'Refrigerant', 'R32 10kg', 'R32-2024-002', NULL, NULL, 'ACTIVE', 'room_003', NOW(), NOW()),
('asset_044', 'QR-TL-001', 'TOOL', 'Yellow Jacket', 'Manifold Gauge Set', 'YJ2024001', NULL, NULL, 'ACTIVE', 'room_003', NOW(), NOW()),
('asset_045', 'QR-TL-002', 'TOOL', 'Fieldpiece', 'Digital Manifold', 'FP2024001', NULL, NULL, 'ACTIVE', 'room_003', NOW(), NOW()),
('asset_046', 'QR-TL-003', 'TOOL', 'Milwaukee', 'Vacuum Pump', 'MW2024001', NULL, NULL, 'ACTIVE', 'room_003', NOW(), NOW()),
('asset_047', 'QR-TL-004', 'TOOL', 'Fluke', 'Clamp Meter', 'FL2024001', NULL, NULL, 'ACTIVE', 'room_003', NOW(), NOW()),
('asset_048', 'QR-TL-005', 'TOOL', 'Testo', 'Anemometer', 'TS2024001', NULL, NULL, 'ACTIVE', 'room_003', NOW(), NOW()),
('asset_049', 'QR-OT-001', 'OTHER', 'Generic', 'Ladder 6ft', 'LAD2024001', NULL, NULL, 'ACTIVE', 'room_003', NOW(), NOW()),
('asset_050', 'QR-OT-002', 'OTHER', 'Generic', 'Tool Box', 'TB2024001', NULL, NULL, 'ACTIVE', 'room_003', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 7. สร้าง WorkOrder (ใบงาน)
INSERT INTO "WorkOrder" (id, "workOrderNumber", "jobType", "scheduledDate", status, "siteId", "assignedTeam", "createdAt", "updatedAt") VALUES
-- งาน PM ประจำเดือน
('wo_001', '260101-0001', 'PM', '2026-01-15 09:00:00', 'COMPLETED', 'site_001', 'ทีม A', NOW(), NOW()),
('wo_002', '260101-0002', 'PM', '2026-01-16 09:00:00', 'COMPLETED', 'site_002', 'ทีม B', NOW(), NOW()),
('wo_003', '260101-0003', 'PM', '2026-01-20 09:00:00', 'COMPLETED', 'site_003', 'ทีม A', NOW(), NOW()),
('wo_004', '260101-0004', 'PM', '2026-01-25 09:00:00', 'COMPLETED', 'site_004', 'ทีม C', NOW(), NOW()),
-- งาน CM ซ่อมบำรุง
('wo_005', '260102-0001', 'CM', '2026-02-01 10:00:00', 'IN_PROGRESS', 'site_001', 'ทีม A', NOW(), NOW()),
('wo_006', '260102-0002', 'CM', '2026-02-02 10:00:00', 'OPEN', 'site_002', 'ทีม B', NOW(), NOW()),
('wo_007', '260102-0003', 'CM', '2026-02-03 14:00:00', 'OPEN', 'site_003', NULL, NOW(), NOW()),
-- งาน PM กำลังดำเนินการ
('wo_008', '260202-0001', 'PM', '2026-02-05 09:00:00', 'IN_PROGRESS', 'site_001', 'ทีม A', NOW(), NOW()),
('wo_009', '260202-0002', 'PM', '2026-02-06 09:00:00', 'OPEN', 'site_003', 'ทีม B', NOW(), NOW()),
-- งานติดตั้ง
('wo_010', '260202-0003', 'INSTALL', '2026-02-10 09:00:00', 'OPEN', 'site_004', 'ทีม C', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 8. สร้าง JobItem (รายการงาน) เชื่อมกับ Asset
INSERT INTO "JobItem" (id, status, "workOrderId", "assetId", "technicianId", "techNote", "startTime", "endTime") VALUES
-- WO_001: PM เสร็จแล้ว
('ji_001', 'DONE', 'wo_001', 'asset_001', NULL, 'ล้างแอร์เรียบร้อย ไม่พบปัญหา', '2026-01-15 09:30:00', '2026-01-15 10:00:00'),
('ji_002', 'DONE', 'wo_001', 'asset_002', NULL, 'ล้างแอร์เรียบร้อย เปลี่ยน Filter', '2026-01-15 10:15:00', '2026-01-15 10:45:00'),
('ji_003', 'DONE', 'wo_001', 'asset_003', NULL, 'ล้างแอร์เรียบร้อย', '2026-01-15 11:00:00', '2026-01-15 11:30:00'),
-- WO_002: PM เสร็จแล้ว
('ji_004', 'DONE', 'wo_002', 'asset_015', NULL, 'ล้างแอร์เรียบร้อย เติมน้ำยา 500g', '2026-01-16 09:00:00', '2026-01-16 10:00:00'),
('ji_005', 'DONE', 'wo_002', 'asset_016', NULL, 'ล้างแอร์เรียบร้อย', '2026-01-16 10:30:00', '2026-01-16 11:30:00'),
-- WO_003: PM เสร็จแล้ว
('ji_006', 'DONE', 'wo_003', 'asset_019', NULL, 'ล้างแอร์เรียบร้อย', '2026-01-20 09:00:00', '2026-01-20 09:30:00'),
('ji_007', 'DONE', 'wo_003', 'asset_020', NULL, 'ล้างแอร์เรียบร้อย', '2026-01-20 09:45:00', '2026-01-20 10:15:00'),
-- WO_004: PM เสร็จแล้ว
('ji_008', 'DONE', 'wo_004', 'asset_026', NULL, 'ล้างแอร์เรียบร้อย', '2026-01-25 09:00:00', '2026-01-25 09:45:00'),
-- WO_005: CM กำลังดำเนินการ (แอร์เสีย)
('ji_009', 'IN_PROGRESS', 'wo_005', 'asset_014', NULL, 'กำลังตรวจสอบ Compressor', '2026-02-01 10:00:00', NULL),
('ji_010', 'PENDING', 'wo_005', 'asset_006', NULL, NULL, NULL, NULL),
-- WO_006: CM รอดำเนินการ
('ji_011', 'PENDING', 'wo_006', 'asset_017', NULL, NULL, NULL, NULL),
('ji_012', 'PENDING', 'wo_006', 'asset_018', NULL, NULL, NULL, NULL),
-- WO_007: CM รอดำเนินการ
('ji_013', 'PENDING', 'wo_007', 'asset_021', NULL, NULL, NULL, NULL),
-- WO_008: PM กำลังดำเนินการ
('ji_014', 'DONE', 'wo_008', 'asset_004', NULL, 'ล้างแอร์เรียบร้อย', '2026-02-05 09:00:00', '2026-02-05 10:00:00'),
('ji_015', 'IN_PROGRESS', 'wo_008', 'asset_005', NULL, 'กำลังล้างแอร์', '2026-02-05 10:30:00', NULL),
('ji_016', 'PENDING', 'wo_008', 'asset_009', NULL, NULL, NULL, NULL),
('ji_017', 'PENDING', 'wo_008', 'asset_010', NULL, NULL, NULL, NULL),
-- WO_009: PM รอดำเนินการ
('ji_018', 'PENDING', 'wo_009', 'asset_023', NULL, NULL, NULL, NULL),
('ji_019', 'PENDING', 'wo_009', 'asset_024', NULL, NULL, NULL, NULL),
('ji_020', 'PENDING', 'wo_009', 'asset_025', NULL, NULL, NULL, NULL),
-- WO_010: Install รอดำเนินการ
('ji_021', 'PENDING', 'wo_010', 'asset_027', NULL, 'รอติดตั้งเครื่องใหม่แทนเครื่องเสีย', NULL, NULL)
ON CONFLICT (id) DO NOTHING;

-- 9. สร้าง Technician Users (ช่าง) ถ้ายังไม่มี
INSERT INTO "User" (id, username, password, "fullName", role, locked, "createdAt", "updatedAt") VALUES
('tech_001', 'somchai', '$2a$10$rQZ5QkBvvYjKJ5qPqH5xQOzGQP5QkBvvYjKJ5qPqH5xQOabc123', 'สมชาย ช่างเย็น', 'TECHNICIAN', false, NOW(), NOW()),
('tech_002', 'wichai', '$2a$10$rQZ5QkBvvYjKJ5qPqH5xQOzGQP5QkBvvYjKJ5qPqH5xQOdef456', 'วิชัย แอร์สวย', 'TECHNICIAN', false, NOW(), NOW()),
('tech_003', 'prasit', '$2a$10$rQZ5QkBvvYjKJ5qPqH5xQOzGQP5QkBvvYjKJ5qPqH5xQOghi789', 'ประสิทธิ์ เย็นฉ่ำ', 'TECHNICIAN', false, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 10. สร้าง Client Users (ลูกค้า) ถ้ายังไม่มี
INSERT INTO "User" (id, username, password, "fullName", role, locked, "siteId", "createdAt", "updatedAt") VALUES
('client_user_001', 'abc_admin', '$2a$10$rQZ5QkBvvYjKJ5qPqH5xQOzGQP5QkBvvYjKJ5qPqH5xQOabc123', 'ผู้ดูแล ABC', 'CLIENT', false, 'site_001', NOW(), NOW()),
('client_user_002', 'delta_admin', '$2a$10$rQZ5QkBvvYjKJ5qPqH5xQOzGQP5QkBvvYjKJ5qPqH5xQOdef456', 'ผู้ดูแล Delta', 'CLIENT', false, 'site_003', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- แสดงสรุปข้อมูลที่สร้าง
SELECT 'Summary' as info;
SELECT 'Clients: ' || COUNT(*) FROM "Client";
SELECT 'Sites: ' || COUNT(*) FROM "Site";
SELECT 'Buildings: ' || COUNT(*) FROM "Building";
SELECT 'Floors: ' || COUNT(*) FROM "Floor";
SELECT 'Rooms: ' || COUNT(*) FROM "Room";
SELECT 'Assets: ' || COUNT(*) FROM "Asset";
SELECT 'WorkOrders: ' || COUNT(*) FROM "WorkOrder";
SELECT 'JobItems: ' || COUNT(*) FROM "JobItem";
SELECT 'Users (Technicians): ' || COUNT(*) FROM "User" WHERE role = 'TECHNICIAN';
SELECT 'Users (Clients): ' || COUNT(*) FROM "User" WHERE role = 'CLIENT';
