-- Consolidated Migration SQL for SQLite
-- ใช้สำหรับสร้าง database schema ทั้งหมดในครั้งเดียว (สำหรับ Vercel deployment)
-- รันผ่าน Prisma $executeRawUnsafe

-- Enable foreign keys
PRAGMA foreign_keys=ON;

-- CreateTable: Client (ต้องสร้างก่อนเพราะ Site reference)
CREATE TABLE IF NOT EXISTS "Client" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "contactInfo" TEXT,
    "logoUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable: Site
CREATE TABLE IF NOT EXISTS "Site" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "latitude" REAL,
    "longitude" REAL,
    "clientId" TEXT NOT NULL,
    CONSTRAINT "Site_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable: User (มี siteId reference)
CREATE TABLE IF NOT EXISTS "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "fullName" TEXT,
    "role" TEXT NOT NULL DEFAULT 'TECHNICIAN',
    "locked" INTEGER NOT NULL DEFAULT 0,
    "lockedUntil" DATETIME,
    "lockedReason" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "siteId" TEXT,
    CONSTRAINT "User_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex: User username unique
CREATE UNIQUE INDEX IF NOT EXISTS "User_username_key" ON "User"("username");

-- CreateIndex: User indexes
CREATE INDEX IF NOT EXISTS "User_role_idx" ON "User"("role");
CREATE INDEX IF NOT EXISTS "User_locked_lockedUntil_idx" ON "User"("locked", "lockedUntil");
CREATE INDEX IF NOT EXISTS "User_siteId_idx" ON "User"("siteId");

-- CreateTable: Building
CREATE TABLE IF NOT EXISTS "Building" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    CONSTRAINT "Building_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable: Floor
CREATE TABLE IF NOT EXISTS "Floor" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "buildingId" TEXT NOT NULL,
    CONSTRAINT "Floor_buildingId_fkey" FOREIGN KEY ("buildingId") REFERENCES "Building" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable: Room
CREATE TABLE IF NOT EXISTS "Room" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "floorId" TEXT NOT NULL,
    CONSTRAINT "Room_floorId_fkey" FOREIGN KEY ("floorId") REFERENCES "Floor" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable: Asset
CREATE TABLE IF NOT EXISTS "Asset" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "qrCode" TEXT NOT NULL,
    "brand" TEXT,
    "model" TEXT,
    "serialNo" TEXT,
    "btu" INTEGER,
    "installDate" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "roomId" TEXT NOT NULL,
    CONSTRAINT "Asset_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex: Asset qrCode unique
CREATE UNIQUE INDEX IF NOT EXISTS "Asset_qrCode_key" ON "Asset"("qrCode");

-- CreateIndex: Asset indexes
CREATE INDEX IF NOT EXISTS "Asset_status_idx" ON "Asset"("status");
CREATE INDEX IF NOT EXISTS "Asset_roomId_idx" ON "Asset"("roomId");

-- CreateTable: WorkOrder
CREATE TABLE IF NOT EXISTS "WorkOrder" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "jobType" TEXT NOT NULL,
    "scheduledDate" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "siteId" TEXT NOT NULL,
    "assignedTeam" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "WorkOrder_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex: WorkOrder indexes
CREATE INDEX IF NOT EXISTS "WorkOrder_status_idx" ON "WorkOrder"("status");
CREATE INDEX IF NOT EXISTS "WorkOrder_scheduledDate_idx" ON "WorkOrder"("scheduledDate");
CREATE INDEX IF NOT EXISTS "WorkOrder_siteId_idx" ON "WorkOrder"("siteId");

-- CreateTable: JobItem
CREATE TABLE IF NOT EXISTS "JobItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "workOrderId" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "technicianId" TEXT,
    "techNote" TEXT,
    "startTime" DATETIME,
    "endTime" DATETIME,
    CONSTRAINT "JobItem_workOrderId_fkey" FOREIGN KEY ("workOrderId") REFERENCES "WorkOrder" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "JobItem_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "JobItem_technicianId_fkey" FOREIGN KEY ("technicianId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex: JobItem indexes
CREATE INDEX IF NOT EXISTS "JobItem_technicianId_idx" ON "JobItem"("technicianId");
CREATE INDEX IF NOT EXISTS "JobItem_status_idx" ON "JobItem"("status");
CREATE INDEX IF NOT EXISTS "JobItem_workOrderId_idx" ON "JobItem"("workOrderId");
CREATE INDEX IF NOT EXISTS "JobItem_assetId_idx" ON "JobItem"("assetId");

-- CreateTable: JobPhoto
CREATE TABLE IF NOT EXISTS "JobPhoto" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "url" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "jobItemId" TEXT NOT NULL,
    CONSTRAINT "JobPhoto_jobItemId_fkey" FOREIGN KEY ("jobItemId") REFERENCES "JobItem" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable: ContactInfo
CREATE TABLE IF NOT EXISTS "ContactInfo" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL DEFAULT 'support@airservice.com',
    "phone" TEXT NOT NULL DEFAULT '02-XXX-XXXX',
    "hours" TEXT NOT NULL DEFAULT 'จันทร์-ศุกร์ 08:00-17:00 น.',
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable: ContactMessage
CREATE TABLE IF NOT EXISTS "ContactMessage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "isRead" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ContactMessage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex: ContactMessage indexes
CREATE INDEX IF NOT EXISTS "ContactMessage_isRead_idx" ON "ContactMessage"("isRead");
CREATE INDEX IF NOT EXISTS "ContactMessage_createdAt_idx" ON "ContactMessage"("createdAt");
CREATE INDEX IF NOT EXISTS "ContactMessage_userId_idx" ON "ContactMessage"("userId");

-- CreateTable: SecurityIncident
CREATE TABLE IF NOT EXISTS "SecurityIncident" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'MEDIUM',
    "description" TEXT NOT NULL,
    "metadata" TEXT,
    "userId" TEXT,
    "username" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "resolved" INTEGER NOT NULL DEFAULT 0,
    "resolvedAt" DATETIME,
    "resolvedBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex: SecurityIncident indexes
CREATE INDEX IF NOT EXISTS "SecurityIncident_type_idx" ON "SecurityIncident"("type");
CREATE INDEX IF NOT EXISTS "SecurityIncident_severity_idx" ON "SecurityIncident"("severity");
CREATE INDEX IF NOT EXISTS "SecurityIncident_resolved_idx" ON "SecurityIncident"("resolved");
CREATE INDEX IF NOT EXISTS "SecurityIncident_createdAt_idx" ON "SecurityIncident"("createdAt");
CREATE INDEX IF NOT EXISTS "SecurityIncident_userId_idx" ON "SecurityIncident"("userId");
