'use server'

import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { getWorkOrderDisplayNumber } from '@/lib/work-order-number'

export async function submitFeedback(formData: FormData) {
  const user = await getCurrentUser()

  if (!user || user.role !== 'CLIENT') {
    throw new Error('Unauthorized')
  }

  const workOrderId = formData.get('workOrderId') as string
  const rating = parseInt(formData.get('rating') as string)
  const comment = formData.get('comment') as string | null

  if (!workOrderId || !rating || rating < 1 || rating > 5) {
    throw new Error('ข้อมูลไม่ถูกต้อง')
  }

  // ตรวจสอบว่า work order เป็นของ CLIENT นี้หรือไม่
  const workOrder = await prisma.workOrder.findUnique({
    where: { id: workOrderId },
    include: {
      site: {
        include: {
          users: {
            where: { id: user.userId },
          },
        },
      },
      feedbacks: {
        where: {
          clientId: user.userId,
        },
      },
    },
  })

  if (!workOrder) {
    throw new Error('ไม่พบงานที่ระบุ')
  }

  if (workOrder.site.users.length === 0) {
    throw new Error('Unauthorized')
  }

  // ตรวจสอบว่ามี feedback แล้วหรือยัง
  if (workOrder.feedbacks.length > 0) {
    throw new Error('คุณได้ส่งแบบสำรวจแล้ว')
  }

  // สร้าง feedback
  const feedback = await prisma.feedback.create({
    data: {
      rating,
      comment: comment || null,
      workOrderId,
      clientId: user.userId,
    },
  })

  // สร้าง notification สำหรับ ADMIN
  await prisma.notification.create({
    data: {
      type: 'FEEDBACK_RECEIVED',
      title: 'ได้รับแบบสำรวจความพึงพอใจใหม่',
      message: `งานเลขที่ ${getWorkOrderDisplayNumber(workOrder)} ได้รับแบบสำรวจความพึงพอใจ ${rating} ดาว`,
      userId: (await prisma.user.findFirst({ where: { role: 'ADMIN' } }))?.id || '',
      relatedId: feedback.id,
    },
  })

  revalidatePath('/survey')
  revalidatePath('/')
}
