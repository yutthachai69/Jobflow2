# Docker กับโปรเจกต์นี้

## ความหมายสั้น ๆ

**Docker Image** = แพ็กเกจพร้อมรันของแอป (แม่พิมพ์ / snapshot ที่อ่านอย่างเดียว)

**Docker Container** = ตัวที่เอา image ไปเปิดใช้งานจริง (process ที่รันอยู่ + เลเยอร์เขียนชั่วคราว)

สร้างได้หลาย container จาก image เดียวกัน — แต่ละตัวแยกกัน (ถ้าไม่แชร์ volume)

---

## ใน repo นี้ map ยังไง

| สิ่งที่มี | คืออะไร |
|-----------|---------|
| `Dockerfile` | คำสั่งสร้าง **image** แอป (Next.js standalone + Prisma) |
| `docker compose build` | build ได้ **image** ชื่อ `jobflow:latest` (ตาม `docker-compose.yml`) |
| `docker compose up -d` | สร้างและรัน **containers** (`jobflow-app` = เว็บ, `jobflow21-db` = Postgres) |

Image ของฐานข้อมูล (`postgres:15-alpine`) ดึงจาก Docker Hub — ไม่ build ใน repo

---

## คำสั่งที่ใช้บ่อย

สร้าง image แอป:

```bash
docker build -t jobflow:latest .
# หรือ
npm run docker:build
```

รันเว็บ + DB เป็น containers:

```bash
docker compose up -d
```

ส่ง image ให้เซิร์ฟเวอร์อื่น (ไฟล์):

```bash
npm run docker:save
# ได้ jobflow-image.tar → ฝั่ง server: docker load -i jobflow-image.tar
```

---

## สิ่งที่ image ไม่แทน

- **ความลับ / env จริง** (เช่น `DATABASE_URL`, `JWT_SECRET`) ใส่ตอนรันผ่าน compose หรือ `--env-file` บนเซิร์ฟเวอร์
- **`npm run build` บนเครื่องอย่างเดียว** = แค่โฟลเดอร์ `.next` ยังไม่ใช่ Docker image
