-- =========================================================================================
-- สคริปต์สำหรับจำลองข้อมูล (Mock Data) ทรัพย์สินและอุปกรณ์แอร์ 906 เครื่อง สำหรับหน้า Dashboard
-- =========================================================================================
-- ประกอบด้วย:
-- 1. AHU (90 เครื่อง)
-- 2. FCU (288 เครื่อง)
-- 3. SPLIT TYPE (75 เครื่อง)
-- 4. EXHAUST (453 เครื่อง)
-- รวม 906 เครื่อง
-- =========================================================================================

DO $$ 
DECLARE
    v_client_id TEXT := gen_random_uuid()::text;
    v_site_id TEXT := gen_random_uuid()::text;
    v_building_id TEXT := gen_random_uuid()::text;
    v_floor_id TEXT := gen_random_uuid()::text;
    v_room_id TEXT := gen_random_uuid()::text;
    v_room_exists TEXT;
BEGIN
    -- เช็คก่อนว่าในระบบมีห้อง (Room) อยู่แล้วหรือไม่ 
    -- ถ้ามี ให้ดึง ID ของห้องแรกมาใช้ จะได้ไม่ต้องสร้างข้อมูลสถานที่หลอกๆ เพิ่ม
    SELECT id INTO v_room_exists FROM "Room" LIMIT 1;
    
    IF v_room_exists IS NOT NULL THEN
        v_room_id := v_room_exists;
    ELSE
        -- ถ้าไม่มีข้อมูลสถานที่เลย ให้สร้าง Dummy Data สำหรับ Structure (Client -> Site -> Building -> Floor -> Room)
        INSERT INTO "Client" (id, name, "createdAt") VALUES (v_client_id, 'Mock Client Corp', now());
        INSERT INTO "Site" (id, name, "clientId") VALUES (v_site_id, 'Headquarter Site', v_client_id);
        INSERT INTO "Building" (id, name, "siteId") VALUES (v_building_id, 'Main Building', v_site_id);
        INSERT INTO "Floor" (id, name, "buildingId") VALUES (v_floor_id, 'Floor 1', v_building_id);
        INSERT INTO "Room" (id, name, "floorId") VALUES (v_room_id, 'Mock Server Room', v_floor_id);
    END IF;

    -- ==========================================
    -- 1. Insert 90 AHU
    -- ==========================================
    INSERT INTO "Asset" (id, "qrCode", "assetType", "machineType", brand, model, "serialNo", btu, "installDate", status, "roomId", "createdAt", "updatedAt")
    SELECT 
        gen_random_uuid()::text,
        'AHU-MOCK-' || LPAD(i::text, 3, '0'), -- สร้างรหัสแบบรันเลข เช่น AHU-MOCK-001
        'AIR_CONDITIONER',
        'AHU',
        'Trane',
        'ClimateChanger AHU',
        'SN-AHU-' || LPAD(i::text, 3, '0'),
        120000 + (random() * 50000)::int,
        now() - (random() * interval '365 days'),
        'ACTIVE',
        v_room_id,
        now(),
        now()
    FROM generate_series(1, 90) as i;

    -- ==========================================
    -- 2. Insert 288 FCU
    -- ==========================================
    INSERT INTO "Asset" (id, "qrCode", "assetType", "machineType", brand, model, "serialNo", btu, "installDate", status, "roomId", "createdAt", "updatedAt")
    SELECT 
        gen_random_uuid()::text,
        'FCU-MOCK-' || LPAD(i::text, 3, '0'), -- สร้างรหัสแบบรันเลข เช่น FCU-MOCK-001
        'AIR_CONDITIONER',
        'FCU',
        'Carrier',
        '42TGF Ceiling',
        'SN-FCU-' || LPAD(i::text, 3, '0'),
        24000 + (random() * 12000)::int,
        now() - (random() * interval '365 days'),
        'ACTIVE',
        v_room_id,
        now(),
        now()
    FROM generate_series(1, 288) as i;

    -- ==========================================
    -- 3. Insert 75 SPLIT_TYPE
    -- ==========================================
    INSERT INTO "Asset" (id, "qrCode", "assetType", "machineType", brand, model, "serialNo", btu, "installDate", status, "roomId", "createdAt", "updatedAt")
    SELECT 
        gen_random_uuid()::text,
        'SPLIT-MOCK-' || LPAD(i::text, 3, '0'), -- สร้างรหัสแบบรันเลข เช่น SPLIT-MOCK-001
        'AIR_CONDITIONER',
        'SPLIT_TYPE',
        'Daikin',
        'Inverter FTKM',
        'SN-SPLIT-' || LPAD(i::text, 3, '0'),
        18000 + (random() * 6000)::int,
        now() - (random() * interval '365 days'),
        'ACTIVE',
        v_room_id,
        now(),
        now()
    FROM generate_series(1, 75) as i;

    -- ==========================================
    -- 4. Insert 453 EXHAUST
    -- ==========================================
    INSERT INTO "Asset" (id, "qrCode", "assetType", "machineType", brand, model, "serialNo", btu, "installDate", status, "roomId", "createdAt", "updatedAt")
    SELECT 
        gen_random_uuid()::text,
        'EXH-MOCK-' || LPAD(i::text, 3, '0'), -- สร้างรหัสแบบรันเลข เช่น EXH-MOCK-001
        'AIR_CONDITIONER',
        'EXHAUST',
        'Panasonic',
        'Ventilation-Pro Exhaust',
        'SN-EXH-' || LPAD(i::text, 3, '0'),
        NULL,
        now() - (random() * interval '365 days'),
        'ACTIVE',
        v_room_id,
        now(),
        now()
    FROM generate_series(1, 453) as i;

END $$;
