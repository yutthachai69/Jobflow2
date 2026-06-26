'use server'

import { prisma } from "@/lib/prisma"
import type { Prisma } from "@prisma/client"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { sanitizeString } from "@/lib/validation"
import { requireAdmin } from "@/lib/auth-helpers"
import { logSecurityEvent } from "@/lib/security"
import { handleServerActionError } from "@/lib/error-handler"
import { getCurrentUser } from "@/lib/auth"
import { generateWorkOrderNumber, getWorkOrderDisplayNumber } from "@/lib/work-order-number"
import { syncWorkOrderStatusFromJobItems } from "@/lib/sync-work-order-status"

// Function to find potential duplicate work orders
async function findPotentialDuplicates(
  siteId: string,
  jobType: 'PM' | 'CM' | 'INSTALL',
  assetIds: string[],
  scheduledDate: Date,
  pmWashType?: 'MAJOR' | 'MINOR'
) {
  const conditions: Prisma.WorkOrderWhereInput[] = []
  
  if (jobType === 'PM') {
    // PM duplicate rule: same site + same calendar month + overlapping selected assets + same PM wash type
    const startOfMonth = new Date(scheduledDate.getFullYear(), scheduledDate.getMonth(), 1)
    const endOfMonth = new Date(scheduledDate.getFullYear(), scheduledDate.getMonth() + 1, 0, 23, 59, 59)
    if (!pmWashType) return []

    conditions.push({
      jobType: 'PM',
      siteId,
      jobItems: {
        some: {
          assetId: { in: assetIds },
          adHocPmType: pmWashType,
        }
      },
      scheduledDate: {
        gte: startOfMonth,
        lte: endOfMonth,
      },
      status: { not: 'CANCELLED' }
    })
  } else if (jobType === 'CM') {
    // Check for CM with same assets in last 7 days
    const sevenDaysAgo = new Date(scheduledDate.getTime() - 7 * 24 * 60 * 60 * 1000)
    
    conditions.push({
      jobType: 'CM',
      status: { in: ['OPEN', 'IN_PROGRESS'] },
      jobItems: {
        some: {
          assetId: { in: assetIds }
        }
      },
      createdAt: { gte: sevenDaysAgo }
    })
  } else if (jobType === 'INSTALL') {
    // Check for INSTALL with same assets in last 3 days
    const threeDaysAgo = new Date(scheduledDate.getTime() - 3 * 24 * 60 * 60 * 1000)
    
    conditions.push({
      jobType: 'INSTALL',
      status: { not: 'CANCELLED' },
      jobItems: {
        some: {
          assetId: { in: assetIds }
        }
      },
      createdAt: { gte: threeDaysAgo }
    })
  }

  if (conditions.length === 0) return []

  const duplicates = await prisma.workOrder.findMany({
    where: {
      OR: conditions
    },
    include: {
      site: {
        select: { name: true }
      },
      jobItems: {
        select: {
          id: true,
          asset: {
            select: { qrCode: true }
          },
          status: true
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  })

  return duplicates
}

export async function createMockMaintenance(assetId: string) {
  try {
    // 1. สร้างใบงาน
    const asset = await prisma.asset.findUnique({
      where: { id: assetId },
      include: {
        room: {
          include: {
            floor: {
              include: {
                building: true,
              },
            },
          },
        },
      },
    })

    if (!asset) {
      throw new Error('Asset not found')
    }

    // สร้างเลขที่งานแบบใหม่ (8vxgpup####)
    const scheduledDate = new Date()
    const workOrderNumber = await generateWorkOrderNumber(scheduledDate)

    const wo = await prisma.workOrder.create({
      data: {
        jobType: 'PM',
        scheduledDate,
        status: 'COMPLETED',
        siteId: asset.room.floor.building.siteId,
        workOrderNumber, // เพิ่ม workOrderNumber
      },
    })

    // 2. สร้างรายการซ่อม (เก็บใส่ตัวแปร job)
    const job = await prisma.jobItem.create({
      data: {
        workOrderId: wo.id,
        assetId: assetId,
        status: 'DONE',
        startTime: new Date(),
        endTime: new Date(),
        techNote: 'ล้างทำความสะอาดแผ่นกรอง คอยล์เย็น และเช็คกระแสไฟเรียบร้อย (Demo with Photos)',
        technicianId: (await prisma.user.findFirst())?.id,
      },
    })

    // 3. (เพิ่มใหม่) สร้างรูปภาพจำลอง Before / After
    await prisma.jobPhoto.createMany({
      data: [
        {
          jobItemId: job.id,
          type: 'BEFORE',
          url: 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=400&q=80',
        },
        {
          jobItemId: job.id,
          type: 'AFTER',
          url: 'https://images.unsplash.com/photo-1581092334651-ddf26d9a09d0?w=400&q=80',
        },
      ],
    })

    // 4. รีเฟรชหน้า
    revalidatePath(`/assets/${assetId}`)
  } catch (error) {
    await handleServerActionError(error, await getCurrentUser().catch(() => null))
    throw error
  }
}

export async function createWorkOrder(formData: FormData) {
  try {
    await requireAdmin()

    const siteId = sanitizeString(formData.get('siteId') as string)
    const jobType = formData.get('jobType') as 'PM' | 'CM' | 'INSTALL'
    const scheduledDateStr = formData.get('scheduledDate') as string
    const assignedTechnicianId = sanitizeString(formData.get('assignedTechnicianId') as string)
    const assetIds = formData.getAll('assetIds') as string[]
    const formTemplate = formData.get('formTemplate') as string
    const pmWashRaw = sanitizeString(formData.get('pmWashType') as string)

    // Validation
    if (!siteId) {
      throw new Error('Site ID is required')
    }
    if (!jobType || !['PM', 'CM', 'INSTALL'].includes(jobType)) {
      throw new Error('Invalid job type')
    }
    if (!scheduledDateStr) {
      throw new Error('Scheduled date is required')
    }

    const scheduledDate = new Date(scheduledDateStr)
    if (isNaN(scheduledDate.getTime())) {
      throw new Error('Invalid date format')
    }

    // สร้างเลขที่งาน
    const workOrderNumber = await generateWorkOrderNumber(scheduledDate)

    let assignedTeamDisplay: string | null = null
    if (assignedTechnicianId) {
      const tech = await prisma.user.findFirst({
        where: { id: assignedTechnicianId, role: 'TECHNICIAN' },
        select: { fullName: true, username: true },
      })
      assignedTeamDisplay = tech ? (tech.fullName || tech.username) : null
    }

    if (jobType === 'INSTALL') {
      const newAssetsJson = formData.get('newAssets') as string
      const roomId = sanitizeString(formData.get('roomId') as string)

      if (!newAssetsJson || !roomId) {
        throw new Error('New assets data and room ID are required for INSTALL')
      }

      const newAssets: Array<{ qrCode: string; btu: string }> = JSON.parse(newAssetsJson)
      const validAssets = newAssets.filter((a) => (a.qrCode || '').trim() !== '')

      if (validAssets.length === 0) {
        throw new Error('At least one asset with QR Code is required')
      }

      const workOrder = await prisma.workOrder.create({
        data: {
          workOrderNumber,
          siteId,
          jobType,
          scheduledDate,
          assignedTeam: assignedTeamDisplay,
          status: 'OPEN',
        },
      })

      for (const assetData of validAssets) {
        const qrCode = assetData.qrCode.trim()

        const asset = await prisma.asset.create({
          data: {
            qrCode,
            assetType: 'AIR_CONDITIONER',
            btu: assetData.btu ? parseInt(assetData.btu, 10) : null,
            installDate: scheduledDate,
            roomId,
            status: 'ACTIVE',
          },
        })

        await prisma.jobItem.create({
          data: {
            workOrderId: workOrder.id,
            assetId: asset.id,
            status: 'PENDING',
            technicianId: assignedTechnicianId || undefined,
          },
        })
      }

      revalidatePath('/work-orders')
      revalidatePath('/assets')
      return { success: true as const, workOrderId: workOrder.id }
    }

    if (assetIds.length === 0) {
      throw new Error('At least one asset is required')
    }

    const formTemplateSanitized = sanitizeString(formTemplate)
    const allowedPmCmForms = ['AIRBORNE_INFECTION', 'EXHAUST_FAN'] as const
    if (jobType === 'PM' || jobType === 'CM') {
      if (!allowedPmCmForms.includes(formTemplateSanitized as (typeof allowedPmCmForms)[number])) {
        throw new Error('Please select a work form template')
      }
    }

    let adHocPmType: 'MAJOR' | 'MINOR' | undefined
    if (jobType === 'PM') {
      if (!pmWashRaw || !['MAJOR', 'MINOR'].includes(pmWashRaw)) {
        throw new Error('กรุณาเลือกประเภทการล้าง PM (ล้างใหญ่ / ล้างย่อย)')
      }
      adHocPmType = pmWashRaw as 'MAJOR' | 'MINOR'
    }

    // Check for potential duplicates
    const potentialDuplicates = await findPotentialDuplicates(siteId, jobType, assetIds, scheduledDate, adHocPmType)
    
    // Check if user wants to force create despite duplicates
    const forceCreate = formData.get('forceCreate') === 'true'
    const duplicateOfIdRaw = sanitizeString((formData.get('duplicateOfId') as string) || '')
    const duplicateOfId = duplicateOfIdRaw || (forceCreate && potentialDuplicates.length > 0 ? potentialDuplicates[0].id : null)
    
    // PM duplicates คือ hard-block เสมอ (forceCreate ไม่มีผล)
    if (jobType === 'PM' && potentialDuplicates.length > 0) {
      return {
        success: false as const,
        duplicateBlocked: true as const,
        pmHardBlock: true as const, // บอก UI ว่าไม่มี override — ไม่ต้องแสดงปุ่ม Force Create
        error: 'มีใบงาน PM ซ้ำแล้วสำหรับเครื่องนี้ในเดือนเดียวกันและประเภทล้างเดียวกัน (ไม่สามารถสร้างซ้ำได้)',
      }
    }

    if (potentialDuplicates.length > 0 && !forceCreate) {
      // Return duplicates for confirmation instead of throwing error
      return {
        requiresConfirmation: true,
        duplicates: potentialDuplicates,
        message: `Found ${potentialDuplicates.length} potential duplicate work order(s)`,
        details: potentialDuplicates.map((wo: any) => ({
          id: wo.id,
          workOrderNumber: wo.workOrderNumber,
          jobType: wo.jobType,
          status: wo.status,
          siteName: wo.site?.name || 'Unknown Site',
          scheduledDate: wo.scheduledDate,
          assets: wo.jobItems?.map((item: any) => item.asset?.qrCode || '').join(', ') || ''
        }))
      }
    }

    //  Create Work Order
    const workOrder = await prisma.workOrder.create({
      data: {
        siteId,
        jobType,
        scheduledDate,
        assignedTeam: assignedTeamDisplay,
        status: 'OPEN',
        workOrderNumber,
        duplicateOfId: duplicateOfId || null,
      },
    })

    // สร้าง Job Items สำหรับแต่ละ Asset (มอบหมายช่างถ้าเลือกไว้)
    await prisma.jobItem.createMany({
      data: assetIds.map((assetId) => ({
        workOrderId: workOrder.id,
        assetId,
        status: 'PENDING',
        technicianId: assignedTechnicianId || undefined,
        checklist:
          jobType === 'PM' || jobType === 'CM'
            ? JSON.stringify({ formType: formTemplateSanitized, data: {} })
            : null,
        adHocPmType: jobType === 'PM' ? adHocPmType : undefined,
      })),
    })

    revalidatePath('/work-orders')
    return { success: true as const, workOrderId: workOrder.id }
  } catch (error) {
    if (
      typeof error === 'object' &&
      error !== null &&
      (
        (error as { message?: string }).message === 'NEXT_REDIRECT' ||
        (typeof (error as { digest?: string }).digest === 'string' && (error as { digest?: string }).digest!.includes('NEXT_REDIRECT'))
      )
    ) {
      throw error
    }

    const errorMessage = error instanceof Error ? error.message : String(error)
    const isDuplicatePmError = errorMessage.includes('PM_DUPLICATE_ASSET_MONTH_TYPE')
    if (isDuplicatePmError) {
      return {
        success: false as const,
        duplicateBlocked: true as const,
        error: 'มีใบงาน PM ซ้ำแล้วสำหรับเครื่องนี้ในเดือนเดียวกันและประเภทล้างเดียวกัน',
      }
    }

    await handleServerActionError(error, await getCurrentUser().catch(() => null))
    const userFacingMessage = error instanceof Error ? error.message : 'ไม่สามารถสร้างใบงานได้'
    return {
      success: false as const,
      error: userFacingMessage || 'ไม่สามารถสร้างใบงานได้',
    }
  }
}

export async function updateWorkOrderStatus(workOrderId: string, status: 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED') {
  await requireAdmin()

  await prisma.workOrder.update({
    where: { id: workOrderId },
    data: { status },
  })

  revalidatePath(`/work-orders/${workOrderId}`)
  revalidatePath('/work-orders')
  revalidatePath('/')
}

export async function updateWorkOrder(formData: FormData) {
  let workOrderId = ''

  try {
    await requireAdmin()

    workOrderId = sanitizeString(formData.get('workOrderId') as string) || ''
    const siteId = sanitizeString(formData.get('siteId') as string)
    const jobType = formData.get('jobType') as 'PM' | 'CM' | 'INSTALL'
    const scheduledDateStr = formData.get('scheduledDate') as string
    const assignedTechnicianId = sanitizeString(formData.get('assignedTechnicianId') as string)

    // Validation
    if (!workOrderId) {
      throw new Error('Work Order ID is required')
    }
    if (!siteId) {
      throw new Error('Site ID is required')
    }
    if (!jobType || !['PM', 'CM', 'INSTALL'].includes(jobType)) {
      throw new Error('Invalid job type')
    }
    if (!scheduledDateStr) {
      throw new Error('Scheduled date is required')
    }

    const scheduledDate = new Date(scheduledDateStr)
    if (isNaN(scheduledDate.getTime())) {
      throw new Error('Invalid date format')
    }

    let assignedTeamDisplay: string | null = null
    if (assignedTechnicianId) {
      const tech = await prisma.user.findFirst({
        where: { id: assignedTechnicianId, role: 'TECHNICIAN' },
        select: { fullName: true, username: true },
      })
      assignedTeamDisplay = tech ? (tech.fullName || tech.username) : null
    }

    await prisma.workOrder.update({
      where: { id: workOrderId },
      data: {
        siteId,
        jobType,
        scheduledDate,
        assignedTeam: assignedTeamDisplay,
      },
    })

    await prisma.jobItem.updateMany({
      where: { workOrderId },
      data: { technicianId: assignedTechnicianId || null },
    })

    revalidatePath(`/work-orders/${workOrderId}`)
    revalidatePath('/work-orders')
  } catch (error) {
    await handleServerActionError(error, await getCurrentUser().catch(() => null))
    throw error
  }

  redirect(`/work-orders/${workOrderId}`)
}

export async function deleteWorkOrder(workOrderId: string, force?: boolean) {
  try {
    await requireAdmin()

    // Check if work order exists
    const workOrder = await prisma.workOrder.findUnique({
      where: { id: workOrderId },
      include: {
        jobItems: {
          include: {
            photos: true,
          },
        },
      },
    })

    if (!workOrder) {
      throw new Error('Work Order not found')
    }

    // Check if work order has job items with DONE status
    const hasCompletedJobs = workOrder.jobItems.some((job) => job.status === 'DONE')
    if (hasCompletedJobs && !force) {
      return { success: false as const, error: 'CONFIRM_DELETE_COMPLETED' }
    }

    // Delete job items (and their photos) first
    for (const jobItem of workOrder.jobItems) {
      await prisma.jobPhoto.deleteMany({
        where: { jobItemId: jobItem.id },
      })
    }
    await prisma.jobItem.deleteMany({
      where: { workOrderId },
    })

    // Delete work order
    await prisma.workOrder.delete({
      where: { id: workOrderId },
    })

    revalidatePath('/work-orders')
  } catch (error) {
    await handleServerActionError(error, await getCurrentUser().catch(() => null))
    const message = error instanceof Error ? error.message : String(error)
    return { success: false as const, error: message }
  }
  return { success: true as const }
}

export async function assignTechnicianToJobItem(jobItemId: string, technicianId: string | null) {
  try {
    await requireAdmin()

    await prisma.jobItem.update({
      where: { id: jobItemId },
      data: { technicianId },
    })

    revalidatePath(`/work-orders`)

    // Send LINE Notification to Requester (Client)
    try {
      // Find the work order and its creator/requester to get lineUserId
      const jobItem = await prisma.jobItem.findUnique({
        where: { id: jobItemId },
        select: {
          technicianId: true,
          workOrderId: true,
          asset: { select: { qrCode: true } },
        },
      })

      if (jobItem && jobItem.technicianId) {
        // Find the requester (User who created the CM, or site owner)
        // For CM, usually we track who requested. If not tracked directly on WO, we might notifying all site users?
        // Let's assume we notify all Site Users for now, or if we have `createdById` on WO (we don't seems to have it in this file context, but `createRepairRequest` takes `requesterUserId`)
        // The `createRepairRequest` doesn't save `requesterUserId` to DB in the code I saw earlier? 
        // Wait, `createRepairRequest` creates WO but doesn't seem to link user? 
        // Ah, `userId` is passed to `createRepairRequest` but in the `data` user is not connected?
        // Let's look at `createRepairRequest` again...
        // ... `assignedTeam: null` ... no `createdBy`.
        // BUT, we can notify all CLIENTs at the Site.

        const workOrder = await prisma.workOrder.findUnique({
          where: { id: jobItem.workOrderId },
          include: {
            site: {
              include: {
                users: { where: { role: 'CLIENT' } }
              }
            }
          }
        })

        if (workOrder && workOrder.site.users.length > 0) {
          const { sendLineMessage, createNotificationFlexMessage } = await import('@/app/lib/line-messaging')
          // ใช้ค่าจาก DB (jobItem.technicianId) แทน parameter เพื่อหลีกเลี่ยง non-null assertion bug
          const technician = await prisma.user.findUnique({ where: { id: jobItem.technicianId! } })

          const message = createNotificationFlexMessage({
            title: '👷 มอบหมายช่างแล้ว',
            message: `ช่าง ${technician?.fullName || 'ทีมงาน'} กำลังเดินทางเข้าตรวจสอบ`,
            details: [
              { label: 'ใบงาน', value: workOrder.workOrderNumber || '' },
              { label: 'สินทรัพย์', value: jobItem.asset?.qrCode || '' }
            ],
            actionUrl: `${process.env.NEXT_PUBLIC_APP_URL}/work-orders/${workOrder.id}`,
            color: '#06C755' // Green
          })

          await Promise.all(workOrder.site.users
            .filter(u => u.lineUserId)
            .map(u => sendLineMessage(u.lineUserId!, message))
          )
        }
      }
    } catch (error) {
      console.error('Failed to send LINE notification:', error)
    }
  } catch (error) {
    await handleServerActionError(error, await getCurrentUser().catch(() => null))
    throw error
  }
}

export async function updateJobItemStatus(jobItemId: string, status: 'PENDING' | 'IN_PROGRESS' | 'DONE' | 'ISSUE_FOUND') {
  try {
    const user = await getCurrentUser()
    if (!user) {
      throw new Error('Unauthorized')
    }

    const jobItem = await prisma.jobItem.findUnique({
      where: { id: jobItemId },
      select: {
        id: true,
        status: true,
        technicianId: true,
        workOrderId: true,
        startTime: true,
        endTime: true,
        checklist: true,
        technician: {
          select: { fullName: true, username: true },
        },
        photos: { select: { id: true, type: true, url: true } },
        asset: { select: { qrCode: true, assetType: true } },
        workOrder: { select: { jobType: true } },
      },
    })

    if (!jobItem) {
      throw new Error('Job Item not found')
    }

    // Authorization: TECHNICIAN can only update their own assigned jobs or unassigned jobs
    if (user.role === 'TECHNICIAN') {
      if (jobItem.technicianId && jobItem.technicianId !== user.id) {
        throw new Error('Unauthorized')
      }
      // Auto-assign if unassigned
      if (!jobItem.technicianId && status === 'IN_PROGRESS') {
        await prisma.jobItem.update({
          where: { id: jobItemId },
          data: {
            technicianId: user.id,
            status,
            startTime: new Date(),
            endTime: jobItem.endTime,
          },
        })

        // Send LINE Notification (Technician Assigned / Job Started)
        try {
          const workOrder = await prisma.workOrder.findUnique({
            where: { id: jobItem.workOrderId },
            include: { site: { include: { users: { where: { role: 'CLIENT' } } } } }
          })

          if (workOrder && workOrder.site.users.length > 0) {
            const { sendLineMessage, createNotificationFlexMessage } = await import('@/app/lib/line-messaging')

            const message = createNotificationFlexMessage({
              title: '🔧 ช่างเริ่มดำเนินการ',
              message: `ช่าง ${jobItem.technician?.fullName || user.username || 'ทีมงาน'} รับงานและเริ่มดำเนินการแล้ว`,
              details: [
                { label: 'ใบงาน', value: workOrder.workOrderNumber || '' },
                { label: 'สินทรัพย์', value: jobItem.asset?.qrCode || '' }
              ],
              actionUrl: `${process.env.NEXT_PUBLIC_APP_URL}/work-orders/${workOrder.id}`,
              color: '#00B900'
            })

            await Promise.all(workOrder.site.users
              .filter(u => u.lineUserId)
              .map(u => sendLineMessage(u.lineUserId!, message))
            )
          }
        } catch (e) {
          console.error('Failed to send LINE triggers', e)
        }

        await syncWorkOrderStatusFromJobItems(prisma, jobItem.workOrderId)
        revalidatePath(`/technician/job-item/${jobItemId}`)
        revalidatePath('/technician')
        revalidatePath(`/work-orders/${jobItem.workOrderId}`)
        revalidatePath('/work-orders')
        return
      }
    }

    // For DONE status, require BEFORE and AFTER photos
    if (status === 'DONE') {
      const beforePhotos = jobItem.photos.filter((p) => p.type === 'BEFORE')
      const afterPhotos = jobItem.photos.filter((p) => p.type === 'AFTER')

      if (beforePhotos.length === 0 || afterPhotos.length === 0) {
        throw new Error('ต้องแนบรูปภาพทั้งก่อนและหลังการทำงานก่อนที่จะเสร็จสิ้นงาน')
      }
    }

    await prisma.jobItem.update({
      where: { id: jobItemId },
      data: {
        status,
        startTime: status === 'IN_PROGRESS' ? new Date() : jobItem.startTime,
        endTime: status === 'DONE' ? new Date() : jobItem.endTime,
        technicianId: user.role === 'TECHNICIAN' && !jobItem.technicianId ? user.id : jobItem.technicianId,
      },
    })

    const statusChange = await syncWorkOrderStatusFromJobItems(prisma, jobItem.workOrderId)

    // สร้าง notification สำหรับ CLIENT เมื่องานเสร็จ
    if (status === 'DONE') {
      const workOrder = await prisma.workOrder.findUnique({
        where: { id: jobItem.workOrderId },
        include: {
          site: {
            include: {
              users: {
                where: { role: 'CLIENT' },
              },
            },
          },
          jobItems: {
            where: {
              status: 'DONE',
            },
            include: {
              photos: true
            }
          },
        },
      })

      if (workOrder) {
        const justCompleted =
          statusChange?.next === 'COMPLETED' && statusChange.previous !== 'COMPLETED'

        if (justCompleted) {
          // ถ้าทุกงานเสร็จแล้ว สร้าง notification สำหรับ CLIENT
          if (workOrder.site.users.length > 0) {
            for (const client of workOrder.site.users) {
              await prisma.notification.create({
                data: {
                  type: 'WORK_ORDER_COMPLETED',
                  title: 'งานเสร็จสมบูรณ์',
                  message: `งานเลขที่ ${getWorkOrderDisplayNumber(workOrder)} เสร็จสมบูรณ์แล้ว กรุณาให้คะแนนความพึงพอใจ`,
                  userId: client.id,
                  relatedId: workOrder.id,
                },
              })
            }

            // Send LINE Notification to Clients
            try {
              const { sendLineMessage, createNotificationFlexMessage } = await import('@/app/lib/line-messaging')

              const message = createNotificationFlexMessage({
                title: '✅ งานซ่อมเสร็จสมบูรณ์',
                message: `งานเลขที่ ${getWorkOrderDisplayNumber(workOrder)} ดำเนินการเรียบร้อยแล้ว`,
                details: [
                  { label: 'สถานที่', value: workOrder.site.name },
                  { label: 'สินทรัพย์', value: jobItem.asset?.qrCode || '' }
                ],
                actionUrl: `${process.env.NEXT_PUBLIC_APP_URL}/work-orders/${workOrder.id}`,
                imageUrl: workOrder.jobItems[0]?.photos?.find(p => p.type === 'AFTER')?.url,
                color: '#06C755' // Green
              })

              console.log(`Sending completion LINE to ${workOrder.site.users.length} clients`)
              await Promise.all(workOrder.site.users
                .filter(u => u.lineUserId)
                .map(u => sendLineMessage(u.lineUserId!, message))
              )
            } catch (error) {
              console.error('Failed to send LINE completion notification:', error)
            }
          }
        }
      }
    }

    revalidatePath(`/technician/job-item/${jobItemId}`)
    revalidatePath('/technician')
    revalidatePath('/work-orders')
    revalidatePath(`/work-orders/${jobItem.workOrderId}`)
  } catch (error) {
    await handleServerActionError(error, await getCurrentUser().catch(() => null))
    throw error
  }
}

export async function deleteJobPhoto(photoId: string) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      throw new Error('Unauthorized')
    }

    const photo = await prisma.jobPhoto.findUnique({
      where: { id: photoId },
      include: {
        jobItem: {
          include: {
            technician: true,
            workOrder: true,
          },
        },
      },
    })

    if (!photo) {
      throw new Error('Photo not found')
    }

    // Authorization: Only TECHNICIAN assigned to this job or ADMIN can delete photos
    if (user.role === 'TECHNICIAN') {
      if (!photo.jobItem.technicianId || photo.jobItem.technicianId !== user.id) {
        throw new Error('Unauthorized')
      }
      // Cannot delete photos if job is DONE
      if (photo.jobItem.status === 'DONE') {
        throw new Error('Cannot delete photos from completed job')
      }
    }

    await prisma.jobPhoto.delete({
      where: { id: photoId },
    })

    const { logSecurityEvent } = await import('@/lib/security')
    logSecurityEvent('JOB_PHOTO_DELETED', {
      deletedBy: user.id,
      photoId,
      jobItemId: photo.jobItemId,
      timestamp: new Date().toISOString(),
    })

    revalidatePath(`/technician/job-item/${photo.jobItemId}`)
    revalidatePath(`/work-orders/${photo.jobItem.workOrderId}`)
  } catch (error) {
    await handleServerActionError(error, await getCurrentUser().catch(() => null))
    throw error
  }
}

export async function createJobPhoto(jobItemId: string, formData: FormData) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      throw new Error('Unauthorized')
    }

    const photoUrl = formData.get('photoUrl') as string
    const photoType = formData.get('photoType') as 'BEFORE' | 'AFTER' | 'DEFECT' | 'METER'

    if (!photoUrl) {
      throw new Error('Photo URL is required')
    }
    if (!photoType || !['BEFORE', 'AFTER', 'DEFECT', 'METER'].includes(photoType)) {
      throw new Error('Invalid photo type')
    }

    const jobItem = await prisma.jobItem.findUnique({
      where: { id: jobItemId },
      select: {
        technicianId: true,
        status: true,
        workOrderId: true,
      },
    })

    if (!jobItem) {
      throw new Error('Job Item not found')
    }

    // Authorization: Only TECHNICIAN assigned to this job or ADMIN can add photos
    if (user.role === 'TECHNICIAN') {
      if (jobItem.technicianId !== null && jobItem.technicianId !== user.id) {
        throw new Error('Unauthorized')
      }
      // ต้องเริ่มงานก่อนจึงจะอัปโหลดรูปได้
      if (jobItem.status === 'PENDING') {
        throw new Error('กรุณากดเริ่มงานก่อนจึงจะอัปโหลดรูปได้')
      }
      if (jobItem.status === 'DONE') {
        throw new Error('Cannot add photos to completed job')
      }
    }

    await prisma.jobPhoto.create({
      data: {
        jobItemId,
        url: photoUrl,
        type: photoType,
      },
    })

    const { logSecurityEvent } = await import('@/lib/security')
    logSecurityEvent('JOB_PHOTO_UPLOADED', {
      uploadedBy: user.id,
      jobItemId,
      photoType,
      timestamp: new Date().toISOString(),
    })

    revalidatePath(`/technician/job-item/${jobItemId}`)
    revalidatePath(`/technician/work-order/${jobItem.workOrderId}`)
    revalidatePath(`/work-orders/${jobItem.workOrderId}`)
  } catch (error) {
    await handleServerActionError(error, await getCurrentUser().catch(() => null))
    throw error
  }
}

export async function updateJobItemNote(jobItemId: string, formData: FormData) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      throw new Error('Unauthorized')
    }

    const techNote = sanitizeString(formData.get('techNote') as string)

    const jobItem = await prisma.jobItem.findUnique({
      where: { id: jobItemId },
      select: {
        technicianId: true,
        status: true,
      },
    })

    if (!jobItem) {
      throw new Error('Job Item not found')
    }

    // Authorization: Only TECHNICIAN assigned to this job or ADMIN can update notes
    if (user.role === 'TECHNICIAN') {
      // Allow if job item is unassigned (null) or assigned to this technician
      if (jobItem.technicianId !== null && jobItem.technicianId !== user.id) {
        throw new Error('Unauthorized')
      }
      // ต้องเริ่มงานก่อนจึงจะบันทึกได้
      if (jobItem.status === 'PENDING') {
        throw new Error('กรุณากดเริ่มงานก่อนจึงจะบันทึกได้')
      }
      if (jobItem.status === 'DONE') {
        throw new Error('Cannot update notes on completed job')
      }
      // Auto-assign technician if not assigned
      if (jobItem.technicianId === null) {
        await prisma.jobItem.update({
          where: { id: jobItemId },
          data: { technicianId: user.id },
        })
      }
    }

    await prisma.jobItem.update({
      where: { id: jobItemId },
      data: {
        techNote: techNote || null,
      },
    })

    revalidatePath(`/technician/job-item/${jobItemId}`)
  } catch (error) {
    await handleServerActionError(error, await getCurrentUser().catch(() => null))
    throw error
  }
}

export async function updateJobItemChecklist(jobItemId: string, checklistJson: string) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      throw new Error('Unauthorized')
    }

    const jobItem = await prisma.jobItem.findUnique({
      where: { id: jobItemId },
      select: {
        id: true,
        status: true,
        technicianId: true,
        workOrderId: true,
      },
    })

    if (!jobItem) {
      throw new Error('Job Item not found')
    }

    // Authorization
    if (user.role === 'TECHNICIAN') {
      // ต้อง assign ให้ตัวเองก่อนถึงจะแก้ได้ (null = unassigned = ไม่มีสิทธิ์)
      if (jobItem.technicianId !== user.id) {
        throw new Error('Unauthorized')
      }
      // ต้องเริ่มงานก่อนจึงจะกรอกฟอร์มได้
      if (jobItem.status === 'PENDING') {
        throw new Error('กรุณากดเริ่มงานก่อนจึงจะกรอกฟอร์มได้')
      }
      if (jobItem.status === 'DONE') {
        throw new Error('Cannot update checklist on completed job')
      }
    }

    await prisma.jobItem.update({
      where: { id: jobItemId },
      data: {
        checklist: checklistJson
      }
    })

    revalidatePath(`/work-orders/${jobItem.workOrderId}`)
    revalidatePath(`/technician/job-item/${jobItemId}`)
    revalidatePath(`/reports/job/${jobItemId}`)
    return { success: true }
  } catch (error) {
    console.error('Error updating checklist:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Failed to update checklist' }
  }
}

export async function createRepairRequest(assetId: string, description: string, requesterUserId: string, sourceJobItemId?: string) {
  try {
    const user = await getCurrentUser()
    if (!user) throw new Error('Unauthorized')

    // ป้องกัน notification spoofing: non-admin ต้องใช้ userId ของตัวเองเท่านั้น
    if (user.role !== 'ADMIN' && requesterUserId !== user.id) {
      throw new Error('Unauthorized: requesterUserId mismatch')
    }

    // Check if asset exists and get site info
    const asset = await prisma.asset.findUnique({
      where: { id: assetId },
      include: {
        room: {
          include: {
            floor: {
              include: {
                building: true
              }
            }
          }
        }
      }
    })

    if (!asset) throw new Error('Asset not found')

    // Generate Work Order Number
    const scheduledDate = new Date()
    const workOrderNumber = await generateWorkOrderNumber(scheduledDate)

    // Create CM Work Order
    const workOrder = await prisma.workOrder.create({
      data: {
        workOrderNumber,
        jobType: 'CM', // Corrective Maintenance
        status: 'OPEN',
        scheduledDate,
        siteId: asset.room.floor.building.siteId,
        assignedTeam: null, // To be assigned by Admin
        sourceJobItem: sourceJobItemId ? { connect: { id: sourceJobItemId } } : undefined,
        jobItems: {
          create: {
            assetId: assetId,
            status: 'PENDING',
            techNote: description, // Initial issue description
            // technicianId is left null for Admin to assign
          }
        }
      }
    })

    // Send LINE Notification
    try {
      const { sendLineMessage } = await import('@/app/lib/line-messaging')
      const adminGroupId = process.env.LINE_ADMIN_URI_ID

      if (adminGroupId) {
        const message = `🚨 มีการแจ้งซ่อมใหม่ (New Repair Request)\n\n` +
          `เลขที่: ${workOrderNumber}\n` +
          `สินทรัพย์: ${asset.qrCode}\n` +
          `สถานที่: ${asset.room.name} (${asset.room.floor.building.name})\n` +
          `อาการ: ${description}\n\n` +
          `กรุณาตรวจสอบและดำเนินการ: ${process.env.NEXT_PUBLIC_APP_URL}/work-orders/${workOrder.id}`

        await sendLineMessage(adminGroupId, { type: 'text', text: message })
      }

      // Notify Requester (Client)
      const requester = await prisma.user.findUnique({ where: { id: requesterUserId } })
      if (requester?.lineUserId) {
        const { createNotificationFlexMessage } = await import('@/app/lib/line-messaging')
        const clientMessage = createNotificationFlexMessage({
          title: 'รับเรื่องแจ้งซ่อมแล้ว',
          message: `ใบงานเลขที่ ${workOrderNumber}`,
          details: [
            { label: 'สินทรัพย์', value: asset.qrCode },
            { label: 'สถานที่', value: asset.room.name }
          ],
          actionUrl: `${process.env.NEXT_PUBLIC_APP_URL}/work-orders/${workOrder.id}`,
          color: '#06C755'
        })
        await sendLineMessage(requester.lineUserId, clientMessage)
      }
    } catch (error) {
      console.error('Failed to send LINE notification:', error)
      // Don't fail the request if notification fails
    }

    revalidatePath('/work-orders')
    if (sourceJobItemId) {
      revalidatePath(`/technician/job-item/${sourceJobItemId}`)
    }
    return { success: true, workOrderId: workOrder.id, workOrderNumber }
  } catch (error) {
    console.error('Error creating repair request:', error)
    return { success: false, error: 'Failed to create repair request' }
  }
}

export async function deleteJobItem(jobItemId: string) {
  try {
    const user = await requireAdmin()

    // Find the JobItem
    const jobItem = await prisma.jobItem.findUnique({
      where: { id: jobItemId },
      include: { 
        photos: true, 
        workOrder: { include: { jobItems: true } } 
      },
    })

    if (!jobItem) {
      throw new Error('Job Item not found')
    }

    // ครอบทุก delete ใน transaction เดียว เพื่อป้องกัน inconsistent state
    await prisma.$transaction(async (tx) => {
      // Reset PMSchedule status if it's linked
      if (jobItem.pmScheduleId) {
        await tx.pMSchedule.update({
          where: { id: jobItem.pmScheduleId },
          data: { status: 'PLANNED' }
        })
      }

      // Delete related photos first
      await tx.jobPhoto.deleteMany({
        where: { jobItemId: jobItem.id },
      })

      // Delete the JobItem itself
      await tx.jobItem.delete({
        where: { id: jobItemId },
      })

      // If this was the last JobItem in the WorkOrder, delete the WorkOrder to keep DB clean
      if (jobItem.workOrder && jobItem.workOrder.jobItems.length === 1) {
        await tx.workOrder.delete({
          where: { id: jobItem.workOrderId }
        })
      }
    })

    // Revalidate paths so the history updates
    revalidatePath(`/assets/${jobItem.assetId}`)
    revalidatePath('/work-orders')

    return { success: true }
  } catch (error) {
    await handleServerActionError(error, await getCurrentUser().catch(() => null))
    const message = error instanceof Error ? error.message : String(error)
    return { success: false, error: message }
  }
}

export async function createAdHocRepair(formData: FormData) {
  let workOrderId = ''

  try {
    await requireAdmin()

    const siteId = sanitizeString(formData.get('siteId') as string)
    const repairType = formData.get('repairType') as string
    const locationDescription = sanitizeString(formData.get('locationDescription') as string)
    const problemDescription = sanitizeString(formData.get('problemDescription') as string)
    const scheduledDateStr = formData.get('scheduledDate') as string
    const technicianId = formData.get('technicianId') as string
    const reportType = formData.get('reportType') as string

    if (!siteId) throw new Error('Site is required')
    if (!repairType) throw new Error('Repair type is required')
    if (!locationDescription) throw new Error('Location is required')
    if (!problemDescription) throw new Error('Problem description is required')
    if (!scheduledDateStr) throw new Error('Scheduled date is required')
    if (!technicianId) throw new Error('Technician is required')
    if (!reportType) throw new Error('Report type is required')

    const scheduledDate = new Date(scheduledDateStr)
    if (isNaN(scheduledDate.getTime())) {
      throw new Error('Invalid date format')
    }

    const workOrderNumber = await generateWorkOrderNumber(scheduledDate)
    const user = await getCurrentUser()

    // หา room ใด ๆ ของ site นี้ เพื่อสร้าง temporary asset
    const site = await prisma.site.findUnique({
      where: { id: siteId },
      include: {
        buildings: {
          include: {
            floors: {
              include: {
                rooms: { take: 1 },
              },
              take: 1,
            },
          },
          take: 1,
        },
      },
    })

    if (!site || !site.buildings[0]?.floors[0]?.rooms[0]) {
      throw new Error('Site ต้องมีห้องอย่างน้อย 1 ห้อง')
    }

    const roomId = site.buildings[0].floors[0].rooms[0].id

    // สร้าง temporary asset สำหรับ ad-hoc repair
    const tempAsset = await prisma.asset.create({
      data: {
        qrCode: `AD-HOC-${Date.now()}`,
        assetType: 'TOOL',
        roomId,
        status: 'ACTIVE',
      },
    })

    const workOrder = await prisma.workOrder.create({
      data: {
        jobType: 'AD_HOC',
        workOrderNumber,
        siteId,
        repairType: repairType as any,
        reportFormType: reportType as any,
        locationDescription,
        problemDescription,
        scheduledDate,
        status: 'OPEN',
        jobItems: {
          create: {
            assetId: tempAsset.id,
            technicianId,
            status: 'PENDING',
          },
        },
      },
    })

    workOrderId = workOrder.id

    logSecurityEvent('AD_HOC_REPAIR_CREATED', {
      createdBy: user?.id,
      workOrderId,
      timestamp: new Date().toISOString(),
    })

    revalidatePath('/ad-hoc-repairs')
  } catch (error) {
    await handleServerActionError(error, await getCurrentUser().catch(() => null))
    throw error
  }

  if (!workOrderId) throw new Error('Failed to create ad-hoc repair: workOrderId missing')
  redirect(`/ad-hoc-repairs/${workOrderId}`)
}

export async function updateAdHocRepair(formData: FormData) {
  let workOrderId: string

  try {
    await requireAdmin()

    workOrderId = sanitizeString(formData.get('workOrderId') as string) || ""
    const repairType = formData.get('repairType') as string
    const locationDescription = sanitizeString(formData.get('locationDescription') as string)
    const problemDescription = sanitizeString(formData.get('problemDescription') as string)
    const scheduledDateStr = formData.get('scheduledDate') as string

    if (!workOrderId) throw new Error('Work order ID is required')
    if (!repairType) throw new Error('Repair type is required')
    if (!locationDescription) throw new Error('Location is required')
    if (!problemDescription) throw new Error('Problem description is required')
    if (!scheduledDateStr) throw new Error('Scheduled date is required')

    const scheduledDate = new Date(scheduledDateStr)
    if (isNaN(scheduledDate.getTime())) {
      throw new Error('Invalid date format')
    }

    const workOrder = await prisma.workOrder.findUnique({
      where: { id: workOrderId },
    })

    if (!workOrder || workOrder.jobType !== 'AD_HOC') {
      throw new Error('Ad-hoc repair not found')
    }

    await prisma.workOrder.update({
      where: { id: workOrderId },
      data: {
        repairType: repairType as any,
        locationDescription,
        problemDescription,
        scheduledDate,
      },
    })

    const user = await getCurrentUser()
    logSecurityEvent('AD_HOC_REPAIR_UPDATED', {
      updatedBy: user?.id,
      workOrderId,
      timestamp: new Date().toISOString(),
    })

    revalidatePath('/ad-hoc-repairs')
  } catch (error) {
    await handleServerActionError(error, await getCurrentUser().catch(() => null))
    throw error
  }

  redirect(`/ad-hoc-repairs/${workOrderId}`)
}

export async function deleteAdHocRepair(workOrderId: string) {
  try {
    await requireAdmin()

    const workOrder = await prisma.workOrder.findUnique({
      where: { id: workOrderId },
      include: { jobItems: true },
    })

    if (!workOrder || workOrder.jobType !== 'AD_HOC') {
      throw new Error('Ad-hoc repair not found')
    }

    // Delete JobPhotos first (foreign key constraint)
    await prisma.jobPhoto.deleteMany({
      where: { jobItem: { workOrderId } },
    })

    // Delete JobItems (cascade)
    await prisma.jobItem.deleteMany({
      where: { workOrderId },
    })

    // Delete WorkOrder
    await prisma.workOrder.delete({
      where: { id: workOrderId },
    })

    const user = await getCurrentUser()
    logSecurityEvent('AD_HOC_REPAIR_DELETED', {
      deletedBy: user?.id,
      workOrderId,
      timestamp: new Date().toISOString(),
    })

    revalidatePath('/ad-hoc-repairs')
  } catch (error) {
    await handleServerActionError(error, await getCurrentUser().catch(() => null))
    throw error
  }
}
