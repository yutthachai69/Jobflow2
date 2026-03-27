-- เพิ่มคอลัมน์สำหรับใบ PM มือ (ล้างใหญ่/ล้างย่อย) — รันใน Supabase SQL Editor หรือ psql
-- ต้องมี enum "PMType" ในฐานข้อมูลอยู่แล้ว (จากแผน PM)
ALTER TABLE "JobItem" ADD COLUMN IF NOT EXISTS "adHocPmType" "PMType";
