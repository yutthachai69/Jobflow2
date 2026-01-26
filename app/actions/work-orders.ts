'use server'

import { prisma } from "@/lib/prisma"
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
    const assignedTeam = sanitizeString(formData.get('assignedTeam') as string)
    const assetIds = formData.getAll('assetIds') as string[]

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
    if (assetIds.length === 0) {
      throw new Error('At least one asset is required')
    }

    const scheduledDate = new Date(scheduledDateStr)
    if (isNaN(scheduledDate.getTime())) {
      throw new Error('Invalid date format')
    }

    // สร้างเลขที่งาน
    const workOrderNumber = await generateWorkOrderNumber(scheduledDate)

    // สร้าง Work Order
    const workOrder = await prisma.workOrder.create({
      data: {
        siteId,
        jobType,
        scheduledDate,
        assignedTeam: assignedTeam || null,
        status: 'OPEN',
        workOrderNumber,
      },
    })

    // สร้าง Job Items สำหรับแต่ละ Asset
    await prisma.jobItem.createMany({
      data: assetIds.map((assetId) => ({
        workOrderId: workOrder.id,
        assetId,
        status: 'PENDING',
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
    const assignedTeam = sanitizeString(formData.get('assignedTeam') as string)

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

    await prisma.workOrder.update({
      where: { id: workOrderId },
      data: {
        siteId,
        jobType,
        scheduledDate,
        assignedTeam: assignedTeam || null,
      },
    })

    revalidatePath(`/work-orders/${workOrderId}`)
    revalidatePath('/work-orders')
    redirect(`/work-orders/${workOrderId}`)
  } catch (error) {
    await handleServerActionError(error, await getCurrentUser().catch(() => null))
    throw error
  }
}

export async function deleteWorkOrder(workOrderId: string) {
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

    // Check if work order has job items with DONE status (prevent deletion if has completed work)
    const hasCompletedJobs = workOrder.jobItems.some((job) => job.status === 'DONE')
    if (hasCompletedJobs) {
      throw new Error('Cannot delete work order with completed jobs')
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
    redirect('/work-orders')
  } catch (error) {
    await handleServerActionError(error, await getCurrentUser().catch(() => null))
    throw error
  }
}

export async function assignTechnicianToJobItem(jobItemId: string, technicianId: string | null) {
  try {
    await requireAdmin()

    await prisma.jobItem.update({
      where: { id: jobItemId },
      data: { technicianId },
    })

    revalidatePath(`/work-orders`)
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

    // Get job item with technician info
    const jobItem = await prisma.jobItem.findUnique({
      where: { id: jobItemId },
      include: {
        technician: true,
        photos: true,
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
          },
        },
      })

      if (workOrder) {
        // ตรวจสอบว่าทุก job item เสร็จแล้วหรือยัง
        const allJobItems = await prisma.jobItem.findMany({
          where: { workOrderId: jobItem.workOrderId },
        })
        const allDone = allJobItems.every((ji) => ji.status === 'DONE')

        // ถ้าทุกงานเสร็จแล้ว สร้าง notification สำหรับ CLIENT
        if (allDone && workOrder.site.users.length > 0) {
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

    // Get job item to check authorization and status
    const jobItem = await prisma.jobItem.findUnique({
      where: { id: jobItemId },
      include: {
        technician: true,
        workOrder: true,
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
      // Cannot add photos if job is DONE
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

    // Get job item to check authorization and status
    const jobItem = await prisma.jobItem.findUnique({
      where: { id: jobItemId },
      include: {
        technician: true,
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
      // Cannot update notes if job is DONE
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
