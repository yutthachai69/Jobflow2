# AirService Enterprise

ระบบบริหารจัดการงานบริการแอร์ (Enterprise Air Service Management System)

## 📋 ภาพรวม

AirService Enterprise เป็นระบบจัดการงานบริการเครื่องปรับอากาศแบบครบวงจร สำหรับบริษัทที่ให้บริการซ่อมบำรุง แก้ไข และติดตั้งเครื่องปรับอากาศ โดยรองรับ 3 บทบาทผู้ใช้:

- **ADMIN**: ผู้ดูแลระบบ - จัดการข้อมูลทั้งหมด งาน สถานที่ และผู้ใช้
- **CLIENT**: ลูกค้า - ดูข้อมูลงานและสถานะของเครื่องปรับอากาศ
- **TECHNICIAN**: ช่าง - ทำงานซ่อมบำรุง ส่งรูปภาพ และบันทึกผลการทำงาน

## ✨ Features หลัก

### 1. จัดการทรัพย์สิน (Asset Management)
- ลงทะเบียนเครื่องปรับอากาศ (ยี่ห้อ, รุ่น, Serial Number, BTU)
- แสดง QR Code สำหรับแต่ละเครื่อง
- ดูประวัติการซ่อมบำรุงทั้งหมด
- แก้ไขและลบข้อมูลเครื่อง (สำหรับ ADMIN)

### 2. จัดการใบสั่งงาน (Work Order Management)
- สร้างใบสั่งงาน (PM - Preventive Maintenance, CM - Corrective Maintenance, INSTALL)
- แสดงสถานะความคืบหน้าของงาน
- มอบหมายงานให้ช่าง
- แก้ไขและลบใบสั่งงาน (สำหรับ ADMIN)

### 3. การทำงานของช่าง (Technician Workflow)
- Dashboard สรุปงาน (งานที่รอทำ, กำลังทำ, เสร็จสิ้น)
- สแกน QR Code เพื่อดูข้อมูลเครื่อง
- อัปโหลดรูปภาพ (ก่อนทำ, หลังทำ, ข้อบกพร่อง, มิเตอร์)
- บันทึกหมายเหตุการทำงาน
- บังคับให้ต้องแนบรูป BEFORE และ AFTER ก่อนเสร็จงาน

### 4. จัดการสถานที่ (Location Management)
- จัดการ Client, Site, Building, Floor, Room
- สร้างโครงสร้างสถานที่แบบลำดับชั้น

### 5. จัดการผู้ใช้ (User Management)
- สร้าง แก้ไข และลบผู้ใช้
- กำหนดบทบาทและสถานที่ (สำหรับ CLIENT)

### 6. ระบบข้อความ (Messages)
- ลูกค้าส่งข้อความติดต่อ
- ADMIN ดูและจัดการข้อความ
- แจ้งเตือนข้อความใหม่ด้วย Badge

### 7. Security
- Session management พร้อม idle timeout (30 นาที)
- Rate limiting
- Security logging
- Role-based access control

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- npm หรือ yarn
- SQLite (default) หรือ PostgreSQL

### Installation

1. Clone repository:
```bash
git clone <repository-url>
cd Jobflow2
```

2. Install dependencies:
```bash
npm install
```

3. Setup environment variables:
```bash
# สร้างไฟล์ .env และกรอกค่าตาม ENV_SETUP.md
```

แก้ไข `.env`:
```
DATABASE_URL="file:./prisma/dev.db"
NODE_ENV="development"
```

ดูรายละเอียดเพิ่มเติมใน [ENV_SETUP.md](./ENV_SETUP.md)

4. Setup database:
```bash
# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate dev

# (Optional) Seed sample data
npx prisma db seed
```

5. Run development server:
```bash
npm run dev
```

เปิดเบราว์เซอร์ไปที่ [http://localhost:3000](http://localhost:3000)

## 👤 Default Accounts

หลังจาก seed database:

- **ADMIN**: 
  - Username: `admin`
  - Password: `admin123`

- **TECHNICIAN**: 
  - Username: `tech1`
  - Password: `password123`

- **CLIENT**: 
  - Username: `client1`
  - Password: `client123`

## 🛠 Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Database**: Prisma ORM + SQLite
- **Authentication**: Cookie-based session
- **Styling**: Tailwind CSS 4
- **QR Code**: html5-qrcode, qrcode
- **Security**: bcryptjs

## 📁 โครงสร้างโปรเจ็กต์

```
app/
  ├── actions.ts           # Server Actions
  ├── components/          # Shared components
  ├── assets/             # Asset management
  ├── work-orders/        # Work order management
  ├── technician/         # Technician workflow
  ├── locations/          # Location management
  ├── users/              # User management
  ├── messages/           # Messages (ADMIN only)
  ├── contact/            # Contact form/info
  └── ...

lib/
  ├── prisma.ts          # Prisma client
  ├── auth.ts            # Authentication
  ├── validation.ts      # Validation helpers
  └── security.ts        # Security utilities

prisma/
  ├── schema.prisma      # Database schema
  └── seed.ts            # Seed data
```

## 🔒 Security Features

- **Authentication**: Cookie-based session
- **Authorization**: Role-based access control (RBAC)
- **Session Management**: Idle timeout (30 นาที)
- **Rate Limiting**: ป้องกัน brute force attacks
- **Security Logging**: บันทึก security events
- **Input Validation**: Sanitization และ validation

## 📝 Database Schema

ระบบใช้ Prisma ORM โดยมี Models หลัก:

- **User**: ผู้ใช้ (ADMIN, TECHNICIAN, CLIENT)
- **Asset**: เครื่องปรับอากาศ
- **WorkOrder**: ใบสั่งงาน
- **JobItem**: รายการงานในแต่ละเครื่อง
- **JobPhoto**: รูปภาพการทำงาน
- **Location Hierarchy**: Client → Site → Building → Floor → Room
- **ContactMessage**: ข้อความติดต่อ

## 🚢 Deployment

### Build for production:

```bash
npm run build
npm start
```

### Environment Variables:

- `DATABASE_URL`: Database connection string
- `NODE_ENV`: `production` สำหรับ production
- `NEXT_PUBLIC_APP_URL`: URL ของแอปพลิเคชัน (สำหรับ SEO meta tags) เช่น `https://yourdomain.com`

## 🔍 SEO & Meta Tags

ระบบรองรับ SEO และ Social Media Meta Tags:

- **Open Graph Tags**: สำหรับ Facebook, LinkedIn
- **Twitter Card Tags**: สำหรับ Twitter
- **Dynamic Metadata**: หน้า Asset และ Work Order มี metadata แบบ dynamic
- **Robots Meta**: ควบคุมการ index ของ search engines

หน้า Dashboard และหน้า Login จะถูกตั้งค่า `noindex` เพื่อป้องกันการ index โดย search engines

## 📄 License

Private

## 👥 Contributors

AirService Enterprise Team

## 📚 Documentation

- [Database Migration Guide](./DATABASE_MIGRATION.md) - คู่มือการ migrate จาก SQLite ไป PostgreSQL
- [Production Checklist](./PRODUCTION_CHECKLIST.md) - รายการตรวจสอบก่อน deploy

## 🔄 Database Migration

ระบบรองรับทั้ง SQLite (development) และ PostgreSQL (production)

### Quick Switch to PostgreSQL

```bash
# 1. Switch schema
npm run db:switch:postgres

# 2. Update .env
DATABASE_URL="postgresql://user:password@localhost:5432/airservice"

# 3. Generate & Migrate
npm run db:generate
npm run db:migrate:deploy

# 4. Migrate data (if needed)
npm run db:migrate:postgres
```

ดูรายละเอียดเพิ่มเติมใน [DATABASE_MIGRATION.md](./DATABASE_MIGRATION.md)

## 📞 Support

สำหรับคำถามหรือปัญหาติดต่อทีมพัฒนา
