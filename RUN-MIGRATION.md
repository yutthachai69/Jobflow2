# 📝 Run Migration - สร้างตารางใน Database

## ✅ Database Container พร้อมแล้ว

จาก logs:
- ✅ PostgreSQL รันอยู่
- ✅ Database system ready to accept connections
- ⚠️ Warning เกี่ยวกับ collation version (ไม่ใช่ปัญหาใหญ่)

---

## 🔧 ขั้นตอนต่อไป

### 1. ตรวจสอบ DATABASE_URL ใน `.env`

**ถ้ารันจาก host machine (นอก Docker):**
```bash
# แก้ไข .env file
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/jobflow"
```

**หมายเหตุ:** จาก `docker-compose.yml`:
- Database name: `jobflow`
- Username: `postgres`
- Password: `postgres`
- Port: `5432`

### 2. Generate Prisma Client

```bash
npx prisma generate
```

### 3. Run Migration เพื่อสร้างตาราง

**วิธีที่ 1: ใช้ Prisma Migrate (แนะนำ - เก็บ migration history)**
```bash
npx prisma migrate deploy
```

**วิธีที่ 2: ใช้ Prisma DB Push (เร็วกว่า แต่ไม่เก็บ migration history)**
```bash
npx prisma db push
```

### 4. ตรวจสอบว่าตารางถูกสร้างแล้ว

```bash
# เข้าไปใน database container
docker exec -it jobflow-db psql -U postgres -d jobflow

# ดูตารางทั้งหมด
\dt

# ออกจาก psql
\q
```

### 5. Seed Database (ใส่ข้อมูลเริ่มต้น)

```bash
# ใช้ Prisma Seed
npm run db:seed

# หรือใช้ API endpoint (ถ้า web server รันอยู่)
curl -X POST http://localhost:3000/api/setup
```

---

## 🎯 Quick Commands

```bash
# 1. Generate Prisma Client
npx prisma generate

# 2. Run migrations
npx prisma migrate deploy

# 3. ตรวจสอบตาราง
docker exec -it jobflow-db psql -U postgres -d jobflow -c "\dt"

# 4. Seed database
npm run db:seed
```

---

## ⚠️ หมายเหตุ

1. **Database name:** ใช้ `jobflow` (ไม่ใช่ `jobflow_db`)
2. **Password:** ใช้ `postgres` (ตาม docker-compose.yml)
3. **Port:** ใช้ `5432` (exposed แล้ว)

---

## 🔍 Troubleshooting

### ถ้า migration fail:

```bash
# ตรวจสอบ connection
docker exec -it jobflow-db psql -U postgres -d jobflow -c "SELECT 1;"

# ตรวจสอบ DATABASE_URL
echo $DATABASE_URL

# ตรวจสอบ Prisma schema
npx prisma validate
```

### ถ้า database ไม่มีตาราง:

```bash
# ใช้ db push แทน
npx prisma db push --accept-data-loss
```
