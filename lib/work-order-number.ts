// lib/work-order-number.ts
// สร้างเลขที่งานรูปแบบ YYMMDD####
import { prisma } from './prisma'

/**
 * สร้างเลขที่งานรูปแบบ YYMMDD####
 * @param scheduledDate วันที่นัดหมาย
 * @returns เลขที่งาน เช่น "6901250001"
 */
export async function generateWorkOrderNumber(scheduledDate: Date): Promise<string> {
  // แปลงเป็นปี พ.ศ.
  const year = scheduledDate.getFullYear() + 543 // พ.ศ. = ค.ศ. + 543
  const yy = String(year).slice(-2) // 2 หลักสุดท้ายของปี พ.ศ.
  const mm = String(scheduledDate.getMonth() + 1).padStart(2, '0') // เดือน (01-12)
  const dd = String(scheduledDate.getDate()).padStart(2, '0') // วันที่ (01-31)
  
  const datePrefix = `${yy}${mm}${dd}` // เช่น "690125"
  
  // หาเลขลำดับของงานในวันนั้น
  const startOfDay = new Date(scheduledDate)
  startOfDay.setHours(0, 0, 0, 0)
  const endOfDay = new Date(scheduledDate)
  endOfDay.setHours(23, 59, 59, 999)
  
  // นับจำนวนงานที่มี workOrderNumber ขึ้นต้นด้วย datePrefix ในวันนั้น
  const existingOrders = await prisma.workOrder.findMany({
    where: {
      workOrderNumber: {
        startsWith: datePrefix,
      },
      scheduledDate: {
        gte: startOfDay,
        lte: endOfDay,
      },
    },
    select: {
      workOrderNumber: true,
    },
  })
  
  // หาเลขลำดับสูงสุด
  let maxSequence = 0
  for (const order of existingOrders) {
    if (order.workOrderNumber) {
      const sequence = parseInt(order.workOrderNumber.slice(-4), 10)
      if (!isNaN(sequence) && sequence > maxSequence) {
        maxSequence = sequence
      }
    }
  }
  
  // สร้างเลขลำดับถัดไป
  const nextSequence = maxSequence + 1
  const sequenceStr = String(nextSequence).padStart(4, '0') // 4 หลัก เช่น "0001"
  
  return `${datePrefix}${sequenceStr}` // เช่น "6901250001"
}

/**
 * แสดงเลขที่งาน (ใช้ workOrderNumber ถ้ามี ไม่เช่นนั้นใช้ id.slice(-8))
 * @param workOrder WorkOrder object ที่มี workOrderNumber และ id
 * @returns เลขที่งานที่แสดง
 */
export function getWorkOrderDisplayNumber(workOrder: { workOrderNumber?: string | null; id: string }): string {
  return workOrder.workOrderNumber || workOrder.id.slice(-8)
}
