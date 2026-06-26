-- ซิงค์สถานะ WorkOrder ให้ตรงกับ JobItem (รันครั้งเดียวหลัง deploy fix)
-- ใบที่ทุกรายการ DONE แต่ใบงานยัง OPEN/IN_PROGRESS → COMPLETED
-- ใบที่มีรายการเริ่มทำแล้วแต่ยัง OPEN → IN_PROGRESS

BEGIN;

UPDATE "WorkOrder" wo
SET status = 'COMPLETED', "updatedAt" = NOW()
WHERE wo.status IN ('OPEN', 'IN_PROGRESS')
  AND EXISTS (
    SELECT 1 FROM "JobItem" ji WHERE ji."workOrderId" = wo.id
  )
  AND NOT EXISTS (
    SELECT 1 FROM "JobItem" ji
    WHERE ji."workOrderId" = wo.id AND ji.status <> 'DONE'
  );

UPDATE "WorkOrder" wo
SET status = 'IN_PROGRESS', "updatedAt" = NOW()
WHERE wo.status = 'OPEN'
  AND EXISTS (
    SELECT 1 FROM "JobItem" ji
    WHERE ji."workOrderId" = wo.id
      AND ji.status IN ('IN_PROGRESS', 'DONE', 'ISSUE_FOUND')
  )
  AND EXISTS (
    SELECT 1 FROM "JobItem" ji
    WHERE ji."workOrderId" = wo.id AND ji.status <> 'DONE'
  );

COMMIT;
