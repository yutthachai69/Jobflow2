"use server"

import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { logSecurityEvent } from "@/lib/security"

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
    // 1. Create Work Order
    const workOrder = await tx.workOrder.create({
      data: {
        jobType: 'PM',
        status: 'OPEN',
        siteId,
        scheduledDate: new Date(), // Today
      }
    })

    // 2. Create JobItems for each schedule
    for (const scheduleId of scheduleIds) {
      const schedule = await tx.pMSchedule.findUnique({
        where: { id: scheduleId }
      })
      
      if (!schedule) continue

      await tx.jobItem.create({
        data: {
          workOrderId: workOrder.id,
          assetId: schedule.assetId,
          status: 'PENDING',
          pmScheduleId: schedule.id,
          techNote: `รอบบำรุงรักษา: ${schedule.pmType === 'MAJOR' ? 'ล้างใหญ่' : 'ล้างย่อย'} (รอบที่ ${schedule.roundIndex})`
        }
      })
    }

    logSecurityEvent('PM_WORK_ORDER_GENERATED', {
        userId: user.id,
        username: user.username,
        description: `Generated Work Order ${workOrder.id} for site ${siteId} from ${scheduleIds.length} PM schedules.`,
    })

    return workOrder
  })
}

export async function dispatchDuePMSchedules(refDate?: string) {
  const user = await getCurrentUser()
  if (!user || user.role !== 'ADMIN') throw new Error("Unauthorized")

  const now = refDate ? new Date(refDate) : new Date()

  const schedules = await prisma.pMSchedule.findMany({
    where: {
      dueDate: { lte: now },
      status: 'PLANNED',
      jobItem: null,
    },
    include: {
      asset: {
        include: {
          room: {
            include: {
              floor: {
                include: {
                  building: { include: { site: true } },
                },
              },
            },
          },
        },
      },
      contract: true,
    },
    orderBy: [
      { asset: { room: { floor: { building: { site: { name: 'asc' } } } } } },
      { asset: { qrCode: 'asc' } },
    ],
  })

  if (schedules.length === 0) {
    return { success: true, created: 0, workOrders: 0 }
  }

  // Group by site (1 WorkOrder ต่อ 1 Site)
  const bySite = new Map<string, typeof schedules>()
  for (const s of schedules) {
    const siteId = s.asset.room.floor.building.siteId
    if (!bySite.has(siteId)) bySite.set(siteId, [])
    bySite.get(siteId)!.push(s)
  }

  let workOrderCount = 0

  await prisma.$transaction(async (tx) => {
    for (const [siteId, siteSchedules] of bySite.entries()) {
      const workOrder = await tx.workOrder.create({
        data: {
          jobType: 'PM',
          status: 'OPEN',
          siteId,
          scheduledDate: now,
        },
      })
      workOrderCount++

      for (const s of siteSchedules) {
        const asset = s.asset

        // เลือก formType ตามประเภททรัพย์สิน
        let formType: string | null = null
        if (asset.assetType === 'EXHAUST') {
          formType = 'EXHAUST_FAN'
        }
        // สำหรับ AIR_CONDITIONER สามารถเพิ่ม mapping ฟอร์มในอนาคตได้ที่นี่

        const jobItem = await tx.jobItem.create({
          data: {
            workOrderId: workOrder.id,
            assetId: s.assetId,
            status: 'PENDING',
            pmScheduleId: s.id,
            techNote: `รอบบำรุงรักษา: ${s.pmType === 'MAJOR' ? 'ล้างใหญ่' : 'ล้างย่อย'} (รอบที่ ${s.roundIndex})`,
            checklist: formType ? JSON.stringify({ formType, data: {} }) : null,
          },
        })

        await tx.pMSchedule.update({
          where: { id: s.id },
          data: {
            status: 'DISPATCHED',
          },
        })
      }
    }
  })

  revalidatePath('/work-orders')

  logSecurityEvent('PM_AUTO_DISPATCH', {
    userId: user.id,
    username: user.username,
    description: `Auto-dispatched ${schedules.length} PM schedules into ${workOrderCount} work orders (refDate=${refDate || now.toISOString()}).`,
  })

  return { success: true, created: schedules.length, workOrders: workOrderCount }
}
