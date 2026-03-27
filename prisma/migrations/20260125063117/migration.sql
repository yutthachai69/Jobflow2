-- CreateTable
CREATE TABLE "SecurityIncident" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'MEDIUM',
    "description" TEXT NOT NULL,
    "metadata" TEXT,
    "userId" TEXT,
    "username" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "resolvedAt" TIMESTAMP(3),
    "resolvedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- User.locked already BOOLEAN from 20260125000000 (PostgreSQL); skip SQLite-style redefine

CREATE INDEX "SecurityIncident_type_idx" ON "SecurityIncident"("type");
CREATE INDEX "SecurityIncident_severity_idx" ON "SecurityIncident"("severity");
CREATE INDEX "SecurityIncident_resolved_idx" ON "SecurityIncident"("resolved");
CREATE INDEX "SecurityIncident_createdAt_idx" ON "SecurityIncident"("createdAt");
CREATE INDEX "SecurityIncident_userId_idx" ON "SecurityIncident"("userId");
CREATE INDEX "Asset_status_idx" ON "Asset"("status");
CREATE INDEX "Asset_roomId_idx" ON "Asset"("roomId");
CREATE INDEX "ContactMessage_isRead_idx" ON "ContactMessage"("isRead");
CREATE INDEX "ContactMessage_createdAt_idx" ON "ContactMessage"("createdAt");
CREATE INDEX "ContactMessage_userId_idx" ON "ContactMessage"("userId");
CREATE INDEX "JobItem_technicianId_idx" ON "JobItem"("technicianId");
CREATE INDEX "JobItem_status_idx" ON "JobItem"("status");
CREATE INDEX "JobItem_workOrderId_idx" ON "JobItem"("workOrderId");
CREATE INDEX "JobItem_assetId_idx" ON "JobItem"("assetId");
CREATE INDEX "WorkOrder_status_idx" ON "WorkOrder"("status");
CREATE INDEX "WorkOrder_scheduledDate_idx" ON "WorkOrder"("scheduledDate");
CREATE INDEX "WorkOrder_siteId_idx" ON "WorkOrder"("siteId");
CREATE INDEX IF NOT EXISTS "User_role_idx" ON "User"("role");
CREATE INDEX IF NOT EXISTS "User_siteId_idx" ON "User"("siteId");
