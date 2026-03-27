-- Alter Feedback/Notification isRead: already BOOLEAN from 20260125000002 (PostgreSQL); only ensure indexes exist
CREATE INDEX IF NOT EXISTS "Feedback_workOrderId_idx" ON "Feedback"("workOrderId");
CREATE INDEX IF NOT EXISTS "Feedback_clientId_idx" ON "Feedback"("clientId");
CREATE INDEX IF NOT EXISTS "Feedback_isRead_idx" ON "Feedback"("isRead");
CREATE INDEX IF NOT EXISTS "Feedback_createdAt_idx" ON "Feedback"("createdAt");
CREATE INDEX IF NOT EXISTS "Notification_userId_idx" ON "Notification"("userId");
CREATE INDEX IF NOT EXISTS "Notification_isRead_idx" ON "Notification"("isRead");
CREATE INDEX IF NOT EXISTS "Notification_createdAt_idx" ON "Notification"("createdAt");
CREATE INDEX IF NOT EXISTS "Notification_type_idx" ON "Notification"("type");
