# 🗄️ Setup Database - สร้างตารางใน Database

## ปัญหาที่พบ

Database `jobflow_db` ยังไม่มีตาราง (Tables section ว่างเปล่า)

---

## ✅ วิธีแก้ไข

### 1. ตรวจสอบ DATABASE_URL ใน `.env`

เปิดไฟล์ `.env` และตรวจสอบว่า `DATABASE_URL` ตั้งค่าถูกต้อง:

```env
# ถ้าใช้ database `jobflow_db` (จาก Docker Compose)
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/jobflow"

# หรือถ้าใช้ database `airservice_flomac` (standalone PostgreSQL)
DATABASE_URL="postgresql://postgres:1234@localhost:5432/airservice_flomac"
```

**สำคัญ:** ต้องให้ `DATABASE_URL` ใน `.env` ตรงกับ database ที่คุณกำลังดูอยู่!

### 2. รัน Migration เพื่อสร้างตาราง

**วิธีที่ 1: ใช้ Prisma Migrate (แนะนำ)**
```bash
# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate dev
```

**วิธีที่ 2: ใช้ Prisma DB Push (เร็วกว่า แต่ไม่เก็บ migration history)**
```bash
# Generate Prisma Client
npx prisma generate

# Push schema ไปที่ database
npx prisma db push
```

### 3. ตรวจสอบว่าตารางถูกสร้างแล้ว

**วิธีที่ 1: ใช้ Prisma Studio**
```bash
npx prisma studio
```
เปิด browser ไปที่ `http://localhost:5555` จะเห็นตารางทั้งหมด

**วิธีที่ 2: ใช้ pgAdmin หรือ Database Tool**
- Refresh database tree
- ตรวจสอบว่า Tables section มีตารางแล้ว

**วิธีที่ 3: ใช้ Script**
```bash
node scripts/check-database.js
```

### 4. Seed Database (ใส่ข้อมูลเริ่มต้น)

```bash
# ใช้ Prisma Seed
npm run db:seed

# หรือใช้ API endpoint
# POST http://localhost:3000/api/seed
```

---

## 🔍 ตรวจสอบ Database Connection

```bash
# ตรวจสอบ connection และตาราง
node scripts/check-database.js
```

---

## 📝 Database ที่ควรมี

หลังจากรัน migration แล้ว ควรมีตารางเหล่านี้:

- `User` - ผู้ใช้ (ADMIN, TECHNICIAN, CLIENT)
- `Client` - ลูกค้า
- `Site` - สถานที่
- `Building` - อาคาร
- `Floor` - ชั้น
- `Room` - ห้อง
- `Asset` - เครื่องปรับอากาศ/อุปกรณ์
- `WorkOrder` - ใบสั่งงาน
- `JobItem` - รายการงาน
- `JobPhoto` - รูปภาพการทำงาน
- `Feedback` - คำติชม
- `Notification` - การแจ้งเตือน
- `ContactInfo` - ข้อมูลติดต่อ
- `ContactMessage` - ข้อความติดต่อ
- `SecurityIncident` - เหตุการณ์ด้านความปลอดภัย
- `_prisma_migrations` - Migration history

---

## ⚠️ หมายเหตุ

1. **Database name ต้องตรงกัน** - ถ้า `.env` ใช้ `airservice_flomac` แต่คุณดู `jobflow_db` จะไม่เห็นตาราง
2. **ต้องรัน migration ก่อน** - Database ใหม่จะไม่มีตารางจนกว่าจะรัน migration
3. **Prisma Client ต้อง generate** - ต้องรัน `npx prisma generate` ก่อนใช้ Prisma

---

## 🎯 Quick Start

```bash
# 1. ตรวจสอบ .env
cat .env | grep DATABASE_URL

# 2. Generate Prisma Client
npx prisma generate

# 3. Run migrations
npx prisma migrate dev

# 4. Seed database (optional)
npm run db:seed

# 5. ตรวจสอบ
node scripts/check-database.js
```
