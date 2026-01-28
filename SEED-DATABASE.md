# 🌱 Seed Database - ใส่ข้อมูลเริ่มต้น

## ✅ Database Schema พร้อมแล้ว

จาก `npx prisma db push`:
- ✅ Database sync อยู่แล้ว
- ✅ Schema พร้อมใช้งาน

---

## 🌱 Seed Database

### วิธีที่ 1: ใช้ Prisma Seed (แนะนำ)

```bash
npm run db:seed
```

### วิธีที่ 2: ใช้ API Endpoint

```bash
# ถ้า web server รันอยู่
curl -X POST http://localhost:3000/api/setup
```

### วิธีที่ 3: ใช้ Script โดยตรง

```bash
node scripts/seed-production.js
```

---

## 📋 ข้อมูลที่จะถูก Seed

หลังจาก seed แล้ว จะมี:

### Users (ผู้ใช้)
- **ADMIN**: `admin` / `admin123`
- **TECHNICIAN**: `tech1` / `password123`
- **CLIENT**: `client1` / `client123`

### Location Hierarchy
- Client: Grand Hotel Group
- Site: สาขาสุขุมวิท
- Building: อาคาร A (Main Wing)
- Floors: ชั้น 1 Lobby, ชั้น 2 Meeting
- Rooms: Lobby Hall, Server Room

### Assets
- 5 เครื่องปรับอากาศ (ACs)

### Contact Info
- Email: support@airservice.com
- Phone: 02-XXX-XXXX

---

## 🔍 ตรวจสอบว่าข้อมูลถูก Seed แล้ว

```bash
# ใช้ Prisma Studio
npx prisma studio

# หรือเข้าไปใน database
docker exec -it jobflow-db psql -U postgres -d jobflow

# ดู users
SELECT username, role FROM "User";

# ดู clients
SELECT name FROM "Client";

# ออกจาก psql
\q
```

---

## ⚠️ หมายเหตุ

1. **Seed จะลบข้อมูลเก่า** - ถ้ามีข้อมูลอยู่แล้วจะถูกลบและใส่ใหม่
2. **Password** - ใช้ password ที่ระบุไว้ด้านบน
3. **DATABASE_URL** - ตรวจสอบว่าใช้ database ที่ถูกต้อง

---

## 🎯 Quick Commands

```bash
# Seed database
npm run db:seed

# ตรวจสอบ
npx prisma studio
```
