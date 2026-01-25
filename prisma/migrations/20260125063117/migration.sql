/*
  Warnings:

  - You are about to alter the column `locked` on the `User` table. The data in that column could be lost. The data in that column will be cast from `Int` to `Boolean`.

*/
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
    "resolvedAt" DATETIME,
    "resolvedBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "fullName" TEXT,
    "role" TEXT NOT NULL DEFAULT 'TECHNICIAN',
    "locked" BOOLEAN NOT NULL DEFAULT false,
    "lockedUntil" DATETIME,
    "lockedReason" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "siteId" TEXT,
    CONSTRAINT "User_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_User" ("createdAt", "fullName", "id", "locked", "lockedReason", "lockedUntil", "password", "role", "siteId", "updatedAt", "username") SELECT "createdAt", "fullName", "id", "locked", "lockedReason", "lockedUntil", "password", "role", "siteId", "updatedAt", "username" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
CREATE INDEX "User_role_idx" ON "User"("role");
CREATE INDEX "User_locked_lockedUntil_idx" ON "User"("locked", "lockedUntil");
CREATE INDEX "User_siteId_idx" ON "User"("siteId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "SecurityIncident_type_idx" ON "SecurityIncident"("type");

-- CreateIndex
CREATE INDEX "SecurityIncident_severity_idx" ON "SecurityIncident"("severity");

-- CreateIndex
CREATE INDEX "SecurityIncident_resolved_idx" ON "SecurityIncident"("resolved");

-- CreateIndex
CREATE INDEX "SecurityIncident_createdAt_idx" ON "SecurityIncident"("createdAt");

-- CreateIndex
CREATE INDEX "SecurityIncident_userId_idx" ON "SecurityIncident"("userId");

-- CreateIndex
CREATE INDEX "Asset_status_idx" ON "Asset"("status");

-- CreateIndex
CREATE INDEX "Asset_roomId_idx" ON "Asset"("roomId");

-- CreateIndex
CREATE INDEX "ContactMessage_isRead_idx" ON "ContactMessage"("isRead");

-- CreateIndex
CREATE INDEX "ContactMessage_createdAt_idx" ON "ContactMessage"("createdAt");

-- CreateIndex
CREATE INDEX "ContactMessage_userId_idx" ON "ContactMessage"("userId");

-- CreateIndex
CREATE INDEX "JobItem_technicianId_idx" ON "JobItem"("technicianId");

-- CreateIndex
CREATE INDEX "JobItem_status_idx" ON "JobItem"("status");

-- CreateIndex
CREATE INDEX "JobItem_workOrderId_idx" ON "JobItem"("workOrderId");

-- CreateIndex
CREATE INDEX "JobItem_assetId_idx" ON "JobItem"("assetId");

-- CreateIndex
CREATE INDEX "WorkOrder_status_idx" ON "WorkOrder"("status");

-- CreateIndex
CREATE INDEX "WorkOrder_scheduledDate_idx" ON "WorkOrder"("scheduledDate");

-- CreateIndex
CREATE INDEX "WorkOrder_siteId_idx" ON "WorkOrder"("siteId");
