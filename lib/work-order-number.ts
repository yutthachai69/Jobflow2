// lib/work-order-number.ts
// สร้างเลขที่งานรูปแบบ 8vxgpup#### (รันต่อเนื่องไม่รีเซ็ต)
import { prisma } from './prisma'

export async function generateWorkOrderNumber(scheduledDate: Date): Promise<string> {
  // Use YYMM format as prefix (e.g., 2402 for Feb 2024)
  const year = scheduledDate.getFullYear().toString().slice(-2)
  const month = (scheduledDate.getMonth() + 1).toString().padStart(2, '0')
  const prefix = `${year}${month}`

  // Find max sequence for this prefix
  const existingOrders = await prisma.workOrder.findMany({
    where: {
      workOrderNumber: {
        startsWith: prefix,
      },
    },
    select: {
      workOrderNumber: true,
    },
    orderBy: {
      workOrderNumber: 'desc',
    },
    take: 1,
  })

  let maxSequence = 0
  if (existingOrders.length > 0 && existingOrders[0].workOrderNumber) {
    const woNumber = existingOrders[0].workOrderNumber
    const sequenceStr = woNumber.slice(4) // Skip YYMM prefix
    const sequence = parseInt(sequenceStr, 10)
    if (!isNaN(sequence)) {
      maxSequence = sequence
    }
  }

  const nextSequence = maxSequence + 1
  const sequenceStr = String(nextSequence).padStart(4, '0')

  return `${prefix}${sequenceStr}`
}

/**
 * แสดงเลขที่งาน (ใช้ workOrderNumber ถ้ามี ไม่เช่นนั้นใช้ id.slice(-8))
 * @param workOrder WorkOrder object ที่มี workOrderNumber และ id
 * @returns เลขที่งานที่แสดง
 */
export function getWorkOrderDisplayNumber(workOrder: { workOrderNumber?: string | null; id: string }): string {
  return workOrder.workOrderNumber || workOrder.id.slice(-8)
}
