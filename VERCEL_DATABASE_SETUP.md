# Vercel Database Setup Guide

## ⚠️ ปัญหา: SQLite ไม่ทำงานบน Vercel

Vercel serverless functions ไม่สามารถ write ไฟล์ SQLite ได้เพราะ file system เป็น read-only

**Error:** `Error code 14: Unable to open the database file`

## ✅ วิธีแก้ไข: ใช้ PostgreSQL

### ขั้นตอนที่ 1: สร้าง PostgreSQL Database

เลือกบริการฟรีใดบริการหนึ่ง:

#### Option 1: Neon (แนะนำ - ฟรี, เร็ว, ง่าย)
1. ไปที่ https://neon.tech
2. สร้าง account (Sign up with GitHub)
3. สร้าง project ใหม่
4. Copy Connection String (จะได้ URL แบบ: `postgresql://user:password@host/database?sslmode=require`)

#### Option 2: Supabase
1. ไปที่ https://supabase.com
2. สร้าง project ใหม่
3. ไปที่ Settings > Database
4. Copy Connection String (Connection Pooling)

#### Option 3: Railway
1. ไปที่ https://railway.app
2. สร้าง project ใหม่ > Add PostgreSQL
3. Copy DATABASE_URL

#### Option 4: Render
1. ไปที่ https://render.com
2. สร้าง PostgreSQL database
3. Copy Internal Database URL

### ขั้นตอนที่ 2: เปลี่ยน Prisma Schema

```bash
# Copy schema.postgresql.prisma ไปแทนที่ schema.prisma
cp prisma/schema.postgresql.prisma prisma/schema.prisma
```

หรือแก้ไข `prisma/schema.prisma` โดยเปลี่ยน:
```prisma
datasource db {
  provider = "sqlite"  # เปลี่ยนจาก sqlite
  url      = env("DATABASE_URL")
}
```

เป็น:
```prisma
datasource db {
  provider = "postgresql"  # เปลี่ยนเป็น postgresql
  url      = env("DATABASE_URL")
}
```

### ขั้นตอนที่ 3: ตั้งค่า Environment Variables ใน Vercel

1. ไปที่ Vercel Dashboard
2. เลือก Project > Settings > Environment Variables
3. เพิ่ม Variable:
   - **Name:** `DATABASE_URL`
   - **Value:** Connection String ที่ได้จากขั้นตอนที่ 1
   - **Environment:** Production, Preview, Development (เลือกทั้งหมด)
4. Save

### ขั้นตอนที่ 4: Commit และ Push

```bash
git add prisma/schema.prisma
git commit -m "feat: switch to PostgreSQL for Vercel deployment"
git push
```

### ขั้นตอนที่ 5: Vercel จะ Deploy อัตโนมัติ

หลังจาก push แล้ว Vercel จะ deploy ใหม่ และ:
1. `postinstall` script จะ run `prisma generate` และ `prisma db push`
2. Database schema จะถูกสร้างอัตโนมัติ
3. `/api/setup` จะทำงานได้ (ถ้ายังต้อง seed ข้อมูล)

### ขั้นตอนที่ 6: Seed Database (ถ้าจำเป็น)

หลังจาก deploy เสร็จ:
1. ไปที่ login page
2. คลิก "Setup Database" หรือ
3. เรียก `/api/setup` โดยตรง

---

## 📝 Quick Reference

### Neon (แนะนำ)
- **URL:** https://neon.tech
- **Free Tier:** 0.5 GB storage, unlimited projects
- **Connection String:** `postgresql://user:password@host/database?sslmode=require`

### Supabase
- **URL:** https://supabase.com
- **Free Tier:** 500 MB database, 2 GB bandwidth
- **Connection String:** `postgresql://postgres:password@host:5432/postgres`

### Railway
- **URL:** https://railway.app
- **Free Tier:** $5 credit/month
- **Connection String:** `postgresql://user:password@host:5432/railway`

### Render
- **URL:** https://render.com
- **Free Tier:** 90 days free trial
- **Connection String:** `postgresql://user:password@host:5432/database`

---

## ⚡ Alternative: ใช้ SQLite ใน /tmp (ไม่แนะนำ)

ถ้าต้องการใช้ SQLite จริงๆ (ไม่แนะนำสำหรับ production):

1. ตั้งค่า `DATABASE_URL="file:/tmp/database.db"`
2. ข้อมูลจะหายเมื่อ function restart
3. ไม่เหมาะสำหรับ production

**แนะนำให้ใช้ PostgreSQL แทน!**

