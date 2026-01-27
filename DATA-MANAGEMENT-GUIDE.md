# 📊 คู่มือการจัดการและดูข้อมูล

## 🎯 ภาพรวม

โปรเจกต์นี้มี 2 databases:
1. **Local Database** - ใช้สำหรับ development (localhost)
2. **Production Database** - ใช้สำหรับ deployed app (Vercel)

---

## 📍 วิธีดูข้อมูล

### 1. ดูข้อมูลใน Local Database

#### วิธีที่ 1: ใช้ pgAdmin (แนะนำ)

1. **เปิด pgAdmin**
2. **Connect ไปที่ database:**
   - Server: `localhost` (หรือชื่อ server ที่ตั้งไว้)
   - Database: `airservice_flomac`
   - Username: `postgres`
   - Password: `1234` (ตามที่ตั้งไว้ใน `.env`)

3. **ดูข้อมูล:**
   - ขยาย database → Schemas → public → Tables
   - คลิกขวาที่ table → **View/Edit Data** → **All Rows**
   - หรือใช้ **Query Tool** (Tools → Query Tool) เพื่อรัน SQL

**ตัวอย่าง SQL:**
```sql
-- ดู Users ทั้งหมด
SELECT id, username, "fullName", role, "siteId" FROM "User";

-- ดู Users พร้อม Site
SELECT 
  u.username,
  u."fullName",
  u.role,
  s.name as site_name
FROM "User" u
LEFT JOIN "Site" s ON u."siteId" = s.id;

-- ดู Work Orders
SELECT 
  wo."workOrderNumber",
  wo."jobType",
  wo.status,
  s.name as site_name,
  COUNT(ji.id) as job_items_count
FROM "WorkOrder" wo
JOIN "Site" s ON wo."siteId" = s.id
LEFT JOIN "JobItem" ji ON ji."workOrderId" = wo.id
GROUP BY wo.id, wo."workOrderNumber", wo."jobType", wo.status, s.name;
```

#### วิธีที่ 2: ใช้ Prisma Studio (ง่ายกว่า)

```bash
# ตรวจสอบว่า DATABASE_URL ใน .env ชี้ไปที่ local
# DATABASE_URL="postgresql://postgres:1234@localhost:5432/airservice_flomac"

# เปิด Prisma Studio
npx prisma studio
```

Prisma Studio จะเปิดที่ `http://localhost:5555`:
- ✅ UI สวยงาม ใช้งานง่าย
- ✅ แก้ไขข้อมูลได้ (Edit, Delete, Add)
- ✅ ดู relationships ระหว่าง tables
- ✅ Filter และ search ได้

---

### 2. ดูข้อมูลใน Production/Deployed Database

#### ⭐ วิธีที่ 1: ใช้สคริปต์ (แนะนำ - ง่ายที่สุด)

**ขั้นตอนที่ 1: สร้างไฟล์ `.env.deployed`**

สร้างไฟล์ `.env.deployed` ในโฟลเดอร์ root ของโปรเจกต์:

```env
# .env.deployed
DATABASE_URL="postgresql://user:password@host:5432/database"
```

**วิธีหา DATABASE_URL ของ deployed database:**
- **Vercel**: ไปที่ Project → Settings → Environment Variables → ดู `DATABASE_URL`
- **Docker/Server**: ดูจาก environment variables ของ container/server
- **Cloud Provider**: ดูจาก database dashboard (เช่น AWS RDS, DigitalOcean, etc.)

**ขั้นตอนที่ 2: ใช้สคริปต์ดูข้อมูล**

```bash
# วิธีที่ 1: ดูข้อมูลแบบสรุป (แนะนำ)
node scripts/connect-to-deployed-db.js

# วิธีที่ 2: ดูข้อมูลแบบละเอียด
node scripts/view-deployed-data.js

# วิธีที่ 3: เปิด Prisma Studio เชื่อมต่อกับ deployed database
node scripts/open-deployed-studio.js
# จากนั้นเปิด http://localhost:5555 ในเบราว์เซอร์
```

**หรือใช้ DATABASE_URL โดยตรง:**

```bash
# Windows PowerShell:
$env:DATABASE_URL="postgresql://user:password@host:5432/database"
node scripts/view-deployed-data.js

# Linux/Mac:
DATABASE_URL="postgresql://user:password@host:5432/database" node scripts/view-deployed-data.js
```

#### วิธีที่ 2: ใช้ Prisma Studio โดยตรง

```bash
# ตั้งค่า DATABASE_URL เป็น production
# Windows PowerShell:
$env:DATABASE_URL="postgresql://user:password@production-host:5432/database"
npx prisma studio

# Linux/Mac:
export DATABASE_URL="postgresql://user:password@production-host:5432/database"
npx prisma studio
```

⚠️ **ระวัง:** ตรวจสอบให้แน่ใจว่าใช้ DATABASE_URL ที่ถูกต้อง!

#### วิธีที่ 3: ใช้ pgAdmin (ถ้าเข้าถึง production database ได้)

1. **เพิ่ม Server ใน pgAdmin:**
   - Host: production database host
   - Port: 5432 (หรือตามที่ตั้งไว้)
   - Database: production database name
   - Username/Password: credentials ที่ถูกต้อง

2. **Connect และดูข้อมูล** เหมือน local

---

## ✏️ วิธีจัดการข้อมูล

### 1. แก้ไขข้อมูล

#### ใช้ pgAdmin Query Tool:

```sql
-- แก้ไข User
UPDATE "User"
SET "fullName" = 'ชื่อใหม่'
WHERE username = 'client1';

-- แก้ไข Site
UPDATE "Site"
SET name = 'ชื่อสถานที่ใหม่'
WHERE id = 'site-id-here';

-- แก้ไข Work Order Status
UPDATE "WorkOrder"
SET status = 'COMPLETED'
WHERE id = 'work-order-id-here';
```

#### ใช้ Prisma Studio:
- คลิกที่ row ที่ต้องการแก้ไข
- แก้ไขค่าในฟิลด์
- กด Save

---

### 2. เพิ่มข้อมูล

#### ใช้ SQL:

```sql
-- เพิ่ม User ใหม่
INSERT INTO "User" (id, username, password, "fullName", role, "createdAt", "updatedAt")
VALUES (
  gen_random_uuid()::text,
  'newuser',
  '$2b$10$hashed_password_here', -- ต้อง hash password ก่อน
  'ชื่อผู้ใช้ใหม่',
  'TECHNICIAN',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);

-- เพิ่ม Site ใหม่
INSERT INTO "Site" (id, name, "clientId", "createdAt")
VALUES (
  gen_random_uuid()::text,
  'สาขาใหม่',
  'client-id-here',
  CURRENT_TIMESTAMP
);
```

#### ใช้ Prisma Studio:
- คลิกปุ่ม **Add record**
- กรอกข้อมูล
- กด Save

#### ใช้ Application UI:
- ใช้หน้าเว็บ (เช่น `/users/new`, `/assets/new`)
- ข้อมูลจะถูก validate และบันทึกอัตโนมัติ

---

### 3. ลบข้อมูล

#### ใช้ SQL:

```sql
-- ลบ User (ระวัง! จะลบ relationships ด้วย)
DELETE FROM "User" WHERE username = 'username-to-delete';

-- ลบ Work Order (จะลบ JobItems และ JobPhotos ด้วย)
DELETE FROM "WorkOrder" WHERE id = 'work-order-id-here';
```

⚠️ **ระวัง:** 
- Foreign key constraints อาจป้องกันการลบ
- ลบข้อมูลที่เกี่ยวข้องก่อน (JobItems → WorkOrder)

#### ใช้ Prisma Studio:
- คลิกที่ row
- กด Delete
- ยืนยันการลบ

---

## 🔄 วิธี Sync ข้อมูลระหว่าง Local และ Production

### Scenario 1: ต้องการให้ Local เหมือน Production

#### วิธีที่ 1: Export/Import (แนะนำ)

**Export จาก Production:**
```bash
# ตั้งค่า DATABASE_URL เป็น production
export DATABASE_URL="postgresql://user:password@production-host:5432/database"

# Export
pg_dump -h production-host -U user -d database -F c -f production_backup.dump
```

**Import ไป Local:**
```bash
# ตั้งค่า DATABASE_URL เป็น local
export DATABASE_URL="postgresql://postgres:1234@localhost:5432/airservice_flomac"

# Drop และสร้างใหม่ (ระวัง! จะลบข้อมูลเก่า)
dropdb airservice_flomac
createdb airservice_flomac

# Import
pg_restore -h localhost -U postgres -d airservice_flomac production_backup.dump
```

#### วิธีที่ 2: ใช้ pgAdmin

1. **Export จาก Production:**
   - คลิกขวาที่ database → **Backup...**
   - Format: **Custom**
   - Options: ✅ Pre-data, ✅ Data, ✅ Post-data
   - Save as: `production_backup.dump`

2. **Import ไป Local:**
   - คลิกขวาที่ database → **Restore...**
   - เลือกไฟล์ `production_backup.dump`
   - Options: ✅ Pre-data, ✅ Data, ✅ Post-data
   - กด **Restore**

---

### Scenario 2: ต้องการให้ Production เหมือน Local

⚠️ **ระวัง:** วิธีนี้จะทับข้อมูลใน Production!

**Export จาก Local:**
```bash
pg_dump -h localhost -U postgres -d airservice_flomac -F c -f local_backup.dump
```

**Import ไป Production:**
```bash
# ตั้งค่า DATABASE_URL เป็น production
export DATABASE_URL="postgresql://user:password@production-host:5432/database"

# Backup production ก่อน! (สำคัญมาก)
pg_dump -h production-host -U user -d database -F c -f production_backup_before_import.dump

# Import
pg_restore -h production-host -U user -d database local_backup.dump
```

---

## 🛠️ Tools ที่แนะนำ

### 1. Prisma Studio (แนะนำที่สุด)
```bash
npx prisma studio
```
- ✅ UI สวยงาม
- ✅ ใช้งานง่าย
- ✅ แก้ไขข้อมูลได้
- ✅ ดู relationships

### 2. pgAdmin
- ✅ Powerful SQL editor
- ✅ Export/Import
- ✅ Database management
- ⚠️ UI ซับซ้อนกว่า

### 3. Application UI
- ✅ ใช้งานผ่านเว็บ
- ✅ Validation อัตโนมัติ
- ✅ Security checks
- ⚠️ จำกัดเฉพาะ features ที่มี

---

## 📝 ตัวอย่างการใช้งาน

### ดู Users ทั้งหมดพร้อม Site

```sql
SELECT 
  u.username,
  u."fullName",
  u.role,
  s.name as site_name,
  c.name as client_name
FROM "User" u
LEFT JOIN "Site" s ON u."siteId" = s.id
LEFT JOIN "Client" c ON s."clientId" = c.id
ORDER BY u.role, u.username;
```

### ดู Work Orders พร้อม Job Items

```sql
SELECT 
  wo."workOrderNumber",
  wo."jobType",
  wo.status,
  s.name as site_name,
  COUNT(ji.id) as total_job_items,
  COUNT(CASE WHEN ji.status = 'DONE' THEN 1 END) as done_items
FROM "WorkOrder" wo
JOIN "Site" s ON wo."siteId" = s.id
LEFT JOIN "JobItem" ji ON ji."workOrderId" = wo.id
GROUP BY wo.id, wo."workOrderNumber", wo."jobType", wo.status, s.name
ORDER BY wo."createdAt" DESC;
```

### ดู Assets พร้อม Location

```sql
SELECT 
  a."qrCode",
  a.brand,
  a.model,
  a."assetType",
  a.status,
  r.name as room_name,
  f.name as floor_name,
  b.name as building_name,
  s.name as site_name
FROM "Asset" a
JOIN "Room" r ON a."roomId" = r.id
JOIN "Floor" f ON r."floorId" = f.id
JOIN "Building" b ON f."buildingId" = b.id
JOIN "Site" s ON b."siteId" = s.id
ORDER BY s.name, b.name, f.name, r.name;
```

---

## ⚠️ ข้อควรระวัง

1. **Backup ก่อนแก้ไข:**
   ```bash
   pg_dump -h localhost -U postgres -d airservice_flomac -F c -f backup_$(date +%Y%m%d_%H%M%S).dump
   ```

2. **ตรวจสอบ DATABASE_URL:**
   - ตรวจสอบว่าใช้ database ตัวไหน (local หรือ production)
   - อย่าแก้ไข production โดยไม่ตั้งใจ!

3. **Foreign Key Constraints:**
   - ลบข้อมูลที่เกี่ยวข้องก่อน (child records ก่อน parent records)
   - ใช้ CASCADE ถ้าต้องการลบพร้อมกัน

4. **Password Hashing:**
   - อย่าใส่ plain text password
   - ใช้ bcrypt hash เสมอ

---

## 🎯 สรุป

**ดูข้อมูล:**
- **Local**: `npx prisma studio` หรือ pgAdmin
- **Deployed**: 
  - ⭐ ใช้สคริปต์: `node scripts/view-deployed-data.js` (แนะนำ)
  - ใช้ Prisma Studio: `node scripts/open-deployed-studio.js`
  - ใช้ pgAdmin: เชื่อมต่อโดยตรง

**จัดการข้อมูล:**
- แก้ไข: Prisma Studio (ง่าย) หรือ SQL (ยืดหยุ่น)
- เพิ่ม: Application UI (แนะนำ) หรือ SQL
- ลบ: ระวัง foreign keys!

**Sync ข้อมูล:**
- Export/Import ใช้ pgAdmin หรือ pg_dump/pg_restore
- Backup ก่อน sync เสมอ!

## 🚀 Quick Start: ดูข้อมูลจาก Deployed Database

1. **สร้างไฟล์ `.env.deployed`**:
   ```env
   DATABASE_URL="postgresql://user:password@host:5432/database"
   ```

2. **รันสคริปต์**:
   ```bash
   # ดูข้อมูลแบบสรุป
   node scripts/connect-to-deployed-db.js
   
   # ดูข้อมูลแบบละเอียด
   node scripts/view-deployed-data.js
   
   # เปิด Prisma Studio (UI)
   node scripts/open-deployed-studio.js
   ```

3. **เปิดเบราว์เซอร์** (ถ้าใช้ Prisma Studio):
   - ไปที่ `http://localhost:5555`
   - ดูและแก้ไขข้อมูลได้เลย!

---

## 📦 สร้างข้อมูลตัวอย่างด้วย SQL (สำหรับ pgAdmin)

### สร้าง Assets 50 รายการ

1. **เปิด pgAdmin**
2. **เลือก database** ที่ต้องการ (เช่น `airservice_flomac`)
3. **เปิด Query Tool** (Tools > Query Tool)
4. **Copy SQL จากไฟล์** `scripts/create-50-assets.sql`
5. **Execute** (กด F5)

**สคริปต์จะสร้าง:**
- เครื่องปรับอากาศ: 20 รายการ (40%) - มี QR Code
- น้ำยาแอร์: 10 รายการ (20%)
- อะไหล่: 10 รายการ (20%)
- เครื่องมือ: 8 รายการ (16%)
- อื่นๆ: 2 รายการ (4%)

**หมายเหตุ:**
- สคริปต์จะตรวจสอบว่ามี Room ในระบบหรือไม่
- QR Code จะมีเฉพาะเครื่องปรับอากาศเท่านั้น
- อุปกรณ์อื่นๆ จะใช้ serialNo เป็น qrCode (แต่จะไม่แสดงใน UI)
- ถ้า QR Code ซ้ำจะข้ามรายการนั้น

**ตัวอย่าง SQL อื่นๆ:**
- `scripts/create-sample-work-orders.sql` - สร้าง Work Orders และ Job Items ตัวอย่าง
