'use server'

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import bcrypt from 'bcryptjs'
import { getCurrentUser } from "@/lib/auth"
import { sanitizeString, validateUsername, validatePassword } from "@/lib/validation"
import {
  checkRateLimit,
  recordFailedLogin,
  clearFailedLogin,
  logSecurityEvent,
  isPasswordCompromised,
  getClientIP
} from "@/lib/security"
import { checkRateLimit as checkApiRateLimit, recordRequest, resetRateLimit } from "@/lib/rate-limit"
import { generateWorkOrderNumber } from '@/lib/work-order-number'
import { handleServerActionError } from '@/lib/error-handler'

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
      }
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
      }
    })

    // 3. (เพิ่มใหม่) สร้างรูปภาพจำลอง Before / After
    await prisma.jobPhoto.createMany({
      data: [
        {
          jobItemId: job.id,
          type: 'BEFORE',
          url: 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=400&q=80', // รูปแอร์สกปรก (สมมติ)
        },
        {
          jobItemId: job.id,
          type: 'AFTER',
          url: 'https://images.unsplash.com/photo-1581092334651-ddf26d9a09d0?w=400&q=80', // รูปแอร์สะอาด (สมมติ)
        }
      ]
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
    // Authorization: Only ADMIN can create work orders
    const user = await getCurrentUser()
    if (!user || user.role !== 'ADMIN') {
      throw new Error('Unauthorized')
    }

    const siteId = sanitizeString(formData.get('siteId') as string)
    const jobType = formData.get('jobType') as 'PM' | 'CM' | 'INSTALL'
    const scheduledDateStr = formData.get('scheduledDate') as string
    const assignedTeam = sanitizeString(formData.get('assignedTeam') as string)

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

    // สร้าง Work Order Number
    const workOrderNumber = await generateWorkOrderNumber(scheduledDate)

    if (jobType === 'INSTALL') {
      // ===== INSTALL MODE: สร้าง Asset ใหม่อัตโนมัติ =====
      const newAssetsJson = formData.get('newAssets') as string
      const roomId = formData.get('roomId') as string

      if (!newAssetsJson || !roomId) {
        throw new Error('New assets data and room ID are required for INSTALL')
      }

      const newAssets: Array<{ brand: string; model: string; serialNo: string; btu: string }> = JSON.parse(newAssetsJson)
      const validAssets = newAssets.filter(a => a.brand.trim() !== '')

      if (validAssets.length === 0) {
        throw new Error('At least one asset with a brand is required')
      }

      // สร้าง Work Order
      const workOrder = await prisma.workOrder.create({
        data: {
          workOrderNumber,
          siteId,
          jobType,
          scheduledDate,
          assignedTeam: assignedTeam || null,
          status: 'OPEN',
        },
      })

      // สร้าง Asset แต่ละตัว + JobItem
      for (const assetData of validAssets) {
        // Auto-generate unique QR code
        const timestamp = Date.now()
        const random = Math.random().toString(36).substring(2, 6).toUpperCase()
        const qrCode = `INST-${timestamp}-${random}`

        const asset = await prisma.asset.create({
          data: {
            qrCode,
            assetType: 'AIR_CONDITIONER',
            brand: assetData.brand.trim(),
            model: assetData.model.trim() || null,
            serialNo: assetData.serialNo.trim() || null,
            btu: assetData.btu ? parseInt(assetData.btu) : null,
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
          },
        })
      }

      revalidatePath('/work-orders')
      revalidatePath('/assets')
      redirect(`/work-orders/${workOrder.id}`)
    } else {
      // ===== PM/CM MODE: เลือก Asset ที่มีอยู่ =====
      const assetIds = formData.getAll('assetIds') as string[]

      if (assetIds.length === 0) {
        throw new Error('At least one asset is required')
      }

      // สร้าง Work Order
      const workOrder = await prisma.workOrder.create({
        data: {
          workOrderNumber,
          siteId,
          jobType,
          scheduledDate,
          assignedTeam: assignedTeam || null,
          status: 'OPEN',
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
    }
  } catch (error) {
    await handleServerActionError(error, await getCurrentUser().catch(() => null))
    throw error
  }
}

export async function updateWorkOrderStatus(workOrderId: string, status: 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED') {
  // Authorization: Only ADMIN can update work order status
  const user = await getCurrentUser()
  if (!user || user.role !== 'ADMIN') {
    throw new Error('Unauthorized')
  }

  await prisma.workOrder.update({
    where: { id: workOrderId },
    data: { status },
  })

  revalidatePath(`/work-orders/${workOrderId}`)
  revalidatePath('/work-orders')
  revalidatePath('/')
}

export async function updateWorkOrder(formData: FormData) {
  // Authorization: Only ADMIN can update work orders
  const user = await getCurrentUser()
  if (!user || user.role !== 'ADMIN') {
    throw new Error('Unauthorized')
  }

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

  // Check if work order exists
  const existingWorkOrder = await prisma.workOrder.findUnique({
    where: { id: workOrderId },
  })
  if (!existingWorkOrder) {
    throw new Error('Work Order not found')
  }

  // Update Work Order
  await prisma.workOrder.update({
    where: { id: workOrderId },
    data: {
      siteId,
      jobType,
      scheduledDate,
      assignedTeam: assignedTeam || null,
    },
  })

  logSecurityEvent('WORK_ORDER_UPDATED', {
    updatedBy: user.id,
    workOrderId,
    timestamp: new Date().toISOString(),
  })

  revalidatePath(`/work-orders/${workOrderId}`)
  revalidatePath('/work-orders')
  redirect(`/work-orders/${workOrderId}`)
}

export async function deleteWorkOrder(workOrderId: string) {
  // Authorization: Only ADMIN can delete work orders
  const user = await getCurrentUser()
  if (!user || user.role !== 'ADMIN') {
    throw new Error('Unauthorized')
  }

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
  const hasCompletedJobs = workOrder.jobItems.some(job => job.status === 'DONE')
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

  logSecurityEvent('WORK_ORDER_DELETED', {
    deletedBy: user.id,
    workOrderId,
    timestamp: new Date().toISOString(),
  })

  revalidatePath('/work-orders')
  redirect('/work-orders')
}

export async function assignTechnicianToJobItem(jobItemId: string, technicianId: string | null) {
  // Authorization: Only ADMIN can assign technicians
  const user = await getCurrentUser()
  if (!user || user.role !== 'ADMIN') {
    throw new Error('Unauthorized')
  }

  const jobItem = await prisma.jobItem.findUnique({
    where: { id: jobItemId },
  })

  if (!jobItem) {
    throw new Error('Job item not found')
  }

  // Check if technician exists (if provided)
  if (technicianId) {
    const technician = await prisma.user.findUnique({
      where: { id: technicianId },
    })
    if (!technician || technician.role !== 'TECHNICIAN') {
      throw new Error('Invalid technician')
    }
  }

  await prisma.jobItem.update({
    where: { id: jobItemId },
    data: {
      technicianId: technicianId || null,
    },
  })

  logSecurityEvent('JOB_ITEM_TECHNICIAN_ASSIGNED', {
    assignedBy: user.id,
    jobItemId,
    technicianId: technicianId || null,
    timestamp: new Date().toISOString(),
  })

  revalidatePath(`/work-orders/${jobItem.workOrderId}`)
  revalidatePath(`/technician/job-item/${jobItemId}`)
}

export async function updateJobItemStatus(jobItemId: string, status: 'PENDING' | 'IN_PROGRESS' | 'DONE' | 'ISSUE_FOUND') {
  // Authorization: Only TECHNICIAN or ADMIN can update job item status
  const user = await getCurrentUser()
  if (!user || (user.role !== 'TECHNICIAN' && user.role !== 'ADMIN')) {
    logSecurityEvent('UNAUTHORIZED_ACCESS_ATTEMPT', {
      userId: user?.id,
      username: user?.username,
      action: `UPDATE_JOB_ITEM_STATUS:${jobItemId}`
    })
    throw new Error('Unauthorized')
  }

  const jobItem = await prisma.jobItem.findUnique({
    where: { id: jobItemId },
    include: {
      workOrder: true,
      photos: true,
    },
  })

  if (!jobItem) {
    throw new Error('Job item not found')
  }

  // Authorization: TECHNICIAN can update their own job items or unassigned job items (unless ADMIN)
  if (user.role === 'TECHNICIAN') {
    // Allow if job item is unassigned (null) or assigned to this technician
    if (jobItem.technicianId !== null && jobItem.technicianId !== user.id) {
      throw new Error('Unauthorized')
    }
  }

  // Validation: Must have BEFORE and AFTER photos before completing (unless ADMIN)
  if (status === 'DONE' && user.role === 'TECHNICIAN') {
    const hasBefore = jobItem.photos.some(photo => photo.type === 'BEFORE')
    const hasAfter = jobItem.photos.some(photo => photo.type === 'AFTER')

    if (!hasBefore || !hasAfter) {
      throw new Error('กรุณาอัปโหลดรูปภาพก่อนทำ (BEFORE) และหลังทำ (AFTER) ก่อนเสร็จสิ้นงาน')
    }
  }

  const updateData: any = { status }

  if (status === 'IN_PROGRESS' && !jobItem.startTime) {
    updateData.startTime = new Date()
    // Auto-assign technician if not assigned
    if (!jobItem.technicianId && user.role === 'TECHNICIAN') {
      updateData.technicianId = user.id
    }
  }

  if (status === 'DONE' && !jobItem.endTime) {
    updateData.endTime = new Date()
  }

  await prisma.jobItem.update({
    where: { id: jobItemId },
    data: updateData,
  })

  revalidatePath(`/technician/job-item/${jobItemId}`)
  revalidatePath(`/technician/work-order/${jobItem.workOrderId}`)
  revalidatePath(`/work-orders/${jobItem.workOrderId}`)
}

export async function updateJobItemChecklist(jobItemId: string, checklist: string) {
  const user = await getCurrentUser()
  if (!user || (user.role !== 'TECHNICIAN' && user.role !== 'ADMIN')) {
    logSecurityEvent('UNAUTHORIZED_ACCESS_ATTEMPT', {
      userId: user?.id,
      username: user?.username,
      action: `UPDATE_JOB_ITEM_CHECKLIST:${jobItemId}`
    })
    throw new Error('Unauthorized')
  }

  const jobItem = await prisma.jobItem.findUnique({
    where: { id: jobItemId },
  })

  if (!jobItem) {
    throw new Error('Job item not found')
  }

  if (jobItem.status === 'DONE' && user.role !== 'ADMIN') {
    throw new Error('ไม่สามารถแก้ไขข้อมูลได้ เนื่องจากงานเสร็จสิ้นแล้ว')
  }

  if (user.role === 'TECHNICIAN' && jobItem.technicianId !== null && jobItem.technicianId !== user.id) {
    throw new Error('Unauthorized')
  }

  await prisma.jobItem.update({
    where: { id: jobItemId },
    data: { checklist },
  })

  logSecurityEvent('JOB_ITEM_CHECKLIST_UPDATED', {
    updatedBy: user.id,
    jobItemId,
    timestamp: new Date().toISOString(),
  })

  revalidatePath(`/technician/job-item/${jobItemId}`)
}

export async function deleteJobPhoto(photoId: string) {
  // Authorization: Only TECHNICIAN or ADMIN can delete photos
  const user = await getCurrentUser()
  if (!user || (user.role !== 'TECHNICIAN' && user.role !== 'ADMIN')) {
    throw new Error('Unauthorized')
  }

  const photo = await prisma.jobPhoto.findUnique({
    where: { id: photoId },
    include: {
      jobItem: {
        include: {
          workOrder: true,
        },
      },
    },
  })

  if (!photo) {
    throw new Error('Photo not found')
  }

  // Authorization: TECHNICIAN can only delete photos from their own job items (unless ADMIN)
  if (user.role === 'TECHNICIAN') {
    if (photo.jobItem.technicianId !== user.id) {
      throw new Error('Unauthorized')
    }
  }

  // Prevent deletion if job is DONE (unless ADMIN)
  if (photo.jobItem.status === 'DONE' && user.role !== 'ADMIN') {
    throw new Error('Cannot delete photo from completed job')
  }

  await prisma.jobPhoto.delete({
    where: { id: photoId },
  })

  logSecurityEvent('JOB_PHOTO_DELETED', {
    deletedBy: user.id,
    photoId,
    jobItemId: photo.jobItemId,
    timestamp: new Date().toISOString(),
  })

  revalidatePath(`/technician/job-item/${photo.jobItemId}`)
  revalidatePath(`/work-orders/${photo.jobItem.workOrderId}`)
}

export async function createJobPhoto(jobItemId: string, formData: FormData) {
  // Authorization: Only TECHNICIAN or ADMIN can upload photos
  const user = await getCurrentUser()
  if (!user || (user.role !== 'TECHNICIAN' && user.role !== 'ADMIN')) {
    logSecurityEvent('UNAUTHORIZED_ACCESS_ATTEMPT', {
      userId: user?.id,
      username: user?.username,
      action: `CREATE_JOB_PHOTO:${jobItemId}`
    })
    throw new Error('Unauthorized')
  }

  const jobItem = await prisma.jobItem.findUnique({
    where: { id: jobItemId },
  })

  if (!jobItem) {
    throw new Error('Job item not found')
  }

  // Cannot upload photos if job item is already DONE (unless ADMIN)
  if (jobItem.status === 'DONE' && user.role !== 'ADMIN') {
    throw new Error('ไม่สามารถเพิ่มรูปภาพได้ เนื่องจากงานเสร็จสิ้นแล้ว')
  }

  // Authorization: TECHNICIAN can only upload photos to their own job items (unless ADMIN)
  if (user.role === 'TECHNICIAN') {
    if (jobItem.technicianId !== null && jobItem.technicianId !== user.id) {
      throw new Error('Unauthorized')
    }
  }

  const photoType = formData.get('photoType') as 'BEFORE' | 'AFTER' | 'DEFECT' | 'METER'
  const imageUrl = formData.get('imageUrl') as string // URL from blob storage

  if (!photoType || !['BEFORE', 'AFTER', 'DEFECT', 'METER'].includes(photoType)) {
    throw new Error('Invalid photo type')
  }

  if (!imageUrl) {
    throw new Error('Image URL is required')
  }

  await prisma.jobPhoto.create({
    data: {
      jobItemId,
      type: photoType,
      url: imageUrl,
    },
  })

  logSecurityEvent('JOB_PHOTO_UPLOADED', {
    uploadedBy: user.id,
    jobItemId,
    photoType,
    timestamp: new Date().toISOString(),
  })

  revalidatePath(`/technician/job-item/${jobItemId}`)
  revalidatePath(`/technician/work-order/${jobItem.workOrderId}`)
  revalidatePath(`/work-orders/${jobItem.workOrderId}`)
}

export async function updateJobItemNote(jobItemId: string, formData: FormData) {
  // Authorization: Only TECHNICIAN or ADMIN can update job item note
  const user = await getCurrentUser()
  if (!user || (user.role !== 'TECHNICIAN' && user.role !== 'ADMIN')) {
    logSecurityEvent('UNAUTHORIZED_ACCESS_ATTEMPT', {
      userId: user?.id,
      username: user?.username,
      action: `UPDATE_JOB_ITEM_NOTE:${jobItemId}`
    })
    throw new Error('Unauthorized')
  }

  const techNote = sanitizeString(formData.get('techNote') as string)

  const jobItem = await prisma.jobItem.findUnique({
    where: { id: jobItemId },
  })

  if (!jobItem) {
    throw new Error('Job item not found')
  }

  // Cannot update note if job item is already DONE (unless ADMIN)
  if (jobItem.status === 'DONE' && user.role !== 'ADMIN') {
    throw new Error('ไม่สามารถแก้ไขบันทึกได้ เนื่องจากงานเสร็จสิ้นแล้ว')
  }

  // Authorization: TECHNICIAN can update their own job items or unassigned job items (unless ADMIN)
  if (user.role === 'TECHNICIAN') {
    // Allow if job item is unassigned (null) or assigned to this technician
    if (jobItem.technicianId !== null && jobItem.technicianId !== user.id) {
      throw new Error('Unauthorized')
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
    data: { techNote },
  })

  revalidatePath(`/technician/job-item/${jobItemId}`)
}

export async function createClient(formData: FormData) {
  // Authorization: Only ADMIN can create clients
  const user = await getCurrentUser()
  if (!user || user.role !== 'ADMIN') {
    throw new Error('Unauthorized')
  }

  const name = sanitizeString(formData.get('name') as string)
  const contactInfo = sanitizeString(formData.get('contactInfo') as string)

  if (!name) {
    throw new Error('Client name is required')
  }

  await prisma.client.create({
    data: {
      name,
      contactInfo: contactInfo || null,
    },
  })

  logSecurityEvent('CLIENT_CREATED', {
    createdBy: user.id,
    timestamp: new Date().toISOString(),
  })

  revalidatePath('/locations')
  redirect('/locations')
}

export async function updateClient(formData: FormData) {
  // Authorization: Only ADMIN can update clients
  const user = await getCurrentUser()
  if (!user || user.role !== 'ADMIN') {
    throw new Error('Unauthorized')
  }

  const clientId = sanitizeString(formData.get('clientId') as string)
  const name = sanitizeString(formData.get('name') as string)
  const contactInfo = sanitizeString(formData.get('contactInfo') as string)

  if (!clientId) {
    throw new Error('Client ID is required')
  }
  if (!name) {
    throw new Error('Client name is required')
  }

  // Check if client exists
  const existingClient = await prisma.client.findUnique({
    where: { id: clientId },
  })
  if (!existingClient) {
    throw new Error('Client not found')
  }

  await prisma.client.update({
    where: { id: clientId },
    data: {
      name,
      contactInfo: contactInfo || null,
    },
  })

  logSecurityEvent('CLIENT_UPDATED', {
    updatedBy: user.id,
    clientId,
    timestamp: new Date().toISOString(),
  })

  revalidatePath('/locations')
  redirect('/locations')
}

export async function deleteClient(clientId: string) {
  // Authorization: Only ADMIN can delete clients
  const user = await getCurrentUser()
  if (!user || user.role !== 'ADMIN') {
    throw new Error('Unauthorized')
  }

  // Check if client exists
  const client = await prisma.client.findUnique({
    where: { id: clientId },
    include: {
      sites: true,
    },
  })

  if (!client) {
    throw new Error('Client not found')
  }

  // Check if client has sites (prevent deletion if has sites)
  if (client.sites.length > 0) {
    throw new Error('Cannot delete client with sites')
  }

  await prisma.client.delete({
    where: { id: clientId },
  })

  logSecurityEvent('CLIENT_DELETED', {
    deletedBy: user.id,
    clientId,
    timestamp: new Date().toISOString(),
  })

  revalidatePath('/locations')
  redirect('/locations')
}

export async function createSite(formData: FormData) {
  // Authorization: Only ADMIN can create sites
  const user = await getCurrentUser()
  if (!user || user.role !== 'ADMIN') {
    throw new Error('Unauthorized')
  }

  const clientId = sanitizeString(formData.get('clientId') as string)
  const name = sanitizeString(formData.get('name') as string)
  const address = sanitizeString(formData.get('address') as string)

  if (!clientId) {
    throw new Error('Client ID is required')
  }
  if (!name) {
    throw new Error('Site name is required')
  }

  await prisma.site.create({
    data: {
      clientId,
      name,
      address: address || null,
    },
  })

  logSecurityEvent('SITE_CREATED', {
    createdBy: user.id,
    timestamp: new Date().toISOString(),
  })

  revalidatePath('/locations')
  redirect('/locations')
}

export async function updateSite(formData: FormData) {
  // Authorization: Only ADMIN can update sites
  const user = await getCurrentUser()
  if (!user || user.role !== 'ADMIN') {
    throw new Error('Unauthorized')
  }

  const siteId = sanitizeString(formData.get('siteId') as string)
  const clientId = sanitizeString(formData.get('clientId') as string)
  const name = sanitizeString(formData.get('name') as string)
  const address = sanitizeString(formData.get('address') as string)

  if (!siteId) {
    throw new Error('Site ID is required')
  }
  if (!clientId) {
    throw new Error('Client ID is required')
  }
  if (!name) {
    throw new Error('Site name is required')
  }

  // Check if site exists
  const existingSite = await prisma.site.findUnique({
    where: { id: siteId },
  })
  if (!existingSite) {
    throw new Error('Site not found')
  }

  await prisma.site.update({
    where: { id: siteId },
    data: {
      clientId,
      name,
      address: address || null,
    },
  })

  logSecurityEvent('SITE_UPDATED', {
    updatedBy: user.id,
    siteId,
    timestamp: new Date().toISOString(),
  })

  revalidatePath('/locations')
  redirect('/locations')
}

export async function deleteSite(siteId: string) {
  // Authorization: Only ADMIN can delete sites
  const user = await getCurrentUser()
  if (!user || user.role !== 'ADMIN') {
    throw new Error('Unauthorized')
  }

  // Check if site exists
  const site = await prisma.site.findUnique({
    where: { id: siteId },
    include: {
      buildings: true,
      users: true,
      workOrders: true,
    },
  })

  if (!site) {
    throw new Error('Site not found')
  }

  // Check if site has buildings (prevent deletion if has buildings)
  if (site.buildings.length > 0) {
    throw new Error('Cannot delete site with buildings')
  }

  // Check if site has users (prevent deletion if has users assigned)
  if (site.users.length > 0) {
    throw new Error('Cannot delete site with assigned users')
  }

  // Check if site has work orders (prevent deletion if has work orders)
  if (site.workOrders.length > 0) {
    throw new Error('Cannot delete site with work orders')
  }

  await prisma.site.delete({
    where: { id: siteId },
  })

  logSecurityEvent('SITE_DELETED', {
    deletedBy: user.id,
    siteId,
    timestamp: new Date().toISOString(),
  })

  revalidatePath('/locations')
  redirect('/locations')
}

export async function createBuilding(formData: FormData) {
  // Authorization: Only ADMIN can create buildings
  const user = await getCurrentUser()
  if (!user || user.role !== 'ADMIN') {
    throw new Error('Unauthorized')
  }

  const siteId = sanitizeString(formData.get('siteId') as string)
  const name = sanitizeString(formData.get('name') as string)

  if (!siteId) {
    throw new Error('Site ID is required')
  }
  if (!name) {
    throw new Error('Building name is required')
  }

  await prisma.building.create({
    data: {
      siteId,
      name,
    },
  })

  logSecurityEvent('BUILDING_CREATED', {
    createdBy: user.id,
    timestamp: new Date().toISOString(),
  })

  revalidatePath('/locations')
  redirect('/locations')
}

export async function updateBuilding(formData: FormData) {
  // Authorization: Only ADMIN can update buildings
  const user = await getCurrentUser()
  if (!user || user.role !== 'ADMIN') {
    throw new Error('Unauthorized')
  }

  const buildingId = sanitizeString(formData.get('buildingId') as string)
  const siteId = sanitizeString(formData.get('siteId') as string)
  const name = sanitizeString(formData.get('name') as string)

  if (!buildingId) {
    throw new Error('Building ID is required')
  }
  if (!siteId) {
    throw new Error('Site ID is required')
  }
  if (!name) {
    throw new Error('Building name is required')
  }

  // Check if building exists
  const existingBuilding = await prisma.building.findUnique({
    where: { id: buildingId },
  })
  if (!existingBuilding) {
    throw new Error('Building not found')
  }

  await prisma.building.update({
    where: { id: buildingId },
    data: {
      siteId,
      name,
    },
  })

  logSecurityEvent('BUILDING_UPDATED', {
    updatedBy: user.id,
    buildingId,
    timestamp: new Date().toISOString(),
  })

  revalidatePath('/locations')
  redirect('/locations')
}

export async function deleteBuilding(buildingId: string) {
  // Authorization: Only ADMIN can delete buildings
  const user = await getCurrentUser()
  if (!user || user.role !== 'ADMIN') {
    throw new Error('Unauthorized')
  }

  // Check if building exists
  const building = await prisma.building.findUnique({
    where: { id: buildingId },
    include: {
      floors: true,
    },
  })

  if (!building) {
    throw new Error('Building not found')
  }

  // Check if building has floors (prevent deletion if has floors)
  if (building.floors.length > 0) {
    throw new Error('Cannot delete building with floors')
  }

  await prisma.building.delete({
    where: { id: buildingId },
  })

  logSecurityEvent('BUILDING_DELETED', {
    deletedBy: user.id,
    buildingId,
    timestamp: new Date().toISOString(),
  })

  revalidatePath('/locations')
  redirect('/locations')
}

export async function createFloor(formData: FormData) {
  // Authorization: Only ADMIN can create floors
  const user = await getCurrentUser()
  if (!user || user.role !== 'ADMIN') {
    throw new Error('Unauthorized')
  }

  const buildingId = sanitizeString(formData.get('buildingId') as string)
  const name = sanitizeString(formData.get('name') as string)

  if (!buildingId) {
    throw new Error('Building ID is required')
  }
  if (!name) {
    throw new Error('Floor name is required')
  }

  await prisma.floor.create({
    data: {
      buildingId,
      name,
    },
  })

  logSecurityEvent('FLOOR_CREATED', {
    createdBy: user.id,
    timestamp: new Date().toISOString(),
  })

  revalidatePath('/locations')
  redirect('/locations')
}

export async function updateFloor(formData: FormData) {
  // Authorization: Only ADMIN can update floors
  const user = await getCurrentUser()
  if (!user || user.role !== 'ADMIN') {
    throw new Error('Unauthorized')
  }

  const floorId = sanitizeString(formData.get('floorId') as string)
  const buildingId = sanitizeString(formData.get('buildingId') as string)
  const name = sanitizeString(formData.get('name') as string)

  if (!floorId) {
    throw new Error('Floor ID is required')
  }
  if (!buildingId) {
    throw new Error('Building ID is required')
  }
  if (!name) {
    throw new Error('Floor name is required')
  }

  // Check if floor exists
  const existingFloor = await prisma.floor.findUnique({
    where: { id: floorId },
  })
  if (!existingFloor) {
    throw new Error('Floor not found')
  }

  await prisma.floor.update({
    where: { id: floorId },
    data: {
      buildingId,
      name,
    },
  })

  logSecurityEvent('FLOOR_UPDATED', {
    updatedBy: user.id,
    floorId,
    timestamp: new Date().toISOString(),
  })

  revalidatePath('/locations')
  redirect('/locations')
}

export async function deleteFloor(floorId: string) {
  // Authorization: Only ADMIN can delete floors
  const user = await getCurrentUser()
  if (!user || user.role !== 'ADMIN') {
    throw new Error('Unauthorized')
  }

  // Check if floor exists
  const floor = await prisma.floor.findUnique({
    where: { id: floorId },
    include: {
      rooms: true,
    },
  })

  if (!floor) {
    throw new Error('Floor not found')
  }

  // Check if floor has rooms (prevent deletion if has rooms)
  if (floor.rooms.length > 0) {
    throw new Error('Cannot delete floor with rooms')
  }

  await prisma.floor.delete({
    where: { id: floorId },
  })

  logSecurityEvent('FLOOR_DELETED', {
    deletedBy: user.id,
    floorId,
    timestamp: new Date().toISOString(),
  })

  revalidatePath('/locations')
  redirect('/locations')
}

export async function createRoom(formData: FormData) {
  // Authorization: Only ADMIN can create rooms
  const user = await getCurrentUser()
  if (!user || user.role !== 'ADMIN') {
    throw new Error('Unauthorized')
  }

  const floorId = sanitizeString(formData.get('floorId') as string)
  const name = sanitizeString(formData.get('name') as string)

  if (!floorId) {
    throw new Error('Floor ID is required')
  }
  if (!name) {
    throw new Error('Room name is required')
  }

  await prisma.room.create({
    data: {
      floorId,
      name,
    },
  })

  logSecurityEvent('ROOM_CREATED', {
    createdBy: user.id,
    timestamp: new Date().toISOString(),
  })

  revalidatePath('/locations')
  redirect('/locations')
}

export async function updateRoom(formData: FormData) {
  // Authorization: Only ADMIN can update rooms
  const user = await getCurrentUser()
  if (!user || user.role !== 'ADMIN') {
    throw new Error('Unauthorized')
  }

  const roomId = sanitizeString(formData.get('roomId') as string)
  const floorId = sanitizeString(formData.get('floorId') as string)
  const name = sanitizeString(formData.get('name') as string)

  if (!roomId) {
    throw new Error('Room ID is required')
  }
  if (!floorId) {
    throw new Error('Floor ID is required')
  }
  if (!name) {
    throw new Error('Room name is required')
  }

  // Check if room exists
  const existingRoom = await prisma.room.findUnique({
    where: { id: roomId },
  })
  if (!existingRoom) {
    throw new Error('Room not found')
  }

  await prisma.room.update({
    where: { id: roomId },
    data: {
      floorId,
      name,
    },
  })

  logSecurityEvent('ROOM_UPDATED', {
    updatedBy: user.id,
    roomId,
    timestamp: new Date().toISOString(),
  })

  revalidatePath('/locations')
  redirect('/locations')
}

export async function deleteRoom(roomId: string) {
  // Authorization: Only ADMIN can delete rooms
  const user = await getCurrentUser()
  if (!user || user.role !== 'ADMIN') {
    throw new Error('Unauthorized')
  }

  // Check if room exists
  const room = await prisma.room.findUnique({
    where: { id: roomId },
    include: {
      assets: true,
    },
  })

  if (!room) {
    throw new Error('Room not found')
  }

  // Check if room has assets (prevent deletion if has assets)
  if (room.assets.length > 0) {
    throw new Error('Cannot delete room with assets')
  }

  await prisma.room.delete({
    where: { id: roomId },
  })

  logSecurityEvent('ROOM_DELETED', {
    deletedBy: user.id,
    roomId,
    timestamp: new Date().toISOString(),
  })

  revalidatePath('/locations')
  redirect('/locations')
}

export async function createAsset(formData: FormData) {
  try {
    // Authorization: Only ADMIN can create assets
    const user = await getCurrentUser()
    if (!user || user.role !== 'ADMIN') {
      throw new Error('Unauthorized')
    }

    const roomId = sanitizeString(formData.get('roomId') as string)
    const serialNo = sanitizeString(formData.get('serialNo') as string)
    const assetType = formData.get('assetType') as string || 'AIR_CONDITIONER'
    const brand = sanitizeString(formData.get('brand') as string)
    const model = sanitizeString(formData.get('model') as string)
    const btuStr = formData.get('btu') as string
    const installDateStr = formData.get('installDate') as string

    // Validation
    if (!roomId) {
      throw new Error('Room ID is required')
    }
    if (!serialNo) {
      throw new Error('Serial Number is required')
    }

    // Check if QR Code (serialNo) already exists
    const existingAsset = await prisma.asset.findUnique({
      where: { qrCode: serialNo },
    })
    if (existingAsset) {
      throw new Error('QR Code already exists')
    }

    const btu = btuStr ? parseInt(btuStr, 10) : null
    if (btuStr && (isNaN(btu!) || btu! < 0 || btu! > 1000000)) {
      throw new Error('Invalid BTU value')
    }

    const installDate = installDateStr ? new Date(installDateStr) : null
    if (installDateStr && (!installDate || isNaN(installDate.getTime()))) {
      throw new Error('Invalid date format')
    }

    await prisma.asset.create({
      data: {
        roomId,
        qrCode: serialNo, // ใช้ Serial Number เป็น QR Code
        assetType: assetType as any,
        brand: brand || null,
        model: model || null,
        serialNo: serialNo || null,
        btu: btu || null,
        installDate: installDate || null,
        status: 'ACTIVE',
      },
    })

    revalidatePath('/assets')
    redirect('/assets')
  } catch (error) {
    await handleServerActionError(error, await getCurrentUser().catch(() => null))
    throw error
  }
}

export async function updateAsset(formData: FormData) {
  // Authorization: Only ADMIN can update assets
  const user = await getCurrentUser()
  if (!user || user.role !== 'ADMIN') {
    throw new Error('Unauthorized')
  }

  const assetId = sanitizeString(formData.get('assetId') as string)
  const roomId = sanitizeString(formData.get('roomId') as string)
  const serialNo = sanitizeString(formData.get('serialNo') as string)
  const assetType = formData.get('assetType') as string || 'AIR_CONDITIONER'
  const brand = sanitizeString(formData.get('brand') as string)
  const model = sanitizeString(formData.get('model') as string)
  const btuStr = formData.get('btu') as string
  const installDateStr = formData.get('installDate') as string
  const status = formData.get('status') as 'ACTIVE' | 'BROKEN' | 'RETIRED'

  // Validation
  if (!assetId) {
    throw new Error('Asset ID is required')
  }
  if (!roomId) {
    throw new Error('Room ID is required')
  }
  if (!serialNo) {
    throw new Error('Serial Number is required')
  }
  if (!status || !['ACTIVE', 'BROKEN', 'RETIRED'].includes(status)) {
    throw new Error('Invalid status')
  }

  // Check if asset exists
  const existingAsset = await prisma.asset.findUnique({
    where: { id: assetId },
  })
  if (!existingAsset) {
    throw new Error('Asset not found')
  }

  // Check if QR Code (serialNo) already exists for different asset
  if (serialNo !== existingAsset.qrCode) {
    const duplicateAsset = await prisma.asset.findUnique({
      where: { qrCode: serialNo },
    })
    if (duplicateAsset) {
      throw new Error('QR Code already exists')
    }
  }

  const btu = btuStr ? parseInt(btuStr, 10) : null
  if (btuStr && (isNaN(btu!) || btu! < 0 || btu! > 1000000)) {
    throw new Error('Invalid BTU value')
  }

  const installDate = installDateStr ? new Date(installDateStr) : null
  if (installDateStr && (!installDate || isNaN(installDate.getTime()))) {
    throw new Error('Invalid date format')
  }

  await prisma.asset.update({
    where: { id: assetId },
    data: {
      roomId,
      qrCode: serialNo,
      assetType: assetType as any,
      brand: brand || null,
      model: model || null,
      serialNo: serialNo || null,
      btu: btu || null,
      installDate: installDate || null,
      status,
    },
  })

  logSecurityEvent('ASSET_UPDATED', {
    updatedBy: user.id,
    assetId,
    timestamp: new Date().toISOString(),
  })

  revalidatePath('/assets')
  revalidatePath(`/assets/${assetId}`)
  redirect(`/assets/${assetId}`)
}

export async function deleteAsset(assetId: string) {
  // Authorization: Only ADMIN can delete assets
  const user = await getCurrentUser()
  if (!user || user.role !== 'ADMIN') {
    throw new Error('Unauthorized')
  }

  // Check if asset exists
  const asset = await prisma.asset.findUnique({
    where: { id: assetId },
    include: {
      jobItems: true,
    },
  })

  if (!asset) {
    throw new Error('Asset not found')
  }

  // Check if asset has job items (prevent deletion if has work history)
  if (asset.jobItems.length > 0) {
    throw new Error('Cannot delete asset with work history')
  }

  await prisma.asset.delete({
    where: { id: assetId },
  })

  logSecurityEvent('ASSET_DELETED', {
    deletedBy: user.id,
    assetId,
    timestamp: new Date().toISOString(),
  })

  revalidatePath('/assets')
  redirect('/assets')
}

export async function createUser(formData: FormData) {
  // Authorization: Only ADMIN can create users
  const user = await getCurrentUser()
  if (!user || user.role !== 'ADMIN') {
    throw new Error('Unauthorized')
  }

  const username = sanitizeString(formData.get('username') as string)
  const password = formData.get('password') as string
  const fullName = sanitizeString(formData.get('fullName') as string)
  const role = formData.get('role') as 'ADMIN' | 'TECHNICIAN' | 'CLIENT'
  const siteId = sanitizeString(formData.get('siteId') as string)

  // Validation
  const usernameValidation = validateUsername(username || '')
  if (!usernameValidation.valid) {
    throw new Error(usernameValidation.error || 'Invalid username')
  }

  const passwordValidation = validatePassword(password || '')
  if (!passwordValidation.valid) {
    throw new Error(passwordValidation.error || 'Invalid password')
  }

  if (!role || !['ADMIN', 'TECHNICIAN', 'CLIENT'].includes(role)) {
    throw new Error('Invalid role')
  }

  // Check if username already exists
  const existingUser = await prisma.user.findUnique({
    where: { username: username! },
  })

  if (existingUser) {
    throw new Error('Username already exists')
  }

  // สำหรับ CLIENT role ต้องมี siteId
  if (role === 'CLIENT' && !siteId) {
    throw new Error('Site ID is required for CLIENT role')
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10)

  // Create user
  await prisma.user.create({
    data: {
      username: username!,
      password: hashedPassword,
      fullName: fullName || null,
      role,
      siteId: role === 'CLIENT' ? siteId : null,
    },
  })

  revalidatePath('/users')
  redirect('/users')
}

export async function updateUser(formData: FormData) {
  // Authorization: Only ADMIN can update users
  const user = await getCurrentUser()
  if (!user || user.role !== 'ADMIN') {
    throw new Error('Unauthorized')
  }

  const userId = sanitizeString(formData.get('userId') as string)
  const username = sanitizeString(formData.get('username') as string)
  const password = formData.get('password') as string
  const fullName = sanitizeString(formData.get('fullName') as string)
  const role = formData.get('role') as 'ADMIN' | 'TECHNICIAN' | 'CLIENT'
  const siteId = sanitizeString(formData.get('siteId') as string)

  if (!userId) {
    throw new Error('User ID is required')
  }

  // Validation
  const usernameValidation = validateUsername(username || '')
  if (!usernameValidation.valid) {
    throw new Error(usernameValidation.error || 'Invalid username')
  }

  // Password is optional when updating (only validate if provided)
  if (password && password.length > 0) {
    const passwordValidation = validatePassword(password)
    if (!passwordValidation.valid) {
      throw new Error(passwordValidation.error || 'Invalid password')
    }
  }

  if (!role || !['ADMIN', 'TECHNICIAN', 'CLIENT'].includes(role)) {
    throw new Error('Invalid role')
  }

  // Check if username already exists (excluding current user)
  const existingUser = await prisma.user.findUnique({
    where: { username: username! },
  })

  if (existingUser && existingUser.id !== userId) {
    throw new Error('Username already exists')
  }

  // สำหรับ CLIENT role ต้องมี siteId
  if (role === 'CLIENT' && !siteId) {
    throw new Error('Site ID is required for CLIENT role')
  }

  // Prepare update data
  const updateData: any = {
    username: username!,
    fullName: fullName || null,
    role,
    siteId: role === 'CLIENT' ? siteId : null,
  }

  // Only update password if provided
  if (password && password.length > 0) {
    const hashedPassword = await bcrypt.hash(password, 10)
    updateData.password = hashedPassword
  }

  // Update user
  await prisma.user.update({
    where: { id: userId },
    data: updateData,
  })

  logSecurityEvent('USER_UPDATED', {
    updatedBy: user.id,
    updatedUserId: userId,
    updatedUsername: username,
    timestamp: new Date().toISOString(),
  })

  revalidatePath('/users')
  redirect('/users')
}

export async function updateContactInfo(formData: FormData) {
  // Authorization: Only ADMIN can update contact info
  const user = await getCurrentUser()
  if (!user || user.role !== 'ADMIN') {
    throw new Error('Unauthorized')
  }

  const contactInfoId = sanitizeString(formData.get('contactInfoId') as string)
  const email = sanitizeString(formData.get('email') as string)
  const phone = sanitizeString(formData.get('phone') as string)
  const hours = sanitizeString(formData.get('hours') as string)

  if (!contactInfoId) {
    throw new Error('Contact Info ID is required')
  }

  // Validation
  if (!email) {
    throw new Error('Email is required')
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error('Invalid email format')
  }
  if (!phone) {
    throw new Error('Phone is required')
  }
  if (!hours) {
    throw new Error('Hours is required')
  }

  // Update contact info
  await prisma.contactInfo.update({
    where: { id: contactInfoId },
    data: {
      email,
      phone,
      hours,
    },
  })

  logSecurityEvent('CONTACT_INFO_UPDATED', {
    updatedBy: user.id,
    timestamp: new Date().toISOString(),
  })

  revalidatePath('/contact')
}

export async function submitContactMessage(formData: FormData) {
  const user = await getCurrentUser()

  if (!user) {
    throw new Error('Unauthorized')
  }

  // Rate limiting for contact form submissions
  const identifier = user.id
  const rateLimitResult = checkApiRateLimit(identifier, 'CONTACT')

  if (!rateLimitResult.allowed) {
    logSecurityEvent('CONTACT_FORM_RATE_LIMIT_EXCEEDED', {
      userId: user.id,
      username: user.username,
    })
    throw new Error(`Too many submissions. Please try again after ${rateLimitResult.retryAfter || 60} seconds.`)
  }

  const phone = sanitizeString(formData.get('phone') as string)
  const message = sanitizeString(formData.get('message') as string)

  if (!phone || !message) {
    throw new Error('Phone and message are required')
  }

  // เก็บข้อความใน database
  await prisma.contactMessage.create({
    data: {
      userId: user.id,
      phone,
      message,
      isRead: false,
    },
  })

  logSecurityEvent('CONTACT_MESSAGE_SUBMITTED', {
    submittedBy: user.id,
    phone,
    timestamp: new Date().toISOString(),
  })

  revalidatePath('/messages')
  revalidatePath('/contact')
}

export async function markMessageAsRead(messageId: string) {
  const user = await getCurrentUser()

  if (!user || user.role !== 'ADMIN') {
    throw new Error('Unauthorized')
  }

  await prisma.contactMessage.update({
    where: { id: messageId },
    data: { isRead: true },
  })

  revalidatePath('/messages')
}

// NOTE: login() and logout() are exported from app/actions/index.ts
// Please import from '@/app/actions/index' or '@/app/actions/auth' directly