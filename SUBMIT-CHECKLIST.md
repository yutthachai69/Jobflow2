# ✅ เช็คลิสต์ก่อนส่งงาน

## 1. Build ต้องผ่าน
```bash
npm run build
```
- ถ้าเคยพังเพราะ **Google Fonts** — แก้แล้ว (ใช้ system fonts)
- ถ้า EPERM / spawn error — ลองรันใน terminal จริง (ไม่ใช่ sandbox)

## 2. Database พร้อม
```bash
npm run db:check
```
- ต้องเห็น `Schema Provider: SQLITE`, `Database connection successful`, `Users in database: 3`

ถ้าไม่ครบ:
```bash
npm run db:seed:run
node scripts/verify-client1.js
```

## 3. รันแอป
```bash
npm run dev
```
- เปิด http://localhost:3000

## 4. ทดสอบล็อกอิน
| User     | Password   | Role     |
|----------|------------|----------|
| admin    | admin123   | ADMIN    |
| tech1    | password123| TECHNICIAN |
| **client1** | **client123** | **CLIENT** |

- ล็อกอิน **client1** → ต้องเข้า Dashboard ได้ (มีสถานที่ «สาขาสุขุมวิท»)
- ถ้าเห็น «ไม่พบข้อมูลสถานที่» → **ล็อกเอาท์ แล้วล็อกอินใหม่** ด้วย client1

## 5. สิ่งที่แก้ไปแล้ว (รอบนี้)
- **Build พังตอนโหลด Google Fonts** → ลบ Geist, ใช้ system fonts ใน `layout` + `globals.css`
- **TypeScript error ในเทสต์** → exclude `__tests__` จาก `tsconfig` (เทสต์ยังรันกับ Jest ได้)
- **"ไม่พบข้อมูลสถานที่"** → ดึง `siteId` จาก DB ถ้า JWT ไม่มี (และให้ล็อกเอาท์/ล็อกอินใหม่)
- client1 มี siteId ใน seed; DB check, seed, migrate resolve scripts พร้อมใช้
