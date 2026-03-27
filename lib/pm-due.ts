/**
 * PM due-date helpers — ใช้ร่วมกับแผน PM และการสร้างใบงานตอนช่างเริ่มงาน (field flow)
 */

export type PMScheduleDueFields = {
  id: string
  dueDate: Date | null
  targetYear: number
  targetMonth: number
  status: string
}

/** วันที่อ้างอิงสำหรับ “ถึงกำหนด” — ถ้าไม่มี dueDate ใช้สิ้นเดือนของ targetMonth/targetYear */
export function effectiveDueDate(s: PMScheduleDueFields): Date {
  if (s.dueDate) return new Date(s.dueDate)
  const lastDay = new Date(s.targetYear, s.targetMonth, 0).getDate()
  return new Date(s.targetYear, s.targetMonth - 1, lastDay, 23, 59, 59, 999)
}

/** รอบที่ยังไม่มี JobItem และสถานะ PLANNED — ถึงกำหนดเมื่อ effectiveDue <= ref (วันนี้ end-of-day) */
export function isPmScheduleDueForFieldStart(
  s: PMScheduleDueFields,
  ref: Date = new Date()
): boolean {
  if (s.status !== "PLANNED") return false
  const endOfRef = new Date(ref)
  endOfRef.setHours(23, 59, 59, 999)
  return effectiveDueDate(s).getTime() <= endOfRef.getTime()
}

/** เรียงรอบที่ควรทำก่อน (เก่าก่อน) */
export function sortSchedulesByDueAsc<T extends PMScheduleDueFields>(rows: T[]): T[] {
  return [...rows].sort((a, b) => effectiveDueDate(a).getTime() - effectiveDueDate(b).getTime())
}
