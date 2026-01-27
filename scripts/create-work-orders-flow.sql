-- ==========================================
-- SQL Script สำหรับสร้างงานตาม Flow ของระบบ
-- สำหรับรันใน pgAdmin (PostgreSQL)
-- ==========================================
-- 
-- สร้าง Work Orders ตาม Flow:
-- 1. งานใหม่ (OPEN) - มี Job Items (PENDING)
-- 2. งานกำลังทำ (IN_PROGRESS) - ช่างรับงานแล้ว
-- 3. งานเสร็จ (COMPLETED) - มีรูป BEFORE/AFTER, Feedback
-- 4. งานยกเลิก (CANCELLED)
--
-- Flow:
-- Work Order (OPEN) 
--   → Job Items (PENDING)
--   → ช่างรับงาน → Job Item (IN_PROGRESS) + startTime
--   → อัปโหลดรูป BEFORE
--   → ทำงานเสร็จ → อัปโหลดรูป AFTER
--   → Job Item (DONE) + endTime
--   → Work Order (COMPLETED)
--   → Client ให้ Feedback
--   → Notification ส่งให้ Admin
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
    tech_count INTEGER;
    site_count INTEGER;
    asset_count INTEGER;
    client_count INTEGER;
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

    -- ตรวจสอบว่ามี Client หรือไม่
    SELECT COUNT(*) INTO client_count FROM "User" WHERE role = 'CLIENT';
    IF client_count = 0 THEN
        RAISE EXCEPTION 'ไม่พบ Client ในระบบ! กรุณารัน seed ก่อน';
    END IF;

    RAISE NOTICE '✅ พบข้อมูลพื้นฐาน:';
    RAISE NOTICE '   - ช่าง: % คน', tech_count;
    RAISE NOTICE '   - Site: % แห่ง', site_count;
    RAISE NOTICE '   - Assets: % รายการ', asset_count;
    RAISE NOTICE '   - Client: % คน', client_count;
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

-- 3. ฟังก์ชันสร้าง ID แบบ cuid()
CREATE OR REPLACE FUNCTION generate_cuid()
RETURNS TEXT AS $$
DECLARE
    timestamp_part TEXT;
    random_part TEXT;
    counter_part TEXT;
BEGIN
    timestamp_part := LPAD(TO_CHAR(EXTRACT(EPOCH FROM NOW())::BIGINT, 'FM999999999999999'), 13, '0');
    random_part := SUBSTRING(MD5(RANDOM()::TEXT || CLOCK_TIMESTAMP()::TEXT), 1, 22);
    counter_part := LPAD(TO_CHAR((RANDOM() * 46656)::INTEGER, 'FM999'), 2, '0');
    RETURN 'c' || timestamp_part || random_part || counter_part;
END;
$$ LANGUAGE plpgsql;

-- 4. สร้าง Work Orders ตาม Flow
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
    
    -- ตัวแปรสำหรับ Feedback
    feedback_id TEXT;
    feedback_rating INTEGER;
    feedback_comment TEXT;
    client_id TEXT;
    
    -- ตัวแปรสำหรับ Notification
    notif_id TEXT;
    
    -- ตัวแปรอื่นๆ
    tech_ids TEXT[];
    site_ids TEXT[];
    asset_ids TEXT[];
    client_ids TEXT[];
    selected_assets TEXT[];
    num_assets INTEGER;
    days_offset INTEGER;
    hours_offset INTEGER;
    work_duration INTEGER;
    i INTEGER;
    j INTEGER;
    k INTEGER;
    created_wo_count INTEGER := 0;
    created_ji_count INTEGER := 0;
    created_photo_count INTEGER := 0;
    created_feedback_count INTEGER := 0;
    created_notif_count INTEGER := 0;
    
    -- Flow scenarios
    scenario INTEGER;
BEGIN
    -- ดึงข้อมูลพื้นฐาน
    SELECT ARRAY_AGG(id) INTO tech_ids FROM "User" WHERE role = 'TECHNICIAN';
    SELECT ARRAY_AGG(id) INTO site_ids FROM "Site";
    SELECT ARRAY_AGG(id) INTO asset_ids FROM "Asset" WHERE status = 'ACTIVE' LIMIT 50;
    SELECT ARRAY_AGG(id) INTO client_ids FROM "User" WHERE role = 'CLIENT';
    
    -- สร้าง 20 Work Orders ตาม Flow
    FOR i IN 1..20 LOOP
        scenario := (i - 1) % 4; -- 0=OPEN, 1=IN_PROGRESS, 2=COMPLETED, 3=CANCELLED
        
        -- สุ่ม Site
        site_id := site_ids[1 + floor(random() * array_length(site_ids, 1))::INTEGER];
        
        -- สุ่ม Job Type
        job_type := (ARRAY['PM', 'CM', 'INSTALL'])[1 + floor(random() * 3)::INTEGER];
        
        -- สร้างวันที่นัดหมาย
        days_offset := (RANDOM() * 60)::INTEGER - 30; -- 30 วันที่ผ่านมา ถึง 30 วันข้างหน้า
        scheduled_date := CURRENT_TIMESTAMP + (days_offset || ' days')::INTERVAL;
        scheduled_date := scheduled_date::DATE + TIME '09:00:00' + ((RANDOM() * 8)::INTEGER || ' hours')::INTERVAL;
        
        -- กำหนดสถานะตาม scenario
        IF scenario = 0 THEN
            wo_status := 'OPEN';
            assigned_team := NULL;
        ELSIF scenario = 1 THEN
            wo_status := 'IN_PROGRESS';
            assigned_team := 'ทีมช่าง A';
        ELSIF scenario = 2 THEN
            wo_status := 'COMPLETED';
            assigned_team := 'ทีมช่าง B';
        ELSE
            wo_status := 'CANCELLED';
            assigned_team := NULL;
        END IF;
        
        -- สร้าง Work Order
        wo_id := generate_cuid();
        wo_number := generate_work_order_number();
        
        -- ตรวจสอบ createdAt/updatedAt
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'WorkOrder' AND column_name = 'createdAt'
        ) THEN
            INSERT INTO "WorkOrder" (
                id, "workOrderNumber", "jobType", "scheduledDate", status, "siteId", "assignedTeam",
                "createdAt", "updatedAt"
            ) VALUES (
                wo_id, wo_number, job_type::"JobType", scheduled_date, wo_status::"OrderStatus",
                site_id, assigned_team, NOW(), NOW()
            );
        ELSE
            INSERT INTO "WorkOrder" (
                id, "workOrderNumber", "jobType", "scheduledDate", status, "siteId", "assignedTeam"
            ) VALUES (
                wo_id, wo_number, job_type::"JobType", scheduled_date, wo_status::"OrderStatus",
                site_id, assigned_team
            );
        END IF;
        
        created_wo_count := created_wo_count + 1;
        
        -- สุ่ม Assets สำหรับ Job Items (2-5 assets ต่อ Work Order)
        num_assets := 2 + floor(random() * 4)::INTEGER;
        selected_assets := ARRAY(
            SELECT asset_ids[1 + floor(random() * array_length(asset_ids, 1))::INTEGER]
            FROM generate_series(1, num_assets)
            LIMIT num_assets
        );
        
        -- สร้าง Job Items
        FOR j IN 1..array_length(selected_assets, 1) LOOP
            ji_id := generate_cuid();
            asset_id := selected_assets[j];
            
            -- กำหนดสถานะ Job Item ตาม Work Order status
            IF wo_status = 'OPEN' THEN
                ji_status := 'PENDING';
                tech_id := NULL;
                start_time := NULL;
                end_time := NULL;
                tech_note := NULL;
            ELSIF wo_status = 'IN_PROGRESS' THEN
                IF j <= 2 THEN
                    -- 2 งานแรกกำลังทำ
                    ji_status := 'IN_PROGRESS';
                    tech_id := tech_ids[1 + floor(random() * array_length(tech_ids, 1))::INTEGER];
                    start_time := scheduled_date + ((RANDOM() * 2)::INTEGER || ' hours')::INTERVAL;
                    end_time := NULL;
                    tech_note := 'กำลังดำเนินการ...';
                ELSE
                    -- งานอื่นๆ ยังรอ
                    ji_status := 'PENDING';
                    tech_id := NULL;
                    start_time := NULL;
                    end_time := NULL;
                    tech_note := NULL;
                END IF;
            ELSIF wo_status = 'COMPLETED' THEN
                -- งานเสร็จทั้งหมด
                ji_status := 'DONE';
                tech_id := tech_ids[1 + floor(random() * array_length(tech_ids, 1))::INTEGER];
                start_time := scheduled_date + ((RANDOM() * 2)::INTEGER || ' hours')::INTERVAL;
                work_duration := 1 + floor(random() * 4)::INTEGER; -- 1-4 ชั่วโมง
                end_time := start_time + (work_duration || ' hours')::INTERVAL;
                tech_note := CASE (RANDOM() * 3)::INTEGER
                    WHEN 0 THEN 'ตรวจสอบและทำความสะอาดเรียบร้อย'
                    WHEN 1 THEN 'เปลี่ยนฟิลเตอร์และเติมน้ำยาเรียบร้อย'
                    ELSE 'ซ่อมแซมและทดสอบการทำงานเรียบร้อย'
                END;
            ELSE
                -- CANCELLED
                ji_status := 'PENDING';
                tech_id := NULL;
                start_time := NULL;
                end_time := NULL;
                tech_note := NULL;
            END IF;
            
            -- Insert Job Item
            INSERT INTO "JobItem" (
                id, status, "workOrderId", "assetId", "technicianId",
                "techNote", "startTime", "endTime"
            ) VALUES (
                ji_id, ji_status::"JobItemStatus", wo_id, asset_id, tech_id,
                tech_note, start_time, end_time
            );
            
            created_ji_count := created_ji_count + 1;
            
            -- สร้าง Photos สำหรับงานที่เสร็จแล้ว (COMPLETED)
            IF wo_status = 'COMPLETED' THEN
                -- BEFORE photo
                photo_id := generate_cuid();
                photo_url := 'https://via.placeholder.com/800x600/FF6B6B/FFFFFF?text=BEFORE+' || j;
                photo_type := 'BEFORE';
                INSERT INTO "JobPhoto" (
                    id, url, type, "jobItemId", "createdAt"
                ) VALUES (
                    photo_id, photo_url, photo_type::"PhotoType", ji_id, NOW()
                );
                created_photo_count := created_photo_count + 1;
                
                -- AFTER photo
                photo_id := generate_cuid();
                photo_url := 'https://via.placeholder.com/800x600/51CF66/FFFFFF?text=AFTER+' || j;
                photo_type := 'AFTER';
                INSERT INTO "JobPhoto" (
                    id, url, type, "jobItemId", "createdAt"
                ) VALUES (
                    photo_id, photo_url, photo_type::"PhotoType", ji_id, NOW()
                );
                created_photo_count := created_photo_count + 1;
                
                -- บางงานมี DEFECT photo
                IF RANDOM() < 0.3 THEN
                    photo_id := generate_cuid();
                    photo_url := 'https://via.placeholder.com/800x600/FFD93D/000000?text=DEFECT+' || j;
                    photo_type := 'DEFECT';
                    INSERT INTO "JobPhoto" (
                        id, url, type, "jobItemId", "createdAt"
                    ) VALUES (
                        photo_id, photo_url, photo_type::"PhotoType", ji_id, NOW()
                    );
                    created_photo_count := created_photo_count + 1;
                END IF;
            END IF;
        END LOOP;
        
        -- สร้าง Feedback สำหรับงานที่เสร็จแล้ว
        IF wo_status = 'COMPLETED' AND array_length(client_ids, 1) > 0 THEN
            feedback_id := generate_cuid();
            client_id := client_ids[1 + floor(random() * array_length(client_ids, 1))::INTEGER];
            feedback_rating := 3 + floor(random() * 3)::INTEGER; -- 3-5 stars
            feedback_comment := CASE (RANDOM() * 3)::INTEGER
                WHEN 0 THEN 'งานเสร็จเรียบร้อย ช่างทำงานดีมาก'
                WHEN 1 THEN 'พอใจกับการบริการ เร็วและมีคุณภาพ'
                ELSE 'ช่างมีความเชี่ยวชาญ แนะนำให้ใช้บริการอีก'
            END;
            
            INSERT INTO "Feedback" (
                id, rating, comment, "workOrderId", "clientId", "isRead", "createdAt"
            ) VALUES (
                feedback_id, feedback_rating, feedback_comment, wo_id, client_id, false, NOW()
            );
            created_feedback_count := created_feedback_count + 1;
            
            -- สร้าง Notification สำหรับ Admin
            notif_id := generate_cuid();
            INSERT INTO "Notification" (
                id, type, title, message, "userId", "isRead", "relatedId", "createdAt"
            ) VALUES (
                notif_id,
                'FEEDBACK_RECEIVED'::"NotificationType",
                'ได้รับ Feedback ใหม่',
                'งาน ' || wo_number || ' ได้รับ Feedback: ' || feedback_rating || ' ดาว',
                (SELECT id FROM "User" WHERE role = 'ADMIN' LIMIT 1),
                false,
                feedback_id,
                NOW()
            );
            created_notif_count := created_notif_count + 1;
        END IF;
    END LOOP;
    
    RAISE NOTICE '';
    RAISE NOTICE '✅ สร้างข้อมูลสำเร็จ!';
    RAISE NOTICE '   - Work Orders: % ใบ', created_wo_count;
    RAISE NOTICE '   - Job Items: % รายการ', created_ji_count;
    RAISE NOTICE '   - Photos: % รูป', created_photo_count;
    RAISE NOTICE '   - Feedbacks: % รายการ', created_feedback_count;
    RAISE NOTICE '   - Notifications: % รายการ', created_notif_count;
END $$;

-- 5. แสดงสถิติ
DO $$
DECLARE
    wo_open_count INTEGER;
    wo_in_progress_count INTEGER;
    wo_completed_count INTEGER;
    wo_cancelled_count INTEGER;
    ji_pending_count INTEGER;
    ji_in_progress_count INTEGER;
    ji_done_count INTEGER;
    ji_issue_count INTEGER;
    photo_count INTEGER;
    feedback_count INTEGER;
    notif_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO wo_open_count FROM "WorkOrder" WHERE status = 'OPEN';
    SELECT COUNT(*) INTO wo_in_progress_count FROM "WorkOrder" WHERE status = 'IN_PROGRESS';
    SELECT COUNT(*) INTO wo_completed_count FROM "WorkOrder" WHERE status = 'COMPLETED';
    SELECT COUNT(*) INTO wo_cancelled_count FROM "WorkOrder" WHERE status = 'CANCELLED';
    
    SELECT COUNT(*) INTO ji_pending_count FROM "JobItem" WHERE status = 'PENDING';
    SELECT COUNT(*) INTO ji_in_progress_count FROM "JobItem" WHERE status = 'IN_PROGRESS';
    SELECT COUNT(*) INTO ji_done_count FROM "JobItem" WHERE status = 'DONE';
    SELECT COUNT(*) INTO ji_issue_count FROM "JobItem" WHERE status = 'ISSUE_FOUND';
    
    SELECT COUNT(*) INTO photo_count FROM "JobPhoto";
    SELECT COUNT(*) INTO feedback_count FROM "Feedback";
    SELECT COUNT(*) INTO notif_count FROM "Notification";
    
    RAISE NOTICE '';
    RAISE NOTICE '📊 สรุป Work Orders:';
    RAISE NOTICE '   - OPEN: % ใบ', wo_open_count;
    RAISE NOTICE '   - IN_PROGRESS: % ใบ', wo_in_progress_count;
    RAISE NOTICE '   - COMPLETED: % ใบ', wo_completed_count;
    RAISE NOTICE '   - CANCELLED: % ใบ', wo_cancelled_count;
    RAISE NOTICE '';
    RAISE NOTICE '📋 สรุป Job Items:';
    RAISE NOTICE '   - PENDING: % รายการ', ji_pending_count;
    RAISE NOTICE '   - IN_PROGRESS: % รายการ', ji_in_progress_count;
    RAISE NOTICE '   - DONE: % รายการ', ji_done_count;
    RAISE NOTICE '   - ISSUE_FOUND: % รายการ', ji_issue_count;
    RAISE NOTICE '';
    RAISE NOTICE '📸 Photos: % รูป', photo_count;
    RAISE NOTICE '⭐ Feedbacks: % รายการ', feedback_count;
    RAISE NOTICE '🔔 Notifications: % รายการ', notif_count;
END $$;

-- Commit Transaction
COMMIT;

-- แสดงข้อความสำเร็จ
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🎉 เสร็จสิ้น! ตรวจสอบข้อมูลได้ที่ Prisma Studio หรือ pgAdmin';
    RAISE NOTICE '';
    RAISE NOTICE '💡 Flow ที่สร้าง:';
    RAISE NOTICE '   1. งาน OPEN → Job Items PENDING';
    RAISE NOTICE '   2. งาน IN_PROGRESS → Job Items IN_PROGRESS (มีช่าง, startTime)';
    RAISE NOTICE '   3. งาน COMPLETED → Job Items DONE (มีรูป BEFORE/AFTER, endTime)';
    RAISE NOTICE '   4. งาน COMPLETED → มี Feedback และ Notification';
    RAISE NOTICE '   5. งาน CANCELLED → Job Items ยัง PENDING';
END $$;
