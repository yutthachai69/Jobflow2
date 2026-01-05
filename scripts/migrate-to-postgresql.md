# Migration Guide: SQLite to PostgreSQL

คู่มือการ migrate จาก SQLite ไป PostgreSQL

## Prerequisites

- PostgreSQL installed และ running
- Database `airservice` ถูกสร้างแล้ว
- Backup ของ SQLite database

## Step 1: Backup SQLite Database

```bash
# Windows
.\scripts\backup-db.ps1

# Linux/Mac
./scripts/backup-db.sh
```

## Step 2: Create PostgreSQL Database

```sql
-- Login to PostgreSQL
psql -U postgres

-- Create database
CREATE DATABASE airservice;

-- Create user (optional)
CREATE USER airservice_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE airservice TO airservice_user;
```

## Step 3: Update Environment Variables

แก้ไข `.env`:

```env
# เปลี่ยนจาก
DATABASE_URL="file:./prisma/dev.db"

# เป็น
DATABASE_URL="postgresql://user:password@localhost:5432/airservice?schema=public"
```

## Step 4: Update Prisma Schema (ถ้าจำเป็น)

Prisma schema รองรับทั้ง SQLite และ PostgreSQL แล้ว ไม่ต้องแก้ไข

## Step 5: Run Migrations

```bash
# Generate Prisma Client
npx prisma generate

# Run migrations (จะสร้าง tables ใหม่)
npx prisma migrate deploy
```

## Step 6: Migrate Data

ใช้ script `scripts/migrate-data-to-postgresql.js`:

```bash
node scripts/migrate-data-to-postgresql.js
```

หรือ migrate manually ด้วย Prisma Studio:

```bash
# เปิด SQLite database
DATABASE_URL="file:./prisma/dev.db" npx prisma studio

# เปิด PostgreSQL database
DATABASE_URL="postgresql://..." npx prisma studio
```

## Step 7: Verify Migration

```bash
# เช็คข้อมูลใน PostgreSQL
DATABASE_URL="postgresql://..." npx prisma studio
```

## Step 8: Test Application

```bash
npm run dev
```

ทดสอบ:
- Login
- Create/Read/Update/Delete operations
- File uploads
- All features

## Troubleshooting

### Connection Error

ตรวจสอบ:
- PostgreSQL service ทำงานอยู่
- Database name, user, password ถูกต้อง
- Firewall rules

### Migration Error

```bash
# Reset database (ระวัง: จะลบข้อมูลทั้งหมด)
npx prisma migrate reset

# หรือ drop และสร้างใหม่
npx prisma migrate dev
```

### Data Type Issues

บาง data types อาจต้องแปลง:
- SQLite `TEXT` → PostgreSQL `TEXT` หรือ `VARCHAR`
- SQLite `INTEGER` → PostgreSQL `INTEGER` หรือ `BIGINT`
- SQLite `REAL` → PostgreSQL `DOUBLE PRECISION`

Prisma จะจัดการให้อัตโนมัติ

## Rollback

ถ้าต้องการ rollback กลับไป SQLite:

1. เปลี่ยน `DATABASE_URL` กลับเป็น SQLite
2. Restore จาก backup
3. `npx prisma generate`

