# 🚀 Server Setup Steps - ขั้นตอน Setup บน Ubuntu Server

## ✅ Step 1: Database Container เริ่มทำงานแล้ว

```bash
docker-compose up -d db
```

---

## 📋 Step 2: ตรวจสอบว่า Container รันอยู่

```bash
# ตรวจสอบ container status
docker ps | grep jobflow-db

# ตรวจสอบ logs
docker logs jobflow-db
```

---

## 🔧 Step 3: ตั้งค่า DATABASE_URL

**ถ้ารันจาก host machine (นอก Docker):**
```bash
# ตั้งค่า DATABASE_URL ใน .env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/jobflow"
```

**ถ้ารันจากภายใน Docker container:**
```bash
# ใช้ Docker network name
DATABASE_URL="postgresql://postgres:postgres@db:5432/jobflow"
```

---

## 📝 Step 4: รัน Migration เพื่อสร้างตาราง

```bash
# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate deploy

# หรือใช้ db push (เร็วกว่า แต่ไม่เก็บ migration history)
npx prisma db push
```

---

## 🌱 Step 5: Seed Database (ใส่ข้อมูลเริ่มต้น)

```bash
# ใช้ Prisma Seed
npm run db:seed

# หรือใช้ API endpoint
curl -X POST http://localhost:3000/api/setup
```

---

## 🔍 Step 6: ตรวจสอบว่าตารางถูกสร้างแล้ว

```bash
# ใช้ Prisma Studio
npx prisma studio

# หรือเข้าไปใน database container
docker exec -it jobflow-db psql -U postgres -d jobflow

# ดูตารางทั้งหมด
\dt
```

---

## ⚠️ หมายเหตุ

1. **DATABASE_URL ต้องถูกต้อง** - ตรวจสอบว่าใช้ `localhost` (ถ้ารันจาก host) หรือ `db` (ถ้ารันจาก Docker)
2. **Port 5432 ต้องเปิดอยู่** - ตรวจสอบว่า port 5432 ถูก expose แล้ว
3. **Password ต้องตรงกัน** - ตรวจสอบว่า password ใน `.env` ตรงกับ `docker-compose.yml`

---

## 🎯 Quick Commands

```bash
# 1. ตรวจสอบ container
docker ps | grep jobflow-db

# 2. Generate Prisma Client
npx prisma generate

# 3. Run migrations
npx prisma migrate deploy

# 4. Seed database
npm run db:seed

# 5. ตรวจสอบ
npx prisma studio
```
