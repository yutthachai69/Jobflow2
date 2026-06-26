/**
 * ตัวเลข JobItem บนแดชบอร์ด — ใช้ร่วมกันระหว่างแอดมิน/ช่างเพื่อไม่ให้ query คนละชุด
 *
 * - แอดมิน: ส่ง siteId เมื่อกรองไซต์ (ตรงกับ SiteFilter)
 * - ช่าง: ไม่ส่ง siteId → นับทุกไซต์ (เทียบได้กับแอดมินเมื่อเลือก "ภาพรวมทั้งระบบ")
 */
import type { PrismaClient } from '@prisma/client'

export function startOfLocalDay(d = new Date()): Date {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}

export type DashboardJobItemStats = {
  activeJobItems: number
  completedToday: number
  totalDone: number
  totalJobItems: number
}

type DashboardStatsOptions = {
  siteId?: string
  /** จำกัดเฉพาะงานที่ช่างคนนี้รับผิดชอบ */
  technicianId?: string
}

function buildJobItemWhere(opts: DashboardStatsOptions) {
  const where: {
    workOrder?: { siteId: string }
    technicianId?: string
  } = {}
  if (opts.siteId) where.workOrder = { siteId: opts.siteId }
  if (opts.technicianId) where.technicianId = opts.technicianId
  return where
}

export async function getDashboardJobItemStats(
  prisma: PrismaClient,
  siteIdOrOpts?: string | DashboardStatsOptions
): Promise<DashboardJobItemStats> {
  const opts: DashboardStatsOptions =
    typeof siteIdOrOpts === 'string' ? { siteId: siteIdOrOpts } : siteIdOrOpts ?? {}
  const baseWhere = buildJobItemWhere(opts)
  const dayStart = startOfLocalDay()

  const [activeJobItems, completedToday, totalDone, totalJobItems] = await Promise.all([
    prisma.jobItem.count({
      where: {
        status: { in: ['PENDING', 'IN_PROGRESS', 'ISSUE_FOUND'] },
        ...baseWhere,
      },
    }),
    prisma.jobItem.count({
      where: {
        status: 'DONE',
        endTime: { gte: dayStart },
        ...baseWhere,
      },
    }),
    prisma.jobItem.count({
      where: {
        status: 'DONE',
        ...baseWhere,
      },
    }),
    prisma.jobItem.count({
      where: baseWhere,
    }),
  ])

  return { activeJobItems, completedToday, totalDone, totalJobItems }
}

/** สถิติเฉพาะงานที่ช่างคนนี้รับผิดชอบ */
export function getTechnicianPersonalStats(
  prisma: PrismaClient,
  technicianId: string,
  siteId?: string
) {
  return getDashboardJobItemStats(prisma, { technicianId, siteId })
}
