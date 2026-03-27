-- Add optional dueDate to PMSchedule (for auto-dispatch / overdue)
ALTER TABLE "PMSchedule" ADD COLUMN IF NOT EXISTS "dueDate" TIMESTAMP(3);
