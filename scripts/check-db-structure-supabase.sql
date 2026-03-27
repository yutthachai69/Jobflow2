-- =============================================================================
-- เช็กโครงสร้าง DB สำหรับ Jobflow + Prisma (รันใน Supabase → SQL Editor)
-- แคปผลลัพธ์แต่ละบล็อกส่งมาได้ — อย่าแคปค่าที่เป็นความลับจากที่อื่น
-- =============================================================================

-- -----------------------------------------------------------------------------
-- บล็อก 1: มีตารางอะไรใน public บ้าง (ควรตรงกับ model ใน prisma/schema.prisma)
-- -----------------------------------------------------------------------------
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- -----------------------------------------------------------------------------
-- บล็อก 2: คอลัมน์ของตารางหลัก (ดูว่า JobItem มี adHocPmType หรือยัง)
-- -----------------------------------------------------------------------------
SELECT
  c.table_name,
  c.ordinal_position AS pos,
  c.column_name,
  c.data_type,
  c.udt_name,
  c.is_nullable
FROM information_schema.columns c
WHERE c.table_schema = 'public'
  AND c.table_name IN (
    'User',
    'Client',
    'Site',
    'Building',
    'Floor',
    'Room',
    'Asset',
    'WorkOrder',
    'JobItem',
    'JobPhoto',
    'PMSchedule',
    'PMContract',
    'ChecklistTemplate',
    'SecurityIncident',
    'Notification',
    'Feedback',
    'ContactInfo',
    'ContactMessage'
  )
ORDER BY c.table_name, c.ordinal_position;

-- -----------------------------------------------------------------------------
-- บล็อก 3: enum ที่เกี่ยวกับ PM / สถานะ (ชื่อควรตรงกับ Prisma enum)
-- -----------------------------------------------------------------------------
SELECT
  t.typname AS enum_name,
  e.enumsortorder AS sort_order,
  e.enumlabel AS value
FROM pg_type t
JOIN pg_enum e ON t.oid = e.enumtypid
JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
WHERE n.nspname = 'public'
  AND t.typname IN (
    'PMType',
    'JobItemStatus',
    'JobType',
    'AssetStatus',
    'AssetType',
    'WorkOrderStatus',
    'PMScheduleStatus'
  )
ORDER BY t.typname, e.enumsortorder;

-- -----------------------------------------------------------------------------
-- บล็อก 4: มีประวัติ Prisma migration หรือไม่ (ไม่มี = อาจ deploy schema แบบมือ/SQL)
-- -----------------------------------------------------------------------------
SELECT
  EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = '_prisma_migrations'
  ) AS has_prisma_migrations_table;

-- ถ้าบรรทัดบนคือ true ให้รันบล็อกนี้ต่อ (ถ้า false จะ error — ข้ามได้)
-- SELECT migration_name, finished_at, rolled_back_at
-- FROM "_prisma_migrations"
-- ORDER BY finished_at DESC NULLS LAST
-- LIMIT 20;

-- -----------------------------------------------------------------------------
-- บล็อก 5: เช็กเฉพาะว่า JobItem มีคอลัมน์ adHocPmType หรือไม่ (สรุปสั้น)
-- -----------------------------------------------------------------------------
SELECT
  EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'JobItem'
      AND column_name = 'adHocPmType'
  ) AS jobitem_has_adhoc_pm_type;
