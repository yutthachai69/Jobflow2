-- ==========================================
-- SQL Script สำหรับเพิ่ม createdAt และ updatedAt ในตาราง Asset
-- สำหรับรันใน pgAdmin (PostgreSQL)
-- ==========================================
-- 
-- Usage: 
--   1. เปิด pgAdmin
--   2. เลือก database (airservice_flomac)
--   3. เปิด Query Tool (Tools > Query Tool)
--   4. Copy SQL ทั้งหมดนี้ไปวาง
--   5. กด Execute (F5)
-- ==========================================

-- ตรวจสอบว่ามี column อยู่แล้วหรือไม่
DO $$
BEGIN
    -- เพิ่ม createdAt ถ้ายังไม่มี
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Asset' AND column_name = 'createdAt'
    ) THEN
        ALTER TABLE "Asset" ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
        RAISE NOTICE '✅ เพิ่ม column createdAt สำเร็จ';
    ELSE
        RAISE NOTICE '⚠️  column createdAt มีอยู่แล้ว';
    END IF;

    -- เพิ่ม updatedAt ถ้ายังไม่มี
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Asset' AND column_name = 'updatedAt'
    ) THEN
        ALTER TABLE "Asset" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
        RAISE NOTICE '✅ เพิ่ม column updatedAt สำเร็จ';
    ELSE
        RAISE NOTICE '⚠️  column updatedAt มีอยู่แล้ว';
    END IF;
END $$;

-- แสดงผลลัพธ์
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🎉 เสร็จสิ้น! ตาราง Asset มี createdAt และ updatedAt แล้ว';
    RAISE NOTICE '';
    RAISE NOTICE '💡 ตรวจสอบได้ด้วย:';
    RAISE NOTICE '   SELECT column_name, data_type, column_default';
    RAISE NOTICE '   FROM information_schema.columns';
    RAISE NOTICE '   WHERE table_name = ''Asset'' AND column_name IN (''createdAt'', ''updatedAt'');';
END $$;
