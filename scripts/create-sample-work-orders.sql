-- ==========================================
-- SQL Script สำหรับสร้างข้อมูลตัวอย่าง Work Orders และ Job Items
-- สำหรับรันใน pgAdmin (PostgreSQL)
-- ==========================================
-- 
-- สร้าง:
-- - Work Orders หลายใบ (PM, CM, INSTALL)
-- - Job Items ที่มีสถานะต่างๆ (PENDING, IN_PROGRESS, DONE, ISSUE_FOUND)
-- - Job Photos สำหรับงานที่เสร็จแล้ว (BEFORE, AFTER, DEFECT, METER)
--
-- Usage: 
--   1. เปิด pgAdmin
--   2. เลือก database ที่ต้องการ
--   3. เปิด Query Tool (Tools > Query Tool)
--   4. Copy SQL ทั้งหมดนี้ไปวาง
--   5. กด Execute (F5)
--
-- หมายเหตุเรื่องรูปภาพ:
--   - Script นี้ใช้ placeholder URL (via.placeholder.com)
--   - อาจไม่แสดงใน UI เนื่องจาก CSP (Content Security Policy) ไม่อนุญาต external images
--   - สำหรับ production ควรใช้รูปจริงจาก Vercel Blob หรือ storage อื่น
--   - หรือแก้ไข CSP ใน middleware.ts เพื่ออนุญาต external images (ไม่แนะนำ)
-- ==========================================

-- เริ่ม Transaction
BEGIN;

-- 1. ตรวจสอบข้อมูลพื้นฐาน
DO $$
DECLARE
    tech_count INTEGER;
    site_count INTEGER;
    asset_count INTEGER;
    max_wo_seq INTEGER;
    new_wo_number TEXT;
BEGIN
    -- ตรวจสอบว่ามีช่างหรือไม่
    SELECT COUNT(*) INTO tech_count FROM "User" WHERE role = 'TECHNICIAN';
    IF tech_count = 0 THEN
        RAISE EXCEPTION 'ไม่พบช่างในระบบ! กรุณารัน seed ก่อน';
    END IF;

    -- ตรวจสอบว่ามี Site หรือไม่
    SELECT COUNT(*) INTO site_count FROM "Site";
    IF site_count = 0 THEN
        RAISE EXCEPTION 'ไม่พบ Site ในระบบ! กรุณารัน seed ก่อน';
    END IF;

    -- ตรวจสอบว่ามี Assets หรือไม่
    SELECT COUNT(*) INTO asset_count FROM "Asset" WHERE status = 'ACTIVE';
    IF asset_count = 0 THEN
        RAISE EXCEPTION 'ไม่พบ Assets ในระบบ! กรุณารัน script สร้าง assets ก่อน';
    END IF;

    RAISE NOTICE '✅ พบข้อมูลพื้นฐาน:';
    RAISE NOTICE '   - ช่าง: % คน', tech_count;
    RAISE NOTICE '   - Site: % แห่ง', site_count;
    RAISE NOTICE '   - Assets: % รายการ', asset_count;
END $$;

-- 2. ฟังก์ชันสร้างเลขที่งาน (8vxgpup####)
CREATE OR REPLACE FUNCTION generate_work_order_number()
RETURNS TEXT AS $$
DECLARE
    max_seq INTEGER;
    next_seq INTEGER;
    seq_str TEXT;
BEGIN
    -- หาเลขลำดับสูงสุด
    SELECT COALESCE(MAX(CAST(SUBSTRING("workOrderNumber" FROM 8) AS INTEGER)), 0)
    INTO max_seq
    FROM "WorkOrder"
    WHERE "workOrderNumber" LIKE '8vxgpup%';
    
    -- สร้างเลขลำดับถัดไป
    next_seq := max_seq + 1;
    seq_str := LPAD(next_seq::TEXT, 4, '0');
    
    RETURN '8vxgpup' || seq_str;
END;
$$ LANGUAGE plpgsql;

-- 3. สร้าง Work Orders และ Job Items
DO $$
DECLARE
    -- ตัวแปรสำหรับ Work Order
    wo_id TEXT;
    wo_number TEXT;
    site_id TEXT;
    job_type TEXT;
    scheduled_date TIMESTAMP;
    wo_status TEXT;
    assigned_team TEXT;
    
    -- ตัวแปรสำหรับ Job Item
    ji_id TEXT;
    asset_id TEXT;
    tech_id TEXT;
    ji_status TEXT;
    start_time TIMESTAMP;
    end_time TIMESTAMP;
    tech_note TEXT;
    
    -- ตัวแปรสำหรับ Photo
    photo_id TEXT;
    photo_type TEXT;
    photo_url TEXT;
    
    -- ตัวแปรอื่นๆ
    tech_cursor CURSOR FOR SELECT id FROM "User" WHERE role = 'TECHNICIAN' LIMIT 1;
    site_cursor CURSOR FOR SELECT id FROM "Site" LIMIT 1;
    asset_rec RECORD;
    selected_assets TEXT[];
    num_assets INTEGER;
    days_offset INTEGER;
    hours_offset INTEGER;
    minutes_offset INTEGER;
    work_duration INTEGER;
    rand_val NUMERIC;
    photo_types TEXT[];
    i INTEGER;
    j INTEGER;
    created_wo_count INTEGER := 0;
    created_ji_count INTEGER := 0;
    created_photo_count INTEGER := 0;
BEGIN
    -- สร้าง 15 Work Orders
    FOR i IN 1..15 LOOP
        -- สุ่ม Site
        SELECT id INTO site_id FROM "Site" ORDER BY RANDOM() LIMIT 1;
        
        -- สุ่ม Job Type
        job_type := CASE (RANDOM() * 3)::INTEGER
            WHEN 0 THEN 'PM'
            WHEN 1 THEN 'CM'
            ELSE 'INSTALL'
        END;
        
        -- สร้างวันที่นัดหมาย (สุ่มระหว่าง 7 วันที่ผ่านมา ถึง 30 วันข้างหน้า)
        days_offset := (RANDOM() * 37)::INTEGER - 7;
        scheduled_date := CURRENT_TIMESTAMP + (days_offset || ' days')::INTERVAL;
        scheduled_date := scheduled_date::DATE + TIME '09:00:00' + ((RANDOM() * 8)::INTEGER || ' hours')::INTERVAL + ((RANDOM() * 4)::INTEGER * 15 || ' minutes')::INTERVAL;
        
        -- สุ่มสถานะ Work Order
        rand_val := RANDOM();
        IF rand_val < 0.33 THEN
            wo_status := 'OPEN';
        ELSIF rand_val < 0.66 THEN
            wo_status := 'IN_PROGRESS';
        ELSE
            wo_status := 'COMPLETED';
        END IF;
        
        -- สุ่มทีมงาน
        rand_val := RANDOM();
        IF rand_val < 0.25 THEN
            assigned_team := 'ทีม A';
        ELSIF rand_val < 0.5 THEN
            assigned_team := 'ทีม B';
        ELSIF rand_val < 0.75 THEN
            assigned_team := 'ทีม C';
        ELSE
            assigned_team := NULL;
        END IF;
        
        -- สร้างเลขที่งาน
        wo_number := generate_work_order_number();
        
        -- สร้าง Work Order (ใช้ cuid format)
        wo_id := 'cl' || substr(md5(random()::text || clock_timestamp()::text), 1, 22);
        INSERT INTO "WorkOrder" (id, "workOrderNumber", "jobType", "scheduledDate", status, "siteId", "assignedTeam", "createdAt", "updatedAt")
        VALUES (wo_id, wo_number, job_type::"JobType", scheduled_date, wo_status::"OrderStatus", site_id, assigned_team, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
        
        created_wo_count := created_wo_count + 1;
        
        -- สุ่มจำนวน Assets ต่อ Work Order (1-5 รายการ)
        num_assets := (RANDOM() * 5)::INTEGER + 1;
        
        -- เลือก Assets แบบสุ่ม
        selected_assets := ARRAY(
            SELECT id FROM "Asset" 
            WHERE status = 'ACTIVE' 
            ORDER BY RANDOM() 
            LIMIT num_assets
        );
        
        -- ถ้าไม่มี assets ที่เลือก ให้เลือกแบบสุ่ม
        IF array_length(selected_assets, 1) IS NULL OR array_length(selected_assets, 1) = 0 THEN
            selected_assets := ARRAY(
                SELECT id FROM "Asset" 
                WHERE status = 'ACTIVE' 
                LIMIT num_assets
            );
        END IF;
        
        -- สุ่มช่าง (บางงานอาจยังไม่ได้มอบหมาย)
        IF RANDOM() > 0.2 THEN
            SELECT id INTO tech_id FROM "User" WHERE role = 'TECHNICIAN' ORDER BY RANDOM() LIMIT 1;
        ELSE
            tech_id := NULL;
        END IF;
        
            -- สร้าง Job Items
            FOREACH asset_id IN ARRAY selected_assets LOOP
                ji_id := 'cl' || substr(md5(random()::text || clock_timestamp()::text), 1, 22);
            
            -- สุ่มสถานะ Job Item ตามสถานะ Work Order
            IF wo_status = 'OPEN' THEN
                ji_status := 'PENDING';
            ELSIF wo_status = 'IN_PROGRESS' THEN
                rand_val := RANDOM();
                IF rand_val < 0.4 THEN
                    ji_status := 'DONE';
                ELSIF rand_val < 0.7 THEN
                    ji_status := 'IN_PROGRESS';
                ELSIF rand_val < 0.9 THEN
                    ji_status := 'PENDING';
                ELSE
                    ji_status := 'ISSUE_FOUND';
                END IF;
            ELSE -- COMPLETED
                ji_status := 'DONE';
            END IF;
            
            -- สร้าง startTime และ endTime ตามสถานะ
            start_time := NULL;
            end_time := NULL;
            IF ji_status IN ('IN_PROGRESS', 'DONE', 'ISSUE_FOUND') THEN
                start_time := scheduled_date::DATE + TIME '09:00:00' + ((RANDOM() * 4)::INTEGER || ' hours')::INTERVAL + ((RANDOM() * 60)::INTEGER || ' minutes')::INTERVAL;
                
                IF ji_status = 'DONE' THEN
                    -- ถ้าเสร็จแล้ว ให้มี endTime (ใช้เวลา 30-180 นาที)
                    work_duration := 30 + (RANDOM() * 150)::INTEGER;
                    end_time := start_time + (work_duration || ' minutes')::INTERVAL;
                END IF;
            END IF;
            
            -- สร้าง techNote สำหรับงานที่ทำแล้ว
            tech_note := NULL;
            IF ji_status IN ('DONE', 'IN_PROGRESS', 'ISSUE_FOUND') THEN
                tech_note := (
                    SELECT CASE (RANDOM() * 8)::INTEGER
                        WHEN 0 THEN 'ล้างแอร์เสร็จเรียบร้อย ตรวจสอบแล้วใช้งานได้ปกติ'
                        WHEN 1 THEN 'เปลี่ยนแผ่นกรองอากาศ ตรวจสอบระบบระบายความร้อน'
                        WHEN 2 THEN 'เติมน้ำยาแอร์ ตรวจสอบการทำงานของคอมเพรสเซอร์'
                        WHEN 3 THEN 'ทำความสะอาดคอยล์ ตรวจสอบท่อน้ำทิ้ง'
                        WHEN 4 THEN 'พบปัญหา: แผ่นกรองอากาศสกปรกมาก ต้องเปลี่ยนใหม่'
                        WHEN 5 THEN 'ตรวจสอบแล้วพบว่าคอมเพรสเซอร์ทำงานผิดปกติ ต้องซ่อม'
                        WHEN 6 THEN 'ทำความสะอาดและตรวจสอบระบบทั้งหมด ใช้งานได้ปกติ'
                        ELSE 'เปลี่ยนชิ้นส่วนที่ชำรุด ตรวจสอบแล้วใช้งานได้'
                    END
                );
            END IF;
            
            -- สร้าง Job Item
            INSERT INTO "JobItem" (id, status, "workOrderId", "assetId", "technicianId", "techNote", "startTime", "endTime")
            VALUES (ji_id, ji_status::"JobItemStatus", wo_id, asset_id, tech_id, tech_note, start_time, end_time);
            
            created_ji_count := created_ji_count + 1;
            
            -- สร้าง Photos สำหรับ Job Items ที่ DONE
            IF ji_status = 'DONE' THEN
                -- งานที่เสร็จแล้วต้องมีรูป BEFORE และ AFTER
                photo_types := ARRAY['BEFORE', 'AFTER'];
                
                -- บางงานอาจมีรูป DEFECT หรือ METER ด้วย
                IF RANDOM() < 0.4 THEN
                    photo_types := photo_types || ARRAY['DEFECT'];
                END IF;
                IF RANDOM() < 0.3 THEN
                    photo_types := photo_types || ARRAY['METER'];
                END IF;
                
                -- สร้าง Photos
                FOREACH photo_type IN ARRAY photo_types LOOP
                    photo_id := 'cl' || substr(md5(random()::text || clock_timestamp()::text), 1, 22);
                    photo_url := CASE photo_type
                        -- หมายเหตุ: ใช้ placeholder URL (อาจไม่แสดงใน UI เนื่องจาก CSP)
                        -- สำหรับ production ควรใช้รูปจริงจาก Vercel Blob หรือ storage อื่น
                        WHEN 'BEFORE' THEN 'https://via.placeholder.com/800x600/4A90E2/FFFFFF?text=BEFORE'
                        WHEN 'AFTER' THEN 'https://via.placeholder.com/800x600/50C878/FFFFFF?text=AFTER'
                        WHEN 'DEFECT' THEN 'https://via.placeholder.com/800x600/FF6B6B/FFFFFF?text=DEFECT'
                        WHEN 'METER' THEN 'https://via.placeholder.com/800x600/FFA500/FFFFFF?text=METER'
                        ELSE 'https://via.placeholder.com/800x600/CCCCCC/FFFFFF?text=PHOTO'
                    END;
                    
                    INSERT INTO "JobPhoto" (id, url, type, "jobItemId", "createdAt")
                    VALUES (photo_id, photo_url, photo_type::"PhotoType", ji_id, COALESCE(start_time, CURRENT_TIMESTAMP));
                    
                    created_photo_count := created_photo_count + 1;
                END LOOP;
            ELSIF ji_status = 'IN_PROGRESS' THEN
                -- งานที่กำลังทำอาจมีรูป BEFORE
                IF RANDOM() < 0.6 THEN
                    photo_id := 'cl' || substr(md5(random()::text || clock_timestamp()::text), 1, 22);
                    -- หมายเหตุ: ใช้ placeholder URL (อาจไม่แสดงใน UI เนื่องจาก CSP)
                    photo_url := 'https://via.placeholder.com/800x600/4A90E2/FFFFFF?text=BEFORE';
                    
                    INSERT INTO "JobPhoto" (id, url, type, "jobItemId", "createdAt")
                    VALUES (photo_id, photo_url, 'BEFORE'::"PhotoType", ji_id, COALESCE(start_time, CURRENT_TIMESTAMP));
                    
                    created_photo_count := created_photo_count + 1;
                END IF;
            ELSIF ji_status = 'ISSUE_FOUND' THEN
                -- งานที่พบปัญหาอาจมีรูป DEFECT
                IF RANDOM() < 0.7 THEN
                    photo_id := 'cl' || substr(md5(random()::text || clock_timestamp()::text), 1, 22);
                    -- หมายเหตุ: ใช้ placeholder URL (อาจไม่แสดงใน UI เนื่องจาก CSP)
                    photo_url := 'https://via.placeholder.com/800x600/FF6B6B/FFFFFF?text=DEFECT';
                    
                    INSERT INTO "JobPhoto" (id, url, type, "jobItemId", "createdAt")
                    VALUES (photo_id, photo_url, 'DEFECT'::"PhotoType", ji_id, COALESCE(start_time, CURRENT_TIMESTAMP));
                    
                    created_photo_count := created_photo_count + 1;
                END IF;
            END IF;
        END LOOP;
    END LOOP;
    
    RAISE NOTICE '✅ สร้างข้อมูลสำเร็จ:';
    RAISE NOTICE '   - Work Orders: % ใบ', created_wo_count;
    RAISE NOTICE '   - Job Items: % รายการ', created_ji_count;
    RAISE NOTICE '   - Photos: % รูป', created_photo_count;
END $$;

-- 4. แสดงสถิติ
DO $$
DECLARE
    wo_rec RECORD;
    ji_rec RECORD;
    status_names TEXT;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '📈 สถิติ Work Orders:';
    FOR wo_rec IN 
        SELECT status, COUNT(*) as count 
        FROM "WorkOrder" 
        GROUP BY status 
        ORDER BY status
    LOOP
        status_names := CASE wo_rec.status
            WHEN 'OPEN' THEN 'เปิด'
            WHEN 'IN_PROGRESS' THEN 'กำลังดำเนินการ'
            WHEN 'COMPLETED' THEN 'เสร็จสิ้น'
            WHEN 'CANCELLED' THEN 'ยกเลิก'
            ELSE wo_rec.status
        END;
        RAISE NOTICE '   %: % ใบ', status_names, wo_rec.count;
    END LOOP;
    
    RAISE NOTICE '';
    RAISE NOTICE '📈 สถิติ Job Items:';
    FOR ji_rec IN 
        SELECT status, COUNT(*) as count 
        FROM "JobItem" 
        GROUP BY status 
        ORDER BY status
    LOOP
        status_names := CASE ji_rec.status
            WHEN 'PENDING' THEN 'รอดำเนินการ'
            WHEN 'IN_PROGRESS' THEN 'กำลังทำงาน'
            WHEN 'DONE' THEN 'เสร็จสิ้น'
            WHEN 'ISSUE_FOUND' THEN 'พบปัญหา'
            ELSE ji_rec.status
        END;
        RAISE NOTICE '   %: % รายการ', status_names, ji_rec.count;
    END LOOP;
END $$;

-- 5. ตรวจสอบ Job Items ที่ DONE ว่ามีรูปครบหรือไม่
DO $$
DECLARE
    done_count INTEGER;
    missing_photos_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO done_count
    FROM "JobItem"
    WHERE status = 'DONE';
    
    SELECT COUNT(*) INTO missing_photos_count
    FROM "JobItem" ji
    WHERE ji.status = 'DONE'
    AND (
        NOT EXISTS (SELECT 1 FROM "JobPhoto" jp WHERE jp."jobItemId" = ji.id AND jp.type = 'BEFORE')
        OR NOT EXISTS (SELECT 1 FROM "JobPhoto" jp WHERE jp."jobItemId" = ji.id AND jp.type = 'AFTER')
    );
    
    IF missing_photos_count > 0 THEN
        RAISE NOTICE '';
        RAISE WARNING '⚠️  พบ Job Items ที่ DONE แต่ไม่มีรูปครบ: % รายการ', missing_photos_count;
        RAISE NOTICE '   (ควรมีรูป BEFORE และ AFTER สำหรับงานที่เสร็จแล้ว)';
    ELSE
        RAISE NOTICE '';
        RAISE NOTICE '✅ ทุก Job Item ที่ DONE มีรูป BEFORE และ AFTER ครบถ้วน';
    END IF;
END $$;

-- Commit Transaction
COMMIT;

-- แสดงข้อความสำเร็จ
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '✅ เสร็จสิ้น!';
END $$;
