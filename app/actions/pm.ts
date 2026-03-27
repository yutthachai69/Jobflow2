"use server"

import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { logSecurityEvent } from "@/lib/security"
import { generateWorkOrderNumber } from "@/lib/work-order-number"
import {
  isPmScheduleDueForFieldStart,
  sortSchedulesByDueAsc,
  type PMScheduleDueFields,
} from "@/lib/pm-due"
import type { AssetType, PMType } from "@prisma/client"

function pmJobItemNote(pmType: PMType, roundIndex: number) {
  return `รอบบำรุงรักษา: ${pmType === "MAJOR" ? "ล้างใหญ่" : "ล้างย่อย"} (รอบที่ ${roundIndex})`
}

function pmChecklistJsonForAsset(assetType: AssetType): string | null {
  if (assetType === "EXHAUST") {
    return JSON.stringify({ formType: "EXHAUST_FAN", data: {} })
  }
  return null
}

export async function getSitesWithPMStatus(year: number) {
  const user = await getCurrentUser()
  if (!user || user.role !== 'ADMIN') throw new Error("Unauthorized")

  const sites = await prisma.site.findMany({
    include: {
      client: true,
      pmContracts: {
        where: { year }
      },
      _count: {
        select: {
          buildings: true
        }
      }
    },
    orderBy: { name: 'asc' }
  })
  
  const assetCounts = await Promise.all(sites.map(async (site) => {
    const acCount = await prisma.asset.count({
      where: {
        assetType: 'AIR_CONDITIONER',
        status: 'ACTIVE',
        room: { floor: { building: { siteId: site.id } } }
      }
    })
    const exhaustCount = await prisma.asset.count({
      where: {
        assetType: 'EXHAUST',
        status: 'ACTIVE',
        room: { floor: { building: { siteId: site.id } } }
      }
    })
    return { siteId: site.id, acCount, exhaustCount }
  }))

  return sites.map(site => {
    const counts = assetCounts.find(a => a.siteId === site.id)
    return {
      ...site,
      acCount: counts?.acCount || 0,
      exhaustCount: counts?.exhaustCount || 0,
    }
  })
}

export async function generatePMContract(siteId: string, year: number) {
  const user = await getCurrentUser()
  if (!user || user.role !== 'ADMIN') throw new Error("Unauthorized")

  const existing = await prisma.pMContract.findFirst({
    where: { siteId, year }
  })
  
  if (existing) throw new Error("มีสัญญา PM ของสถานที่นี้ในปีที่เลือกอยู่แล้ว")

  const site = await prisma.site.findUnique({ where: { id: siteId } })
  if (!site) throw new Error("ไม่พบสถานที่")

  // Fetch both AC and Exhaust assets
  const acAssets = await prisma.asset.findMany({
    where: {
      assetType: 'AIR_CONDITIONER',
      room: { floor: { building: { siteId } } },
      status: 'ACTIVE'
    },
    select: { id: true }
  })

  const exhaustAssets = await prisma.asset.findMany({
    where: {
      assetType: 'EXHAUST',
      room: { floor: { building: { siteId } } },
      status: 'ACTIVE'
    },
    select: { id: true }
  })

  if (acAssets.length === 0 && exhaustAssets.length === 0) {
    throw new Error("ไม่พบอุปกรณ์ (AIR_CONDITIONER หรือ EXHAUST) ที่ Active ในสถานที่นี้")
  }

  // Create contract
  const contract = await prisma.pMContract.create({
    data: {
      name: `แผนบำรุงรักษา ${site.name} ประจำปี ${year}`,
      year,
      siteId,
      startDate: new Date(year, 0, 1),
      endDate: new Date(year, 11, 31)
    }
  })

  const schedulesToCreate = []

  const makeDueDate = (y: number, m: number) => new Date(y, m - 1, 15)
  
  // Air Conditioners: 2 Major + 4 Minor (6 rounds)
  // เดือน: ก.พ.(ย่อย), เม.ย.(ย่อย), มิ.ย.(ใหญ่), ส.ค.(ย่อย), ต.ค.(ย่อย), ธ.ค.(ใหญ่)
  const acMonths = [2, 4, 6, 8, 10, 12]
  const acTypes: ('MAJOR' | 'MINOR')[] = ['MINOR', 'MINOR', 'MAJOR', 'MINOR', 'MINOR', 'MAJOR']

  for (const asset of acAssets) {
    for (let i = 0; i < 6; i++) {
      const month = acMonths[i]
      schedulesToCreate.push({
        contractId: contract.id,
        assetId: asset.id,
        pmType: acTypes[i],
        roundIndex: i + 1,
        targetMonth: month,
        targetYear: year,
        dueDate: makeDueDate(year, month),
      })
    }
  }

  // Exhaust Fans: 4 Minor only (no Major)
  // เดือน: ม.ค., เม.ย., ก.ค., ต.ค.
  const exhaustMonths = [1, 4, 7, 10]

  for (const asset of exhaustAssets) {
    for (let i = 0; i < 4; i++) {
      const month = exhaustMonths[i]
      schedulesToCreate.push({
        contractId: contract.id,
        assetId: asset.id,
        pmType: 'MINOR' as const,
        roundIndex: i + 1,
        targetMonth: month,
        targetYear: year,
        dueDate: makeDueDate(year, month),
      })
    }
  }

  await prisma.pMSchedule.createMany({
    data: schedulesToCreate
  })

  logSecurityEvent('PM_CONTRACT_CREATED', {
    userId: user.id,
    username: user.username,
    description: `Created PM Contract for site ${siteId} year ${year}: ${acAssets.length} ACs (${acAssets.length * 6} schedules) + ${exhaustAssets.length} Exhausts (${exhaustAssets.length * 4} schedules).`,
  })

  revalidatePath('/admin/pm-planning')
  return { success: true, contractId: contract.id }
}

export async function deletePMContract(contractId: string) {
    const user = await getCurrentUser()
    if (!user || user.role !== 'ADMIN') throw new Error("Unauthorized")

    // Delete schedules first (if not cascading)
    await prisma.pMSchedule.deleteMany({
        where: { contractId }
    })

    await prisma.pMContract.delete({
        where: { id: contractId }
    })

    logSecurityEvent('PM_CONTRACT_DELETED', {
        userId: user.id,
        username: user.username,
        description: `Deleted PM Contract ${contractId}`,
    })

    revalidatePath('/admin/pm-planning')
    return { success: true }
}

export async function getDuePMSchedules(month: number, year: number) {
    const user = await getCurrentUser()
    if (!user || user.role !== 'ADMIN') throw new Error("Unauthorized")

    return await prisma.pMSchedule.findMany({
        where: {
            targetMonth: month,
            targetYear: year,
            jobItem: null // Only those not yet dispatched
        },
        include: {
            asset: {
                include: {
                    room: {
                        include: {
                            floor: {
                                include: {
                                    building: {
                                        include: { site: true }
                                    }
                                }
                            }
                        }
                    }
                }
            },
            contract: true
        },
        orderBy: [
            { asset: { room: { floor: { building: { site: { name: 'asc' } } } } } },
            { asset: { qrCode: 'asc' } }
        ]
    })
}

export async function createWorkOrderFromPM(siteId: string, scheduleIds: string[]) {
  const user = await getCurrentUser()
  if (!user || user.role !== 'ADMIN') throw new Error("Unauthorized")

  if (scheduleIds.length === 0) throw new Error("กรูณาเลือกรายการอย่างน้อย 1 รายการ")

  const site = await prisma.site.findUnique({ where: { id: siteId } })
  if (!site) throw new Error("ไม่พบสถานที่")

  return await prisma.$transaction(async (tx) => {
    const scheduledDate = new Date()
    const workOrderNumber = await generateWorkOrderNumber(scheduledDate)

    const workOrder = await tx.workOrder.create({
      data: {
        workOrderNumber,
        jobType: "PM",
        status: "OPEN",
        siteId,
        scheduledDate,
      },
    })

    for (const scheduleId of scheduleIds) {
      const schedule = await tx.pMSchedule.findUnique({
        where: { id: scheduleId },
        include: { asset: { select: { assetType: true } } },
      })

      if (!schedule) continue

      await tx.jobItem.create({
        data: {
          workOrderId: workOrder.id,
          assetId: schedule.assetId,
          status: "PENDING",
          pmScheduleId: schedule.id,
          techNote: pmJobItemNote(schedule.pmType, schedule.roundIndex),
          checklist: pmChecklistJsonForAsset(schedule.asset.assetType),
        },
      })

      await tx.pMSchedule.update({
        where: { id: schedule.id },
        data: { status: "DISPATCHED" },
      })
    }

    logSecurityEvent("PM_WORK_ORDER_GENERATED", {
      userId: user.userId,
      username: user.userId,
      description: `Generated Work Order ${workOrder.id} for site ${siteId} from ${scheduleIds.length} PM schedules.`,
    })

    return workOrder
  }).then(async (wo) => {
    revalidatePath("/work-orders")
    revalidatePath("/admin/pm-planning/dispatch")
    return wo
  })
}

/**
 * ช่าง (หรือแอดมินทดสอบ) สแกนเข้าหน้าทรัพย์สินแล้วกดเริ่มงาน PM — สร้าง WorkOrder + JobItem สำหรับ “รอบที่ถึงกำหนดและยังไม่มีใบงาน” รอบแรกตามลำดับ due
 */
export async function startPmJobFromAsset(assetId: string) {
  const user = await getCurrentUser()
  if (!user || (user.role !== "TECHNICIAN" && user.role !== "ADMIN")) {
    throw new Error("Unauthorized")
  }

  const asset = await prisma.asset.findUnique({
    where: { id: assetId },
    include: {
      room: {
        include: {
          floor: { include: { building: { select: { siteId: true } } } },
        },
      },
    },
  })

  if (!asset || asset.status !== "ACTIVE") {
    throw new Error("ไม่พบทรัพย์สิน หรือไม่พร้อมใช้งาน")
  }

  const siteId = asset.room?.floor?.building?.siteId
  if (!siteId) {
    throw new Error("ทรัพย์สินนี้ไม่ผูกสถานที่ครบ — ติดต่อแอดมิน")
  }

  const schedulesRaw = await prisma.pMSchedule.findMany({
    where: {
      assetId,
      status: "PLANNED",
      jobItem: { is: null },
    },
  })

  const asDue: PMScheduleDueFields[] = schedulesRaw.map((s) => ({
    id: s.id,
    dueDate: s.dueDate,
    targetYear: s.targetYear,
    targetMonth: s.targetMonth,
    status: s.status,
  }))

  const dueSorted = sortSchedulesByDueAsc(asDue.filter((s) => isPmScheduleDueForFieldStart(s)))
  if (dueSorted.length === 0) {
    throw new Error("ยังไม่มีรอบ PM ที่ถึงกำหนดสำหรับเครื่องนี้ — ตรวจสอบแผนหรือรอถึงรอบถัดไป")
  }

  const pickId = dueSorted[0]!.id

  const now = new Date()
  const workOrderNumber = await generateWorkOrderNumber(now)
  const techId = user.role === "TECHNICIAN" ? user.userId : null

  const result = await prisma.$transaction(async (tx) => {
    const schedule = await tx.pMSchedule.findFirst({
      where: {
        id: pickId,
        assetId,
        status: "PLANNED",
        jobItem: { is: null },
      },
      include: { asset: { select: { id: true, assetType: true } } },
    })

    if (!schedule) {
      throw new Error("รอบนี้ถูกสร้างใบงานไปแล้ว — รีเฟรชหน้าแล้วลองใหม่")
    }

    const workOrder = await tx.workOrder.create({
      data: {
        workOrderNumber,
        jobType: "PM",
        status: "OPEN",
        siteId,
        scheduledDate: now,
      },
    })

    const jobItem = await tx.jobItem.create({
      data: {
        workOrderId: workOrder.id,
        assetId: schedule.assetId,
        status: "PENDING",
        pmScheduleId: schedule.id,
        technicianId: techId,
        techNote: pmJobItemNote(schedule.pmType, schedule.roundIndex),
        checklist: pmChecklistJsonForAsset(schedule.asset.assetType),
      },
    })

    await tx.pMSchedule.update({
      where: { id: schedule.id },
      data: { status: "DISPATCHED" },
    })

    return { workOrderId: workOrder.id, jobItemId: jobItem.id }
  })

  revalidatePath("/work-orders")
  revalidatePath("/technician")
  revalidatePath(`/assets/${assetId}`)
  revalidatePath("/admin/pm-planning/dispatch")

  logSecurityEvent("PM_FIELD_START", {
    userId: user.userId,
    username: user.userId,
    description: `Started PM from asset ${assetId} → WO ${result.workOrderId}, jobItem ${result.jobItemId}`,
  })

  return result
}

/**
 * เดิม: สร้างใบงาน PM อัตโนมัติทุกรอบที่ dueDate ถึง
 * ปัจจุบัน: ปิดการใช้งาน — ใบงาน PM สร้างเมื่อช่างกดเริ่มที่หน้าทรัพย์สิน (`startPmJobFromAsset`) หรือแอดมินเลือกจากตารางด้านล่าง
 */
export async function dispatchDuePMSchedules(refDate?: string) {
  const user = await getCurrentUser()
  if (!user || user.role !== "ADMIN") throw new Error("Unauthorized")

  const now = refDate ? new Date(refDate) : new Date()

  logSecurityEvent("PM_AUTO_DISPATCH_DISABLED", {
    userId: user.userId,
    username: user.userId,
    description: `dispatchDuePMSchedules called but disabled (refDate=${refDate || now.toISOString()}). Use field start or manual dispatch.`,
  })

  return {
    success: true,
    created: 0,
    workOrders: 0,
    disabled: true as const,
    message:
      "ปิด Auto-dispatch แล้ว — ให้ช่างสแกน QR แล้วกดเริ่มงาน PM ที่หน้าทรัพย์สิน หรือแอดมินออกใบจากตารางด้านล่าง",
  }
}
