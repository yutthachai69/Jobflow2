# 🛠️ Local Development Setup Guide

## ปัญหาที่พบ

เมื่อรัน `npm run dev` แล้วเจอ error:
```
Can't reach database server at `18.142.112.163:5432`
```

**สาเหตุ:** แอปพยายามเชื่อมต่อกับ deployed database แทนที่จะเป็น local database

---

## ✅ วิธีแก้ไข

### 1. ตรวจสอบ `.env` file

เปิดไฟล์ `.env` และตรวจสอบว่า `DATABASE_URL` ตั้งค่าถูกต้อง:

```env
# สำหรับ Local Development (PostgreSQL)
DATABASE_URL="postgresql://postgres:1234@localhost:5432/airservice_flomac"

# หรือถ้าใช้ Docker Compose
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/jobflow"
```

### 2. ตรวจสอบว่า Local PostgreSQL รันอยู่

**ถ้าใช้ Docker Compose:**
```bash
# Start database
docker-compose up -d db

# ตรวจสอบว่า container รันอยู่
docker ps | grep jobflow-db
```

**ถ้าใช้ PostgreSQL แบบ standalone:**
```bash
# Windows (PowerShell)
Get-Service -Name postgresql*

# หรือตรวจสอบว่า port 5432 เปิดอยู่
netstat -an | findstr :5432
```

### 3. สร้าง Database (ถ้ายังไม่มี)

```bash
# เข้าไปใน PostgreSQL
psql -U postgres

# สร้าง database
CREATE DATABASE airservice_flomac;

# หรือถ้าใช้ Docker
docker exec -it jobflow-db psql -U postgres -c "CREATE DATABASE airservice_flomac;"
```

### 4. รัน Migration

```bash
# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate dev

# หรือถ้าใช้ db push
npx prisma db push
```

### 5. Seed Database (ถ้าต้องการข้อมูลตัวอย่าง)

```bash
npm run db:seed
```

### 6. ตรวจสอบ Connection

```bash
npm run db:check
```

---

## 🔍 Troubleshooting

### ปัญหา: "Can't reach database server"

**แก้ไข:**
1. ตรวจสอบว่า PostgreSQL server รันอยู่
2. ตรวจสอบว่า port 5432 เปิดอยู่
3. ตรวจสอบว่า `DATABASE_URL` ใน `.env` ถูกต้อง
4. ตรวจสอบว่า username/password ถูกต้อง

### ปัญหา: "database does not exist"

**แก้ไข:**
```bash
# สร้าง database
psql -U postgres -c "CREATE DATABASE airservice_flomac;"
```

### ปัญหา: "password authentication failed"

**แก้ไข:**
1. ตรวจสอบ password ใน `.env`
2. ตรวจสอบว่า PostgreSQL user มีอยู่และ password ถูกต้อง

---

## 📝 Quick Start สำหรับ Local Development

```bash
# 1. ตรวจสอบ .env
# DATABASE_URL="postgresql://postgres:1234@localhost:5432/airservice_flomac"

# 2. Start database (ถ้าใช้ Docker)
docker-compose up -d db

# 3. Generate Prisma Client
npx prisma generate

# 4. Run migrations
npx prisma migrate dev

# 5. Seed database (optional)
npm run db:seed

# 6. Start dev server
npm run dev
```

---

## 🎯 Default Accounts (หลัง seed)

- **ADMIN**: `admin` / `admin123`
- **TECHNICIAN**: `tech1` / `password123`
- **CLIENT**: `client1` / `client123`

---

## ⚠️ หมายเหตุ

- **อย่าใช้ deployed database (`18.142.112.163:5432`) สำหรับ local development**
- ใช้ local database (`localhost:5432`) แทน
- ตรวจสอบ `.env` file ให้แน่ใจว่า `DATABASE_URL` ชี้ไปที่ local database
