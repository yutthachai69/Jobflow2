-- ==========================================
-- SQL Script สำหรับสร้างทรัพย์สินและอุปกรณ์ 50 รายการ
-- สำหรับรันใน pgAdmin (PostgreSQL)
-- ==========================================
-- 
-- สัดส่วน:
-- - เครื่องปรับอากาศ: 20 รายการ (40%) - มี QR Code
-- - น้ำยาแอร์: 10 รายการ (20%)
-- - อะไหล่: 10 รายการ (20%)
-- - เครื่องมือ: 8 รายการ (16%)
-- - อื่นๆ: 2 รายการ (4%)
--
-- หมายเหตุ: QR Code จะมีเฉพาะเครื่องปรับอากาศเท่านั้น
-- อุปกรณ์อื่นๆ จะใช้ serialNo เป็น qrCode (แต่จะไม่แสดงใน UI)
--
-- Usage: 
--   1. เปิด pgAdmin
--   2. เลือก database ที่ต้องการ
--   3. เปิด Query Tool (Tools > Query Tool)
--   4. Copy SQL ทั้งหมดนี้ไปวาง
--   5. กด Execute (F5)
-- ==========================================

-- เริ่ม Transaction
BEGIN;

-- 1. ตรวจสอบข้อมูลพื้นฐาน
DO $$
DECLARE
    room_count INTEGER;
    existing_asset_count INTEGER;
    max_asset_index INTEGER;
BEGIN
    -- ตรวจสอบว่ามี Room หรือไม่
    SELECT COUNT(*) INTO room_count FROM "Room";
    IF room_count = 0 THEN
        RAISE EXCEPTION 'ไม่พบ Room ในระบบ! กรุณารัน seed ก่อน';
    END IF;

    -- นับจำนวน assets ที่มีอยู่แล้ว
    SELECT COUNT(*) INTO existing_asset_count FROM "Asset";
    
    -- หาเลขลำดับสูงสุดจาก QR Code (ถ้ามี)
    SELECT COALESCE(MAX(CAST(SUBSTRING("qrCode" FROM '(\d+)$') AS INTEGER)), 0)
    INTO max_asset_index
    FROM "Asset"
    WHERE "qrCode" ~ '^\d+$' OR "qrCode" LIKE 'AC-%' OR "qrCode" LIKE 'REF-%' OR "qrCode" LIKE 'PART-%' OR "qrCode" LIKE 'TOOL-%' OR "qrCode" LIKE 'OTH-%';

    RAISE NOTICE '✅ พบข้อมูลพื้นฐาน:';
    RAISE NOTICE '   - Rooms: % ห้อง', room_count;
    RAISE NOTICE '   - Assets ที่มีอยู่แล้ว: % รายการ', existing_asset_count;
    RAISE NOTICE '   - จะสร้างเพิ่มอีก 50 รายการ';
END $$;

-- 2. ฟังก์ชันสร้าง ID แบบ cuid() สำหรับ PostgreSQL
CREATE OR REPLACE FUNCTION generate_cuid()
RETURNS TEXT AS $$
DECLARE
    timestamp_part TEXT;
    random_part TEXT;
    counter_part TEXT;
BEGIN
    -- สร้าง timestamp part (base36)
    timestamp_part := LPAD(TO_CHAR(EXTRACT(EPOCH FROM NOW())::BIGINT, 'FM999999999999999'), 13, '0');
    
    -- สร้าง random part (22 ตัวอักษร)
    random_part := SUBSTRING(MD5(RANDOM()::TEXT || CLOCK_TIMESTAMP()::TEXT), 1, 22);
    
    -- สร้าง counter part (2 ตัวอักษร)
    counter_part := LPAD(TO_CHAR((RANDOM() * 46656)::INTEGER, 'FM999'), 2, '0');
    
    RETURN 'c' || timestamp_part || random_part || counter_part;
END;
$$ LANGUAGE plpgsql;

-- 3. สร้าง Assets 50 รายการ
DO $$
DECLARE
    -- ตัวแปรสำหรับ Asset
    asset_id TEXT;
    asset_qr_code TEXT;
    asset_type TEXT;
    asset_brand TEXT;
    asset_model TEXT;
    asset_serial TEXT;
    asset_btu INTEGER;
    asset_status TEXT;
    asset_room_id TEXT;
    asset_install_date TIMESTAMP;
    
    -- ข้อมูลสำหรับสร้าง
    air_brands TEXT[] := ARRAY['Daikin', 'Carrier', 'Mitsubishi', 'LG', 'Samsung', 'Toshiba', 'Panasonic', 'Hitachi', 'Fujitsu', 'York'];
    refrigerant_brands TEXT[] := ARRAY['R-410A', 'R-22', 'R-32', 'R-134a', 'R-407C', 'R-404A'];
    spare_part_types TEXT[] := ARRAY['Filter', 'Compressor', 'Fan Motor', 'Capacitor', 'Thermostat', 'Coil', 'Drain Pan', 'Expansion Valve'];
    tool_types TEXT[] := ARRAY['Vacuum Pump', 'Gauges Set', 'Refrigerant Scale', 'Leak Detector', 'Multimeter', 'Drill', 'Wrench Set', 'Torch Kit'];
    btu_ranges INTEGER[] := ARRAY[12000, 18000, 24000, 30000, 36000, 48000];
    statuses TEXT[] := ARRAY['ACTIVE', 'ACTIVE', 'ACTIVE', 'ACTIVE', 'BROKEN', 'RETIRED'];
    
    -- ตัวแปรสำหรับ loop
    i INTEGER;
    asset_index INTEGER;
    room_ids TEXT[];
    random_room_index INTEGER;
    type_distribution TEXT[] := ARRAY[
        'AIR_CONDITIONER', 'AIR_CONDITIONER', 'AIR_CONDITIONER', 'AIR_CONDITIONER', 'AIR_CONDITIONER',
        'AIR_CONDITIONER', 'AIR_CONDITIONER', 'AIR_CONDITIONER', 'AIR_CONDITIONER', 'AIR_CONDITIONER',
        'AIR_CONDITIONER', 'AIR_CONDITIONER', 'AIR_CONDITIONER', 'AIR_CONDITIONER', 'AIR_CONDITIONER',
        'AIR_CONDITIONER', 'AIR_CONDITIONER', 'AIR_CONDITIONER', 'AIR_CONDITIONER', 'AIR_CONDITIONER',
        'REFRIGERANT', 'REFRIGERANT', 'REFRIGERANT', 'REFRIGERANT', 'REFRIGERANT',
        'REFRIGERANT', 'REFRIGERANT', 'REFRIGERANT', 'REFRIGERANT', 'REFRIGERANT',
        'SPARE_PART', 'SPARE_PART', 'SPARE_PART', 'SPARE_PART', 'SPARE_PART',
        'SPARE_PART', 'SPARE_PART', 'SPARE_PART', 'SPARE_PART', 'SPARE_PART',
        'TOOL', 'TOOL', 'TOOL', 'TOOL', 'TOOL',
        'TOOL', 'TOOL', 'TOOL',
        'OTHER', 'OTHER'
    ];
    shuffled_types TEXT[];
    temp_type TEXT;
    j INTEGER;
    rand_index INTEGER;
BEGIN
    -- ดึง Room IDs ทั้งหมด
    SELECT ARRAY_AGG(id) INTO room_ids FROM "Room";
    
    IF room_ids IS NULL OR array_length(room_ids, 1) = 0 THEN
        RAISE EXCEPTION 'ไม่พบ Room ในระบบ!';
    END IF;
    
    -- นับ assets ที่มีอยู่แล้วเพื่อใช้เป็น starting index
    SELECT COALESCE(COUNT(*), 0) INTO asset_index FROM "Asset";
    asset_index := asset_index + 1;
    
    -- สุ่มลำดับ asset types
    shuffled_types := type_distribution;
    FOR i IN 1..array_length(shuffled_types, 1) LOOP
        rand_index := 1 + floor(random() * array_length(shuffled_types, 1))::INTEGER;
        temp_type := shuffled_types[i];
        shuffled_types[i] := shuffled_types[rand_index];
        shuffled_types[rand_index] := temp_type;
    END LOOP;
    
    -- สร้าง Assets
    FOR i IN 1..50 LOOP
        asset_id := generate_cuid();
        asset_type := shuffled_types[i];
        asset_status := statuses[1 + floor(random() * array_length(statuses, 1))::INTEGER];
        random_room_index := 1 + floor(random() * array_length(room_ids, 1))::INTEGER;
        asset_room_id := room_ids[random_room_index];
        
        -- กำหนดค่าเฉพาะตาม asset type
        IF asset_type = 'AIR_CONDITIONER' THEN
            -- เครื่องปรับอากาศ - มี QR Code
            asset_qr_code := 'AC-2024-' || LPAD(asset_index::TEXT, 3, '0');
            asset_brand := air_brands[1 + floor(random() * array_length(air_brands, 1))::INTEGER];
            asset_model := 'Model-' || 
                (ARRAY['X', 'Y', 'Z'])[1 + floor(random() * 3)::INTEGER] || 
                (1 + floor(random() * 10))::TEXT;
            asset_serial := 'SN-' || UPPER(SUBSTRING(asset_brand, 1, 3)) || '-' || LPAD(asset_index::TEXT, 5, '0');
            asset_btu := btu_ranges[1 + floor(random() * array_length(btu_ranges, 1))::INTEGER];
            asset_install_date := NOW() - (random() * INTERVAL '3 years');
            
        ELSIF asset_type = 'REFRIGERANT' THEN
            -- น้ำยาแอร์
            asset_brand := refrigerant_brands[1 + floor(random() * array_length(refrigerant_brands, 1))::INTEGER];
            asset_serial := 'REF-' || LPAD(asset_index::TEXT, 5, '0');
            asset_qr_code := asset_serial; -- ใช้ serialNo เป็น qrCode
            asset_model := asset_brand || ' ' || (1 + floor(random() * 5))::TEXT || 'kg';
            asset_btu := NULL;
            asset_install_date := NULL;
            
        ELSIF asset_type = 'SPARE_PART' THEN
            -- อะไหล่
            asset_brand := spare_part_types[1 + floor(random() * array_length(spare_part_types, 1))::INTEGER];
            asset_serial := 'PART-' || LPAD(asset_index::TEXT, 5, '0');
            asset_qr_code := asset_serial; -- ใช้ serialNo เป็น qrCode
            asset_model := 'Size-' || (ARRAY['S', 'M', 'L', 'XL'])[1 + floor(random() * 4)::INTEGER];
            asset_btu := NULL;
            asset_install_date := NULL;
            
        ELSIF asset_type = 'TOOL' THEN
            -- เครื่องมือ
            asset_brand := tool_types[1 + floor(random() * array_length(tool_types, 1))::INTEGER];
            asset_serial := 'TOOL-' || LPAD(asset_index::TEXT, 5, '0');
            asset_qr_code := asset_serial; -- ใช้ serialNo เป็น qrCode
            asset_model := 'Pro-' || (1 + floor(random() * 10))::TEXT;
            asset_btu := NULL;
            asset_install_date := NULL;
            
        ELSE
            -- อื่นๆ
            asset_serial := 'OTH-' || LPAD(asset_index::TEXT, 5, '0');
            asset_qr_code := asset_serial; -- ใช้ serialNo เป็น qrCode
            asset_brand := 'Generic';
            asset_model := 'Item-' || asset_index::TEXT;
            asset_btu := NULL;
            asset_install_date := NULL;
        END IF;
        
        -- Insert Asset
        BEGIN
            -- ตรวจสอบว่ามี column createdAt และ updatedAt หรือไม่
            IF EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'Asset' AND column_name = 'createdAt'
            ) THEN
                -- มี createdAt และ updatedAt - ใส่ค่าทั้งหมด
                INSERT INTO "Asset" (
                    id,
                    "qrCode",
                    "assetType",
                    brand,
                    model,
                    "serialNo",
                    btu,
                    "installDate",
                    status,
                    "roomId",
                    "createdAt",
                    "updatedAt"
                ) VALUES (
                    asset_id,
                    asset_qr_code,
                    asset_type::"AssetType",
                    asset_brand,
                    asset_model,
                    asset_serial,
                    asset_btu,
                    asset_install_date,
                    asset_status::"AssetStatus",
                    asset_room_id,
                    NOW(),
                    NOW()
                );
            ELSE
                -- ไม่มี createdAt และ updatedAt - ไม่ใส่ (ใช้ DEFAULT)
                INSERT INTO "Asset" (
                    id,
                    "qrCode",
                    "assetType",
                    brand,
                    model,
                    "serialNo",
                    btu,
                    "installDate",
                    status,
                    "roomId"
                ) VALUES (
                    asset_id,
                    asset_qr_code,
                    asset_type::"AssetType",
                    asset_brand,
                    asset_model,
                    asset_serial,
                    asset_btu,
                    asset_install_date,
                    asset_status::"AssetStatus",
                    asset_room_id
                );
            END IF;
            
            asset_index := asset_index + 1;
        EXCEPTION
            WHEN unique_violation THEN
                RAISE NOTICE '⚠️  ข้าม % (QR Code ซ้ำ)', asset_qr_code;
        END;
    END LOOP;
    
    RAISE NOTICE '✅ สร้างทรัพย์สินสำเร็จ!';
END $$;

-- 4. แสดงสถิติ
DO $$
DECLARE
    total_count INTEGER;
    ac_count INTEGER;
    ref_count INTEGER;
    part_count INTEGER;
    tool_count INTEGER;
    other_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_count FROM "Asset";
    SELECT COUNT(*) INTO ac_count FROM "Asset" WHERE "assetType" = 'AIR_CONDITIONER';
    SELECT COUNT(*) INTO ref_count FROM "Asset" WHERE "assetType" = 'REFRIGERANT';
    SELECT COUNT(*) INTO part_count FROM "Asset" WHERE "assetType" = 'SPARE_PART';
    SELECT COUNT(*) INTO tool_count FROM "Asset" WHERE "assetType" = 'TOOL';
    SELECT COUNT(*) INTO other_count FROM "Asset" WHERE "assetType" = 'OTHER';
    
    RAISE NOTICE '';
    RAISE NOTICE '📊 สรุป:';
    RAISE NOTICE '   จำนวนทรัพย์สินทั้งหมด: % รายการ', total_count;
    RAISE NOTICE '';
    RAISE NOTICE '📈 ประเภททรัพย์สิน:';
    RAISE NOTICE '   - เครื่องปรับอากาศ: % รายการ', ac_count;
    RAISE NOTICE '   - น้ำยาแอร์: % รายการ', ref_count;
    RAISE NOTICE '   - อะไหล่: % รายการ', part_count;
    RAISE NOTICE '   - เครื่องมือ: % รายการ', tool_count;
    RAISE NOTICE '   - อื่นๆ: % รายการ', other_count;
END $$;

-- Commit Transaction
COMMIT;

-- แสดงข้อความสำเร็จ
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🎉 เสร็จสิ้น! ตรวจสอบข้อมูลได้ที่ Prisma Studio หรือ pgAdmin';
END $$;
