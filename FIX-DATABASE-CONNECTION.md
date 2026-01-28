# 🔧 แก้ไขปัญหา Database Connection Error

## ปัญหาที่พบ

Error message: `Can't reach database server at 18.142.112.163:5432`

**สาเหตุ:** แอปพยายามเชื่อมต่อกับ deployed database แทนที่จะเป็น local database

---

## ✅ วิธีแก้ไข (ทำตามลำดับ)

### 1. ตรวจสอบ `.env` file

เปิดไฟล์ `.env` และตรวจสอบว่า `DATABASE_URL` ตั้งค่าถูกต้อง:

```env
# ต้องเป็น local database
DATABASE_URL="postgresql://postgres:1234@localhost:5432/airservice_flomac"
```

**อย่าใช้:**
```env
# ❌ อย่าใช้ deployed database
DATABASE_URL="postgresql://...@18.142.112.163:5432/..."
```

### 2. ตรวจสอบ System Environment Variables

**Windows PowerShell:**
```powershell
# ตรวจสอบว่า DATABASE_URL ถูกตั้งค่าใน system environment หรือไม่
$env:DATABASE_URL

# ถ้ามี ให้ลบออก
[Environment]::SetEnvironmentVariable("DATABASE_URL", $null, "User")
```

**หรือตรวจสอบผ่าน System Properties:**
1. เปิด `System Properties` → `Environment Variables`
2. ตรวจสอบว่า `DATABASE_URL` ถูกตั้งค่าใน `User variables` หรือ `System variables` หรือไม่
3. ถ้ามี ให้ลบออก

### 3. ตรวจสอบไฟล์ `.env` อื่นๆ

Next.js อ่าน environment variables ตามลำดับนี้ (ไฟล์ที่อ่านทีหลังจะ override ไฟล์ที่อ่านก่อน):
1. `.env`
2. `.env.local` ← **ตรวจสอบไฟล์นี้**
3. `.env.development` ← **ตรวจสอบไฟล์นี้**
4. `.env.development.local`

**ตรวจสอบ:**
```bash
# ดูว่ามีไฟล์ .env อื่นๆ หรือไม่
ls -la .env*
```

**ถ้ามี `.env.local` หรือ `.env.development`:**
- ตรวจสอบว่า `DATABASE_URL` ในไฟล์เหล่านั้นชี้ไปที่ local database หรือไม่
- หรือลบไฟล์เหล่านั้นออก (ถ้าไม่จำเป็น)

### 4. Restart Dev Server

**สำคัญมาก!** หลังจากแก้ `.env` ต้อง restart dev server:

```bash
# หยุด dev server (Ctrl+C)
# แล้วรันใหม่
npm run dev
```

### 5. ตรวจสอบว่า Local PostgreSQL รันอยู่

**ถ้าใช้ Docker Compose:**
```bash
# Start database
docker-compose up -d db

# ตรวจสอบว่า container รันอยู่
docker ps | grep jobflow-db
```

**ถ้าใช้ PostgreSQL แบบ standalone:**
- ตรวจสอบว่า PostgreSQL service รันอยู่
- ตรวจสอบว่า port 5432 เปิดอยู่

### 6. ตรวจสอบ Connection

```bash
# ตรวจสอบว่า DATABASE_URL ถูกต้อง
npm run db:check
```

---

## 🔍 Debug Steps

### ตรวจสอบว่า Next.js อ่าน DATABASE_URL จากไหน

สร้างไฟล์ `debug-env.js`:

```javascript
require('dotenv').config()
console.log('DATABASE_URL:', process.env.DATABASE_URL)
```

รัน:
```bash
node debug-env.js
```

### ตรวจสอบใน Browser Console

เปิด Browser Console และรัน:
```javascript
// ตรวจสอบว่า DATABASE_URL ถูกส่งไปที่ client หรือไม่
// (แต่ DATABASE_URL ไม่ควรถูกส่งไปที่ client เพราะเป็น server-side only)
```

---

## ⚠️ หมายเหตุสำคัญ

1. **`.env` file ไม่ควร commit ขึ้น Git** (ควรอยู่ใน `.gitignore`)
2. **DATABASE_URL เป็น server-side only** - ไม่ควรมี `NEXT_PUBLIC_` prefix
3. **Restart dev server หลังจากแก้ `.env`** - Next.js cache environment variables
4. **ตรวจสอบ system environment variables** - อาจ override `.env` file

---

## 🎯 Quick Fix

```bash
# 1. ตรวจสอบ .env
cat .env | grep DATABASE_URL

# 2. ตรวจสอบ system environment
echo $env:DATABASE_URL  # PowerShell
# หรือ
echo $DATABASE_URL     # Bash

# 3. Restart dev server
# Ctrl+C แล้วรันใหม่
npm run dev
```

---

## 📝 ถ้ายังไม่ได้ผล

1. **ลบ `.next` folder:**
   ```bash
   rm -rf .next
   npm run dev
   ```

2. **ตรวจสอบ Prisma Client:**
   ```bash
   npx prisma generate
   ```

3. **ตรวจสอบ database connection:**
   ```bash
   npm run db:check
   ```
