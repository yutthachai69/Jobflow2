import type { OrderStatus, PrismaClient } from '@prisma/client'

export const WO_STATUSES_LOCKED_BY_WORKFLOW: OrderStatus[] = [
  'CANCELLED',
  'WAITING_APPROVAL',
  'APPROVED',
  'REJECTED',
]

type JobItemStatus = 'PENDING' | 'IN_PROGRESS' | 'DONE' | 'ISSUE_FOUND'

/** สถานะ WorkOrder ที่ควรเป็น จากสถานะ JobItem ทั้งใบ (null = ไม่มีรายการ) */
export function deriveWorkOrderStatusFromJobItems(
  jobItemStatuses: JobItemStatus[]
): OrderStatus | null {
  if (jobItemStatuses.length === 0) return null

  const allDone = jobItemStatuses.every((s) => s === 'DONE')
  const anyStarted = jobItemStatuses.some(
    (s) => s === 'IN_PROGRESS' || s === 'DONE' || s === 'ISSUE_FOUND'
  )

  if (allDone) return 'COMPLETED'
  if (anyStarted) return 'IN_PROGRESS'
  return 'OPEN'
}

/**
 * ปรับสถานะ WorkOrder ให้สอดคล้อง JobItem ทั้งใบ:
 * - ทุกรายการ DONE → COMPLETED
 * - มีรายการเริ่มทำ/เสร็จบางส่วน → IN_PROGRESS
 * - ทุกรายการยัง PENDING → OPEN
 */
export async function syncWorkOrderStatusFromJobItems(
  prisma: PrismaClient,
  workOrderId: string
): Promise<{ previous: OrderStatus; next: OrderStatus } | null> {
  const wo = await prisma.workOrder.findUnique({
    where: { id: workOrderId },
    select: { status: true },
  })
  if (!wo) return null

  if (WO_STATUSES_LOCKED_BY_WORKFLOW.includes(wo.status)) {
    return null
  }

  const jobItems = await prisma.jobItem.findMany({
    where: { workOrderId },
    select: { status: true },
  })
  if (jobItems.length === 0) return null

  const nextStatus = deriveWorkOrderStatusFromJobItems(
    jobItems.map((j) => j.status as JobItemStatus)
  )
  if (!nextStatus) return null

  if (wo.status === nextStatus) {
    return null
  }

  await prisma.workOrder.update({
    where: { id: workOrderId },
    data: { status: nextStatus },
  })

  return { previous: wo.status, next: nextStatus }
}
