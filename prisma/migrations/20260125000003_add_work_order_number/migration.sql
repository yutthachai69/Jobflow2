-- Add workOrderNumber field to WorkOrder table
ALTER TABLE "WorkOrder" ADD COLUMN "workOrderNumber" TEXT;

-- Create unique index for workOrderNumber
CREATE UNIQUE INDEX IF NOT EXISTS "WorkOrder_workOrderNumber_key" ON "WorkOrder"("workOrderNumber");

-- Create index for workOrderNumber
CREATE INDEX IF NOT EXISTS "WorkOrder_workOrderNumber_idx" ON "WorkOrder"("workOrderNumber");
