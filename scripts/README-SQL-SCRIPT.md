# 📝 SQL Script สำหรับ pgAdmin

## ไฟล์ที่สร้างให้

1. **`scripts/setup-database-complete.sql`** - SQL script สำหรับรันใน pgAdmin
   - สร้าง schema ทั้งหมด (tables, enums, indexes)
   - Seed ข้อมูลเริ่มต้น (users, clients, sites, assets, etc.)

2. **`scripts/generate-bcrypt-hash.js`** - Script สำหรับ generate bcrypt hash
   - ใช้สำหรับ generate password hash ใหม่

---

## 🚀 วิธีใช้

### 1. Generate bcrypt hash (ถ้าต้องการ)

```bash
# Generate hash สำหรับ passwords ทั้งหมด
node scripts/generate-bcrypt-hash.js

# หรือ generate hash เดียว
node -e "require('bcryptjs').hash('password123', 10).then(console.log)"
```

### 2. เปิด pgAdmin และรัน SQL script

1. เปิด pgAdmin
2. Connect ไปที่ database (`jobflow` หรือ `jobflow_db`)
3. เปิด Query Tool (Tools → Query Tool)
4. เปิดไฟล์ `scripts/setup-database-complete.sql`
5. Copy ทั้งหมดไปวางใน Query Tool
6. **แก้ไข bcrypt hash** (ถ้ายังไม่ได้ generate)
7. Execute (F5 หรือ กด Execute button)

### 3. ตรวจสอบผลลัพธ์

หลังจากรัน script แล้ว จะเห็น:
- ✅ Setup Complete!
- user_count: 3
- client_count: 1
- site_count: 1
- asset_count: 5

---

## 🔐 Default Accounts

หลังจากรัน script แล้ว จะมี accounts:

- **ADMIN**: `admin` / `admin123`
- **TECHNICIAN**: `tech1` / `password123`
- **CLIENT**: `client1` / `client123`

---

## ⚠️ หมายเหตุสำคัญ

### 1. bcrypt Hash

Script ใช้ bcrypt hash ที่ generate ไว้แล้ว แต่**ควร generate hash ใหม่** สำหรับ production:

```bash
node scripts/generate-bcrypt-hash.js
```

แล้ว copy hash ไปแทนที่ใน SQL script

### 2. Database Name

ตรวจสอบว่า database name ใน SQL script ตรงกับ database ที่คุณใช้:
- `jobflow` (จาก docker-compose.yml)
- หรือ `jobflow_db` (ถ้าใช้ database อื่น)

### 3. DATABASE_URL

หลังจากรัน script แล้ว ตรวจสอบว่า `.env` ตั้งค่าถูกต้อง:

```env
# สำหรับ local database (Docker Compose)
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/jobflow"

# หรือสำหรับ deployed database
DATABASE_URL="postgresql://user:password@host:5432/database"
```

---

## 🔧 Troubleshooting

### Error: "relation already exists"

ถ้ามีตารางอยู่แล้ว script จะลบตารางเก่าก่อน (DROP TABLE IF EXISTS)

### Error: "password authentication failed"

ตรวจสอบว่า:
1. Database name ถูกต้อง
2. Username/password ถูกต้อง
3. Connection string ใน `.env` ถูกต้อง

### Error: "bcrypt hash ไม่ถูกต้อง"

Generate hash ใหม่:
```bash
node scripts/generate-bcrypt-hash.js
```

แล้ว copy hash ไปแทนที่ใน SQL script

---

## 📋 สิ่งที่ Script จะสร้าง

### Tables:
- User, Client, Site, Building, Floor, Room
- Asset, WorkOrder, JobItem, JobPhoto
- ContactInfo, ContactMessage
- SecurityIncident, Feedback, Notification

### Enums:
- UserRole, AssetStatus, AssetType
- JobType, OrderStatus, JobItemStatus
- PhotoType, IncidentType, IncidentSeverity, NotificationType

### Seed Data:
- 3 Users (admin, tech1, client1)
- 1 Client (Grand Hotel Group)
- 1 Site (สาขาสุขุมวิท)
- 1 Building (อาคาร A)
- 2 Floors (ชั้น 1, ชั้น 2)
- 2 Rooms (Lobby Hall, Server Room)
- 5 Assets (เครื่องปรับอากาศ)
- 1 ContactInfo

---

## ✅ หลังจากรัน Script

1. **ตรวจสอบข้อมูล:**
   ```sql
   SELECT * FROM "User";
   SELECT * FROM "Client";
   SELECT * FROM "Asset";
   ```

2. **Restart dev server:**
   ```bash
   npm run dev
   ```

3. **Login ด้วย default accounts:**
   - admin / admin123
   - tech1 / password123
   - client1 / client123

---

## 🎯 Quick Start

```bash
# 1. Generate bcrypt hash
node scripts/generate-bcrypt-hash.js

# 2. Copy hash ไปแทนที่ใน setup-database-complete.sql

# 3. เปิด pgAdmin → Query Tool → รัน script

# 4. ตรวจสอบ .env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/jobflow"

# 5. Restart dev server
npm run dev
```
