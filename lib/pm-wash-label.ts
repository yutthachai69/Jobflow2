/**
 * แสดงประเภทการล้าง PM (ล้างใหญ่ / ล้างย่อย) ตามกราฟลูกค้า:
 * ใช้ pmSchedule.pmType ถ้ามี ไม่เช่นนั้นใช้ adHocPmType (ใบ PM สร้างมือ)
 * เฉพาะเมื่อ work order เป็น PM
 */
export type PmWashJobItemSlice = {
  adHocPmType?: 'MAJOR' | 'MINOR' | null
  pmSchedule?: { pmType?: 'MAJOR' | 'MINOR' | null } | null
}

export function getPmWashTypeLabelThai(
  workOrderJobType: string,
  jobItem: PmWashJobItemSlice
): string | null {
  if (workOrderJobType !== 'PM') return null
  const t = jobItem.pmSchedule?.pmType ?? jobItem.adHocPmType
  if (t === 'MAJOR') return 'ล้างใหญ่'
  if (t === 'MINOR') return 'ล้างย่อย'
  return null
}
