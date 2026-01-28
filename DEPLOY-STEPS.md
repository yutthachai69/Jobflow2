# 🚀 Deployment Steps - ขั้นตอน Deploy บน Server

## ✅ Step 1: Git Pull (เสร็จแล้ว)

```bash
git pull
```

---

## 📋 Step 2: ตรวจสอบไฟล์ที่สำคัญ

ตรวจสอบว่าไฟล์เหล่านี้มีอยู่:
- ✅ `scripts/setup-database-complete.sql` - SQL script สำหรับ pgAdmin
- ✅ `scripts/generate-bcrypt-hash.js` - Script สำหรับ generate hash
- ✅ `Dockerfile` - Docker configuration
- ✅ `docker-compose.yml` - Docker Compose configuration

---

## 🐳 Step 3: Build และ Start Containers

```bash
# Stop containers เก่า (ถ้ามี)
docker-compose down

# Build และ start containers ใหม่
docker-compose up -d --build

# ตรวจสอบว่า containers รันอยู่
docker ps

# ดู logs
docker-compose logs -f web
```

---

## 🗄️ Step 4: Setup Database

### วิธีที่ 1: ใช้ pgAdmin (แนะนำ)

1. **เปิด pgAdmin**
2. **Connect ไปที่ database `jobflow`**
   - Host: `localhost` (หรือ IP ของ server)
   - Port: `5432`
   - Database: `jobflow`
   - Username: `postgres`
   - Password: `postgres`

3. **Generate bcrypt hash:**
   ```bash
   node scripts/generate-bcrypt-hash.js
   ```
   Copy hash ที่ได้ไปใช้ใน SQL script

4. **เปิด Query Tool** (Tools → Query Tool)

5. **เปิดไฟล์ `scripts/setup-database-complete.sql`**

6. **แก้ไข bcrypt hash** (แทนที่ hash เก่าด้วย hash ที่ generate ใหม่)

7. **Execute** (F5)

### วิธีที่ 2: ใช้ Command Line

```bash
# Generate hash
node scripts/generate-bcrypt-hash.js

# Copy hash ไปแทนที่ใน SQL script แล้วรัน
psql -U postgres -d jobflow -f scripts/setup-database-complete.sql
```

---

## 🔍 Step 5: ตรวจสอบ Deployment

### ตรวจสอบ Containers

```bash
# ดู containers ที่รันอยู่
docker ps

# ดู logs
docker-compose logs -f web
docker-compose logs -f db
```

### ตรวจสอบ Database

```bash
# เข้าไปใน database
docker exec -it jobflow-db psql -U postgres -d jobflow

# ดูตารางทั้งหมด
\dt

# ดู users
SELECT username, role FROM "User";

# ออกจาก psql
\q
```

### ตรวจสอบ Web Server

```bash
# ตรวจสอบว่า web server รันอยู่
curl http://localhost:3000

# หรือเปิด browser ไปที่
# http://YOUR_SERVER_IP:3000
```

---

## 🔐 Default Accounts

หลังจาก setup database แล้ว จะมี accounts:

- **ADMIN**: `admin` / `admin123`
- **TECHNICIAN**: `tech1` / `password123`
- **CLIENT**: `client1` / `client123`

---

## ⚠️ Troubleshooting

### Container ไม่ start

```bash
# ดู logs
docker-compose logs web

# ตรวจสอบว่า build สำเร็จ
docker-compose build

# Restart
docker-compose restart
```

### Database Connection Error

```bash
# ตรวจสอบว่า database container รันอยู่
docker ps | grep jobflow-db

# ตรวจสอบ database logs
docker logs jobflow-db

# Test connection
docker exec -it jobflow-db psql -U postgres -d jobflow -c "SELECT 1;"
```

### Migration Issues

```bash
# เข้าไปใน web container
docker exec -it jobflow-app sh

# ตรวจสอบ Prisma
npx prisma validate

# รัน migration
npx prisma migrate deploy
```

---

## 🎯 Quick Commands

```bash
# 1. Pull latest code
git pull

# 2. Build และ start
docker-compose down
docker-compose up -d --build

# 3. ตรวจสอบ
docker ps
docker-compose logs -f web

# 4. Setup database (ใช้ pgAdmin)
# - เปิด pgAdmin
# - Connect ไปที่ database jobflow
# - รัน scripts/setup-database-complete.sql
```

---

## ✅ Checklist

- [ ] Git pull สำเร็จ
- [ ] Containers build และ start สำเร็จ
- [ ] Database container รันอยู่
- [ ] Web container รันอยู่
- [ ] Database setup สำเร็จ (รัน SQL script)
- [ ] สามารถ login ได้ด้วย default accounts
- [ ] Web server ตอบสนอง (http://localhost:3000)

---

## 📝 หมายเหตุ

1. **Database name**: ใช้ `jobflow` (ตาม docker-compose.yml)
2. **JWT_SECRET**: ตั้งค่าใน docker-compose.yml แล้ว (ยาวกว่า 32 ตัวอักษร)
3. **Ports**: 
   - Database: `5432`
   - Web: `3000`
4. **Environment Variables**: ตั้งค่าใน docker-compose.yml แล้ว
