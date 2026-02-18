/**
 * ชุดสีสถานะงาน (ติดตามการล้าง/ซ่อมแอร์)
 * Clean • Trust • Professional • Calm
 * สีหม่น เห็นชัดในพริบตา ไม่ตีกับโลโก้
 */

// สถานะ Work Order
export const WO_STATUS = {
  OPEN: {
    label: 'รับแจ้งแล้ว',
    hex: '#8A8A8A',
    tailwind: 'bg-[#8A8A8A]/20 text-[#8A8A8A] border-[#8A8A8A]',
  },
  IN_PROGRESS: {
    label: 'กำลังดำเนินงาน',
    hex: '#5B7C99',
    tailwind: 'bg-[#5B7C99]/20 text-[#5B7C99] border-[#5B7C99]',
  },
  COMPLETED: {
    label: 'เสร็จสิ้น',
    hex: '#16A34A',
    tailwind: 'bg-[#16A34A]/25 text-[#15803D] border-[#16A34A]',
  },
  CANCELLED: {
    label: 'ยกเลิก',
    hex: '#9A5A5A',
    tailwind: 'bg-[#9A5A5A]/20 text-[#9A5A5A] border-[#9A5A5A]',
  },
} as const

// สถานะ Job Item (รอดำเนินการ = เหลืองหม่น)
export const JOB_STATUS = {
  PENDING: {
    label: 'รอดำเนินการ',
    hex: '#C2A66A',
    tailwind: 'bg-[#C2A66A]/20 text-[#C2A66A] border-[#C2A66A]',
  },
  IN_PROGRESS: {
    label: 'กำลังดำเนินงาน',
    hex: '#5B7C99',
    tailwind: 'bg-[#5B7C99]/20 text-[#5B7C99] border-[#5B7C99]',
  },
  DONE: {
    label: 'เสร็จสิ้น',
    hex: '#16A34A',
    tailwind: 'bg-[#16A34A]/25 text-[#15803D] border-[#16A34A]',
  },
  ISSUE_FOUND: {
    label: 'พบปัญหา',
    hex: '#9A5A5A',
    tailwind: 'bg-[#9A5A5A]/20 text-[#9A5A5A] border-[#9A5A5A]',
  },
} as const

export type WOStatusKey = keyof typeof WO_STATUS
export type JobStatusKey = keyof typeof JOB_STATUS

export function getWOStatus(status: string) {
  return WO_STATUS[status as WOStatusKey] ?? WO_STATUS.OPEN
}

export function getJobStatus(status: string) {
  return JOB_STATUS[status as JobStatusKey] ?? JOB_STATUS.PENDING
}
