'use server'

import { prisma } from "@/lib/prisma"
import {
  hasPmChecklistCustomerSignature,
  inferPmReportFormType,
  jobItemRequiresCustomerSignatureInChecklist,
  mergeCustomerSignatureIntoPmChecklist,
} from '@/lib/pm-customer-signature'
import {
  CLIENT_SIGN_REQUEST_TITLE,
  TECH_SIGN_COMPLETE_TITLE,
} from '@/lib/pm-signature-notifications'
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { sanitizeString } from "@/lib/validation"
import { requireAdmin } from "@/lib/auth-helpers"
import { logSecurityEvent } from "@/lib/security"
import { handleServerActionError } from "@/lib/error-handler"
import { getCurrentUser } from "@/lib/auth"
import { generateWorkOrderNumber, getWorkOrderDisplayNumber } from "@/lib/work-order-number"

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
      redirect(`/work-orders/${workOrder.id}`)
    }

    if (assetIds.length === 0) {
      throw new Error('At least one asset is required')
    }

    let adHocPmType: 'MAJOR' | 'MINOR' | undefined
    if (jobType === 'PM') {
      if (!pmWashRaw || !['MAJOR', 'MINOR'].includes(pmWashRaw)) {
        throw new Error('กรุณาเลือกประเภทการล้าง PM (ล้างใหญ่ / ล้างย่อย)')
      }
      adHocPmType = pmWashRaw as 'MAJOR' | 'MINOR'
    }

    const formTemplateSanitized = sanitizeString(formTemplate)
    const allowedPmCmForms = ['AIRBORNE_INFECTION', 'EXHAUST_FAN'] as const
    if (jobType === 'PM' || jobType === 'CM') {
      if (!allowedPmCmForms.includes(formTemplateSanitized as (typeof allowedPmCmForms)[number])) {
        throw new Error('กรุณาเลือกแบบฟอร์มบันทึกการทำงาน')
      }
    }

    // สร้าง Work Order
    const workOrder = await prisma.workOrder.create({
      data: {
        siteId,
        jobType,
        scheduledDate,
        assignedTeam: assignedTeamDisplay,
        status: 'OPEN',
        workOrderNumber,
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
    redirect(`/work-orders/${workOrder.id}`)
  } catch (error) {
    await handleServerActionError(error, await getCurrentUser().catch(() => null))
    throw error
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
  try {
    await requireAdmin()

    const workOrderId = sanitizeString(formData.get('workOrderId') as string)
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
    redirect(`/work-orders/${workOrderId}`)
  } catch (error) {
    await handleServerActionError(error, await getCurrentUser().catch(() => null))
    throw error
  }
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
          const technician = await prisma.user.findUnique({ where: { id: technicianId! } })

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

        revalidatePath(`/technician/job-item/${jobItemId}`)
        revalidatePath('/technician')
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

      if (
        user.role === 'TECHNICIAN' &&
        jobItemRequiresCustomerSignatureInChecklist(
          jobItem.workOrder.jobType,
          jobItem.checklist,
          jobItem.asset
        ) &&
        !hasPmChecklistCustomerSignature(jobItem.checklist)
      ) {
        throw new Error(
          'กรุณาให้ลูกค้าเซ็นในรายงานก่อนปิดงาน (กรอกในฟอร์มด้านล่าง หรือส่งลิงก์ให้ลูกค้าเซ็น)'
        )
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
        // ตรวจสอบจาก DB หลังอัปเดตว่า every job item เป็น DONE หรือยัง (ใช้ count เพื่อให้ได้ข้อมูลล่าสุด)
        const [total, doneCount] = await Promise.all([
          prisma.jobItem.count({ where: { workOrderId: jobItem.workOrderId } }),
          prisma.jobItem.count({ where: { workOrderId: jobItem.workOrderId, status: 'DONE' } }),
        ])
        const allDone = total > 0 && total === doneCount

        if (allDone) {
          // Auto-close the work order immediately when all jobs are complete
          await prisma.workOrder.update({
            where: { id: workOrder.id },
            data: { status: 'COMPLETED' },
          })

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
      if (jobItem.technicianId && jobItem.technicianId !== user.id) {
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

/** แจ้ง user CLIENT ของสถานที่ให้เข้าระบบเซ็น PM (ไม่ใช้ลิงก์สาธารณะ) */
export async function notifySiteClientsForPmSignature(jobItemId: string) {
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
        checklist: true,
        asset: { select: { qrCode: true, assetType: true } },
        workOrder: { select: { jobType: true, siteId: true } },
      },
    })

    if (!jobItem) {
      throw new Error('Job Item not found')
    }

    if (user.role === 'TECHNICIAN') {
      if (jobItem.technicianId && jobItem.technicianId !== user.id) {
        throw new Error('Unauthorized')
      }
    } else if (user.role !== 'ADMIN') {
      throw new Error('Unauthorized')
    }

    if (jobItem.status !== 'IN_PROGRESS') {
      throw new Error('แจ้งได้เฉพาะขณะกำลังทำงาน')
    }
    if (
      !jobItemRequiresCustomerSignatureInChecklist(
        jobItem.workOrder.jobType,
        jobItem.checklist,
        jobItem.asset
      )
    ) {
      throw new Error('ใช้ได้เฉพาะงาน PM/CM ที่มีแบบฟอร์มรายงานและต้องมีลายเซ็นลูกค้า')
    }

    const clients = await prisma.user.findMany({
      where: {
        role: 'CLIENT',
        siteId: jobItem.workOrder.siteId,
      },
      select: { id: true },
    })

    if (clients.length === 0) {
      return {
        success: false as const,
        error:
          'ไม่พบบัญชีลูกค้า (CLIENT) ของสถานที่นี้ในระบบ — ให้แอดมินผูก user กับ site ก่อน',
      }
    }

    const base = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const signPath = `/client/pm-sign/${jobItemId}`

    for (const c of clients) {
      await prisma.notification.create({
        data: {
          type: 'MESSAGE_RECEIVED',
          title: CLIENT_SIGN_REQUEST_TITLE,
          message: `มีงานรอลายเซ็นลูกค้า (${jobItem.asset.qrCode}) กรุณาเข้าระบบที่เมนูแจ้งเตือน หรือเปิด ${base.replace(/\/$/, '')}${signPath}`,
          userId: c.id,
          relatedId: jobItemId,
        },
      })
    }

    revalidatePath(`/technician/job-item/${jobItemId}`)
    revalidatePath('/notifications')
    return { success: true as const, notifiedCount: clients.length }
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'ส่งแจ้งเตือนไม่สำเร็จ'
    return { success: false as const, error: msg }
  }
}

/** ลูกค้าเซ็น PM หลังล็อกอิน — site ต้องตรงกับใบงาน */
export async function submitPmCustomerSignatureAsClient(
  jobItemId: string,
  signatureDataUrl: string
) {
  if (
    typeof signatureDataUrl !== 'string' ||
    !signatureDataUrl.startsWith('data:image')
  ) {
    return { success: false as const, error: 'ข้อมูลลายเซ็นไม่ถูกต้อง' }
  }

  const user = await getCurrentUser()
  if (!user || user.role !== 'CLIENT') {
    return { success: false as const, error: 'กรุณาเข้าสู่ระบบในฐานะลูกค้า' }
  }

  const siteId = user.siteId
  if (!siteId) {
    return { success: false as const, error: 'บัญชีลูกค้ายังไม่ผูกสถานที่' }
  }

  const jobItem = await prisma.jobItem.findUnique({
    where: { id: jobItemId },
    select: {
      id: true,
      status: true,
      technicianId: true,
      checklist: true,
      asset: { select: { qrCode: true, assetType: true } },
      workOrder: { select: { jobType: true, siteId: true } },
    },
  })

  if (!jobItem || jobItem.status !== 'IN_PROGRESS') {
    return { success: false as const, error: 'งานนี้ปิดแล้วหรือไม่พร้อมรับลายเซ็น' }
  }

  if (
    !jobItemRequiresCustomerSignatureInChecklist(
      jobItem.workOrder.jobType,
      jobItem.checklist,
      jobItem.asset
    )
  ) {
    return {
      success: false as const,
      error: 'งานนี้ไม่รองรับการเซ็นลูกค้าแบบนี้หรือยังไม่พร้อม',
    }
  }

  if (jobItem.workOrder.siteId !== siteId) {
    return { success: false as const, error: 'คุณไม่มีสิทธิ์เซ็นงานของสถานที่นี้' }
  }

  const formType = inferPmReportFormType(jobItem.checklist, jobItem.asset)
  if (formType !== 'EXHAUST_FAN' && formType !== 'AIRBORNE_INFECTION') {
    return { success: false as const, error: 'ประเภทฟอร์มไม่รองรับ' }
  }

  const newChecklist = mergeCustomerSignatureIntoPmChecklist(
    jobItem.checklist,
    formType,
    signatureDataUrl
  )

  await prisma.jobItem.update({
    where: { id: jobItem.id },
    data: { checklist: newChecklist },
  })

  if (jobItem.technicianId) {
    await prisma.notification.create({
      data: {
        type: 'MESSAGE_RECEIVED',
        title: TECH_SIGN_COMPLETE_TITLE,
        message: `ลูกค้าได้ลงลายเซ็นในรายงานแล้ว (${jobItem.asset.qrCode}) คุณสามารถกดปิดงานได้`,
        userId: jobItem.technicianId,
        relatedId: jobItem.id,
      },
    })
  }

  revalidatePath(`/technician/job-item/${jobItem.id}`)
  revalidatePath(`/reports/job/${jobItem.id}`)
  revalidatePath(`/client/pm-sign/${jobItem.id}`)
  revalidatePath('/notifications')
  return { success: true as const }
}

export async function createRepairRequest(assetId: string, description: string, requesterUserId: string, sourceJobItemId?: string) {
  try {
    const user = await getCurrentUser()
    if (!user) throw new Error('Unauthorized')

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
