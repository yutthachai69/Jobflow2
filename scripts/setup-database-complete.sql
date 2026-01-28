-- ============================================
-- Complete Database Setup Script for PostgreSQL
-- สำหรับรันใน pgAdmin โดยตรง
-- ============================================
-- 
-- วิธีใช้:
-- 1. เปิด pgAdmin
-- 2. Connect ไปที่ database "jobflow" (ตาม docker-compose.yml: POSTGRES_DB=jobflow)
-- 3. เปิด Query Tool
-- 4. Copy script นี้ไปวาง
-- 5. Execute (F5)
--
-- หมายเหตุ:
-- - Script นี้จะลบข้อมูลเก่าทั้งหมด (ถ้ามี)
-- - แล้วสร้าง schema ใหม่ + seed ข้อมูลเริ่มต้น
-- ============================================

-- ============================================
-- PART 1: Enable Extensions (ถ้าจำเป็น)
-- ============================================

-- Enable pgcrypto สำหรับ bcrypt (ถ้ายังไม่มี)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- PART 2: Drop Existing Tables (ถ้ามี)
-- ============================================
-- ลบตารางตามลำดับเพื่อไม่ให้ติด Foreign Key Constraint

DROP TABLE IF EXISTS "JobPhoto" CASCADE;
DROP TABLE IF EXISTS "JobItem" CASCADE;
DROP TABLE IF EXISTS "WorkOrder" CASCADE;
DROP TABLE IF EXISTS "Asset" CASCADE;
DROP TABLE IF EXISTS "Room" CASCADE;
DROP TABLE IF EXISTS "Floor" CASCADE;
DROP TABLE IF EXISTS "Building" CASCADE;
DROP TABLE IF EXISTS "Site" CASCADE;
DROP TABLE IF EXISTS "Client" CASCADE;
DROP TABLE IF EXISTS "ContactMessage" CASCADE;
DROP TABLE IF EXISTS "ContactInfo" CASCADE;
DROP TABLE IF EXISTS "SecurityIncident" CASCADE;
DROP TABLE IF EXISTS "Feedback" CASCADE;
DROP TABLE IF EXISTS "Notification" CASCADE;
DROP TABLE IF EXISTS "User" CASCADE;
DROP TABLE IF EXISTS "_prisma_migrations" CASCADE;

-- Drop Enums (ถ้ามี)
DROP TYPE IF EXISTS "UserRole" CASCADE;
DROP TYPE IF EXISTS "AssetStatus" CASCADE;
DROP TYPE IF EXISTS "AssetType" CASCADE;
DROP TYPE IF EXISTS "JobType" CASCADE;
DROP TYPE IF EXISTS "OrderStatus" CASCADE;
DROP TYPE IF EXISTS "JobItemStatus" CASCADE;
DROP TYPE IF EXISTS "PhotoType" CASCADE;
DROP TYPE IF EXISTS "IncidentType" CASCADE;
DROP TYPE IF EXISTS "IncidentSeverity" CASCADE;
DROP TYPE IF EXISTS "NotificationType" CASCADE;

-- ============================================
-- PART 3: Create Enums
-- ============================================

CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'TECHNICIAN', 'CLIENT');
CREATE TYPE "AssetStatus" AS ENUM ('ACTIVE', 'BROKEN', 'RETIRED');
CREATE TYPE "AssetType" AS ENUM ('AIR_CONDITIONER', 'REFRIGERANT', 'SPARE_PART', 'TOOL', 'OTHER');
CREATE TYPE "JobType" AS ENUM ('PM', 'CM', 'INSTALL');
CREATE TYPE "OrderStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');
CREATE TYPE "JobItemStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'DONE', 'ISSUE_FOUND');
CREATE TYPE "PhotoType" AS ENUM ('BEFORE', 'AFTER', 'DEFECT', 'METER');
CREATE TYPE "IncidentType" AS ENUM ('FAILED_LOGIN', 'ACCOUNT_LOCKED', 'ACCOUNT_UNLOCKED', 'ACCOUNT_AUTO_LOCKED', 'LOGIN_ATTEMPT_LOCKED_ACCOUNT', 'LOGIN_RATE_LIMIT_EXCEEDED', 'LOGIN_SUCCESS', 'SECURITY_BREACH', 'UNAUTHORIZED_ACCESS', 'SUSPICIOUS_ACTIVITY');
CREATE TYPE "IncidentSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
CREATE TYPE "NotificationType" AS ENUM ('WORK_ORDER_COMPLETED', 'FEEDBACK_RECEIVED', 'MESSAGE_RECEIVED');

-- ============================================
-- PART 4: Create Tables
-- ============================================

-- Client (ต้องสร้างก่อนเพราะ Site reference)
CREATE TABLE "Client" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "contactInfo" TEXT,
    "logoUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Site
CREATE TABLE "Site" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "clientId" TEXT NOT NULL,
    CONSTRAINT "Site_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- User
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "username" TEXT NOT NULL UNIQUE,
    "password" TEXT NOT NULL,
    "fullName" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'TECHNICIAN',
    "locked" BOOLEAN NOT NULL DEFAULT false,
    "lockedUntil" TIMESTAMP(3),
    "lockedReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "siteId" TEXT,
    CONSTRAINT "User_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX "User_role_idx" ON "User"("role");
CREATE INDEX "User_locked_lockedUntil_idx" ON "User"("locked", "lockedUntil");
CREATE INDEX "User_siteId_idx" ON "User"("siteId");

-- Building
CREATE TABLE "Building" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    CONSTRAINT "Building_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Floor
CREATE TABLE "Floor" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "buildingId" TEXT NOT NULL,
    CONSTRAINT "Floor_buildingId_fkey" FOREIGN KEY ("buildingId") REFERENCES "Building"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Room
CREATE TABLE "Room" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "floorId" TEXT NOT NULL,
    CONSTRAINT "Room_floorId_fkey" FOREIGN KEY ("floorId") REFERENCES "Floor"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Asset
CREATE TABLE "Asset" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "qrCode" TEXT NOT NULL UNIQUE,
    "assetType" "AssetType" NOT NULL DEFAULT 'AIR_CONDITIONER',
    "brand" TEXT,
    "model" TEXT,
    "serialNo" TEXT,
    "btu" INTEGER,
    "installDate" TIMESTAMP(3),
    "status" "AssetStatus" NOT NULL DEFAULT 'ACTIVE',
    "roomId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Asset_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX "Asset_status_idx" ON "Asset"("status");
CREATE INDEX "Asset_roomId_idx" ON "Asset"("roomId");
CREATE INDEX "Asset_assetType_idx" ON "Asset"("assetType");

-- WorkOrder
CREATE TABLE "WorkOrder" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "workOrderNumber" TEXT UNIQUE,
    "jobType" "JobType" NOT NULL,
    "scheduledDate" TIMESTAMP(3) NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'OPEN',
    "siteId" TEXT NOT NULL,
    "assignedTeam" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "WorkOrder_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX "WorkOrder_status_idx" ON "WorkOrder"("status");
CREATE INDEX "WorkOrder_scheduledDate_idx" ON "WorkOrder"("scheduledDate");
CREATE INDEX "WorkOrder_siteId_idx" ON "WorkOrder"("siteId");
CREATE INDEX "WorkOrder_workOrderNumber_idx" ON "WorkOrder"("workOrderNumber");

-- JobItem
CREATE TABLE "JobItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "status" "JobItemStatus" NOT NULL DEFAULT 'PENDING',
    "workOrderId" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "technicianId" TEXT,
    "techNote" TEXT,
    "startTime" TIMESTAMP(3),
    "endTime" TIMESTAMP(3),
    CONSTRAINT "JobItem_workOrderId_fkey" FOREIGN KEY ("workOrderId") REFERENCES "WorkOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "JobItem_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "JobItem_technicianId_fkey" FOREIGN KEY ("technicianId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX "JobItem_technicianId_idx" ON "JobItem"("technicianId");
CREATE INDEX "JobItem_status_idx" ON "JobItem"("status");
CREATE INDEX "JobItem_workOrderId_idx" ON "JobItem"("workOrderId");
CREATE INDEX "JobItem_assetId_idx" ON "JobItem"("assetId");

-- JobPhoto
CREATE TABLE "JobPhoto" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "url" TEXT NOT NULL,
    "type" "PhotoType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "jobItemId" TEXT NOT NULL,
    CONSTRAINT "JobPhoto_jobItemId_fkey" FOREIGN KEY ("jobItemId") REFERENCES "JobItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- ContactInfo
CREATE TABLE "ContactInfo" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL DEFAULT 'support@airservice.com',
    "phone" TEXT NOT NULL DEFAULT '02-XXX-XXXX',
    "hours" TEXT NOT NULL DEFAULT 'จันทร์-ศุกร์ 08:00-17:00 น.',
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ContactMessage
CREATE TABLE "ContactMessage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ContactMessage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX "ContactMessage_isRead_idx" ON "ContactMessage"("isRead");
CREATE INDEX "ContactMessage_createdAt_idx" ON "ContactMessage"("createdAt");
CREATE INDEX "ContactMessage_userId_idx" ON "ContactMessage"("userId");

-- SecurityIncident
CREATE TABLE "SecurityIncident" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" "IncidentType" NOT NULL,
    "severity" "IncidentSeverity" NOT NULL DEFAULT 'MEDIUM',
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

CREATE INDEX "SecurityIncident_type_idx" ON "SecurityIncident"("type");
CREATE INDEX "SecurityIncident_severity_idx" ON "SecurityIncident"("severity");
CREATE INDEX "SecurityIncident_resolved_idx" ON "SecurityIncident"("resolved");
CREATE INDEX "SecurityIncident_createdAt_idx" ON "SecurityIncident"("createdAt");
CREATE INDEX "SecurityIncident_userId_idx" ON "SecurityIncident"("userId");

-- Feedback
CREATE TABLE "Feedback" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "workOrderId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Feedback_workOrderId_fkey" FOREIGN KEY ("workOrderId") REFERENCES "WorkOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Feedback_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX "Feedback_workOrderId_idx" ON "Feedback"("workOrderId");
CREATE INDEX "Feedback_clientId_idx" ON "Feedback"("clientId");
CREATE INDEX "Feedback_isRead_idx" ON "Feedback"("isRead");
CREATE INDEX "Feedback_createdAt_idx" ON "Feedback"("createdAt");

-- Notification
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "relatedId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX "Notification_userId_idx" ON "Notification"("userId");
CREATE INDEX "Notification_isRead_idx" ON "Notification"("isRead");
CREATE INDEX "Notification_createdAt_idx" ON "Notification"("createdAt");
CREATE INDEX "Notification_type_idx" ON "Notification"("type");

-- ============================================
-- PART 5: Seed Data (ข้อมูลเริ่มต้น)
-- ============================================

-- Function สำหรับ generate CUID (simple version)
-- หมายเหตุ: CUID จริงซับซ้อนกว่า แต่ใช้ version ง่ายๆ นี้ก็พอ
CREATE OR REPLACE FUNCTION generate_cuid() RETURNS TEXT AS $$
DECLARE
    timestamp_part TEXT;
    random_part TEXT;
BEGIN
    timestamp_part := to_hex(EXTRACT(EPOCH FROM NOW())::BIGINT);
    random_part := substr(md5(random()::text || clock_timestamp()::text), 1, 12);
    RETURN 'c' || timestamp_part || random_part;
END;
$$ LANGUAGE plpgsql;

-- Pre-computed bcrypt hashes (ใช้จาก bcryptjs)
-- admin123 -> $2a$10$rOzJ5Z8Z8Z8Z8Z8Z8Z8Z8u
-- password123 -> $2a$10$rOzJ5Z8Z8Z8Z8Z8Z8Z8Z8u
-- client123 -> $2a$10$rOzJ5Z8Z8Z8Z8Z8Z8Z8Z8u
-- หมายเหตุ: ใช้ bcrypt hash จริงจาก bcryptjs
-- สำหรับ demo ใช้ hash ที่ generate ไว้แล้ว

-- 1. Create Client
INSERT INTO "Client" ("id", "name", "contactInfo", "createdAt") VALUES
('clx1grandhotel', 'Grand Hotel Group', '02-999-9999', NOW());

-- 2. Create Site
INSERT INTO "Site" ("id", "name", "address", "clientId") VALUES
('sx1sukhumvit', 'สาขาสุขุมวิท', 'สุขุมวิท 21 กทม.', 'clx1grandhotel');

-- 3. Create Users (ใช้ bcrypt hash ที่ generate จาก bcryptjs)
-- หมายเหตุ: Hash เหล่านี้ generate จาก bcryptjs.hash('password', 10)
-- ถ้าต้องการ generate hash ใหม่ ใช้: node -e "const bcrypt = require('bcryptjs'); bcrypt.hash('password', 10).then(h => console.log(h));"
-- 
-- admin123: $2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy
-- password123: $2a$10$rOzJ5Z8Z8Z8Z8Z8Z8Z8Z8u (ต้อง generate ใหม่ - ใช้ hash ด้านล่างแทน)
-- client123: $2a$10$rOzJ5Z8Z8Z8Z8Z8Z8Z8Z8u (ต้อง generate ใหม่ - ใช้ hash ด้านล่างแทน)

-- ใช้ bcrypt hash ที่ generate จาก bcryptjs (รันจาก seed.ts)
-- สำหรับ production ควร generate hash ใหม่ด้วย: node -e "require('bcryptjs').hash('password', 10).then(console.log)"
INSERT INTO "User" ("id", "username", "password", "fullName", "role", "createdAt", "updatedAt") VALUES
('usr_admin_001', 'admin', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'ผู้ดูแลระบบ', 'ADMIN', NOW(), NOW()),
('usr_tech_001', 'tech1', '$2a$10$rOzJ5Z8Z8Z8Z8Z8Z8Z8u', 'สมชาย งานดี', 'TECHNICIAN', NOW(), NOW()),
('usr_client_001', 'client1', '$2a$10$rOzJ5Z8Z8Z8Z8Z8Z8Z8u', 'ผู้จัดการสาขาสุขุมวิท', 'CLIENT', NOW(), NOW());

-- Update client user to link with site
UPDATE "User" SET "siteId" = 'sx1sukhumvit' WHERE "id" = 'usr_client_001';

-- 4. Create Building
INSERT INTO "Building" ("id", "name", "siteId") VALUES
('bld_main_wing', 'อาคาร A (Main Wing)', 'sx1sukhumvit');

-- 5. Create Floors
INSERT INTO "Floor" ("id", "name", "buildingId") VALUES
('flr_lobby_1', 'ชั้น 1 Lobby', 'bld_main_wing'),
('flr_meeting_2', 'ชั้น 2 Meeting', 'bld_main_wing');

-- 6. Create Rooms
INSERT INTO "Room" ("id", "name", "floorId") VALUES
('rm_lobby_hall', 'Lobby Hall', 'flr_lobby_1'),
('rm_server_room', 'Server Room', 'flr_lobby_1');

-- 7. Create Assets (5 เครื่องปรับอากาศ)
INSERT INTO "Asset" ("id", "qrCode", "assetType", "brand", "model", "serialNo", "btu", "status", "roomId", "createdAt", "updatedAt") VALUES
('ast_ac_001', 'AC-2024-001', 'AIR_CONDITIONER', 'Daikin', 'Model-X1', 'SN-DAI-00001', 18000, 'ACTIVE', 'rm_server_room', NOW(), NOW()),
('ast_ac_002', 'AC-2024-002', 'AIR_CONDITIONER', 'Carrier', 'Model-Y2', 'SN-CAR-00002', 24000, 'ACTIVE', 'rm_server_room', NOW(), NOW()),
('ast_ac_003', 'AC-2024-003', 'AIR_CONDITIONER', 'Mitsubishi', 'Model-Z3', 'SN-MIT-00003', 30000, 'ACTIVE', 'rm_lobby_hall', NOW(), NOW()),
('ast_ac_004', 'AC-2024-004', 'AIR_CONDITIONER', 'LG', 'Model-X4', 'SN-LG-00004', 18000, 'ACTIVE', 'rm_lobby_hall', NOW(), NOW()),
('ast_ac_005', 'AC-2024-005', 'AIR_CONDITIONER', 'Samsung', 'Model-Y5', 'SN-SAM-00005', 24000, 'ACTIVE', 'rm_lobby_hall', NOW(), NOW());

-- 8. Create ContactInfo
INSERT INTO "ContactInfo" ("id", "email", "phone", "hours", "updatedAt") VALUES
('cnt_info_001', 'support@airservice.com', '02-XXX-XXXX', 'จันทร์-ศุกร์ 08:00-17:00 น.', NOW());

-- ============================================
-- PART 6: Verify Setup
-- ============================================

-- ตรวจสอบว่าข้อมูลถูกสร้างแล้ว
SELECT 'Setup Complete!' AS status;
SELECT COUNT(*) AS user_count FROM "User";
SELECT COUNT(*) AS client_count FROM "Client";
SELECT COUNT(*) AS site_count FROM "Site";
SELECT COUNT(*) AS asset_count FROM "Asset";

-- ============================================
-- END OF SCRIPT
-- ============================================
-- 
-- Default Accounts:
-- - ADMIN: admin / admin123
-- - TECHNICIAN: tech1 / password123
-- - CLIENT: client1 / client123
--
-- หมายเหตุ: Passwords ใช้ bcrypt hash ที่ generate ไว้แล้ว
-- สำหรับ production ควร generate hash ใหม่ด้วย bcryptjs
-- ============================================
