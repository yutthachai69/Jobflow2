// lib/work-order-number.ts
// สร้างเลขที่งานรูปแบบ 8vxgpup#### (รันต่อเนื่องไม่รีเซ็ต)
import { prisma } from './prisma'

const WORK_ORDER_PREFIX = '8vxgpup'

/**
 * สร้างเลขที่งานรูปแบบ 8vxgpup#### (รันต่อเนื่องไม่รีเซ็ต)
 * @param scheduledDate วันที่นัดหมาย (ไม่ใช้ในการสร้างเลขแล้ว แต่เก็บไว้เพื่อ compatibility)
 * @returns เลขที่งาน เช่น "8vxgpup0001", "8vxgpup0002"
 */
export async function generateWorkOrderNumber(scheduledDate: Date): Promise<string> {
  // หาเลขลำดับสูงสุดจากงานทั้งหมดที่มี prefix "8vxgpup"
  const existingOrders = await prisma.workOrder.findMany({
    where: {
      workOrderNumber: {
        startsWith: WORK_ORDER_PREFIX,
      },
    },
    select: {
      workOrderNumber: true,
    },
    orderBy: {
      workOrderNumber: 'desc',
    },
    take: 1, // เอาแค่ตัวล่าสุด
  })
  
  // หาเลขลำดับสูงสุด
  let maxSequence = 0
  if (existingOrders.length > 0 && existingOrders[0].workOrderNumber) {
    const woNumber = existingOrders[0].workOrderNumber
    // ตัด prefix ออกแล้วเอา sequence มา
    const sequenceStr = woNumber.replace(WORK_ORDER_PREFIX, '')
    const sequence = parseInt(sequenceStr, 10)
    if (!isNaN(sequence)) {
      maxSequence = sequence
    }
  }
  
  // สร้างเลขลำดับถัดไป (รันต่อเนื่อง)
  const nextSequence = maxSequence + 1
  const sequenceStr = String(nextSequence).padStart(4, '0') // 4 หลัก เช่น "0001"
  
  return `${WORK_ORDER_PREFIX}${sequenceStr}` // เช่น "8vxgpup0001"
}

/**
 * แสดงเลขที่งาน (ใช้ workOrderNumber ถ้ามี ไม่เช่นนั้นใช้ id.slice(-8))
 * @param workOrder WorkOrder object ที่มี workOrderNumber และ id
 * @returns เลขที่งานที่แสดง
 */
export function getWorkOrderDisplayNumber(workOrder: { workOrderNumber?: string | null; id: string }): string {
  return workOrder.workOrderNumber || workOrder.id.slice(-8)
}
