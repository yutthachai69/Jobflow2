# แผน PM แบบสนาม (Field-first) — สร้างใบงานเมื่อเริ่มทำ

## สรุปพฤติกรรม

1. **แผน PM** (`PMSchedule`) ยังถูกสร้างจากสัญญาปี (`generatePMContract`) เหมือนเดิม — มี `dueDate` / เดือนเป้าหมาย และสถานะ `PLANNED` จนกว่าจะมีใบงาน
2. **ไม่มี Auto-dispatch** — `dispatchDuePMSchedules()` ไม่สร้าง `WorkOrder` อีกต่อไป (เก็บฟังก์ชันไว้เพื่อความเข้ากันได้ แต่บันทึกว่าปิดใช้งาน)
3. **ช่าง** สแกน QR → เปิดหน้าทรัพย์สิน `/assets/[id]` → เมื่อมีรอบที่ **ถึงกำหนด** และ **ยังไม่มี JobItem** จะเห็นปุ่ม **เริ่มงาน PM** → เรียก `startPmJobFromAsset(assetId)`:
   - สร้าง `WorkOrder` (PM) 1 ใบ + `JobItem` 1 รายการผูก `pmScheduleId`
   - ตั้ง `PMSchedule.status = DISPATCHED`
   - ช่าง: ตั้ง `technicianId` = ผู้ใช้ปัจจุบัน — แอดมิน: `technicianId` = null (ไปอยู่ในกลุ่ม “งานที่ยังไม่มีคนรับ”)
4. **แอดมิน** ยังออกใบแบบมือได้ที่ **ออกใบงาน PM ประจำเดือน** — `createWorkOrderFromPM` (เลือกหลายรายการ / หลาย site) พร้อมเลขที่ใบงานและ `DISPATCHED` + checklist พัดลมดูดอากาศเมื่อจำเป็น

## การตัดสินว่า “ถึงกำหนด”

ใช้ `lib/pm-due.ts`:

- ถ้ามี `dueDate` ใช้ค่านั้น
- ถ้าไม่มี ใช้ **สิ้นเดือนของ `targetMonth` / `targetYear`**
- ถึงกำหนดเมื่อ `effectiveDueDate <= วันนี้ (สิ้นวัน)` และ `status === PLANNED` และยังไม่มี `jobItem`

รอบที่เลือกเมื่อเริ่มจากสนาม: **รอบที่ due ที่เก่าที่สุดก่อน** (เรียงตาม `effectiveDueDate`)

## ไฟล์ที่เกี่ยวข้อง

| ส่วน | ไฟล์ |
|------|------|
| ตรรกะ due + เริ่มงาน | `lib/pm-due.ts`, `app/actions/pm.ts` (`startPmJobFromAsset`, `createWorkOrderFromPM`, `dispatchDuePMSchedules`) |
| UI ช่าง | `app/assets/[id]/page.tsx`, `app/assets/[id]/StartPmJobButton.tsx` |
| UI แอดมิน | `app/admin/pm-planning/dispatch/page.tsx` |

## หมายเหตุการย้ายจากของเก่า

- รายงาน/แดชบอร์ดที่นับเฉพาะ `WorkOrder` อาจเห็น **ใบงาน PM น้อยลงจนกว่าช่างจะกดเริ่ม** — ภาระงานตามแผนยังดูได้จาก `PMSchedule` + หน้า dispatch (รายการเดือนที่ยังไม่มี `jobItem`)
