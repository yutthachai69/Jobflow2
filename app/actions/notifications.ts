'use server'

import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function markNotificationAsRead(notificationId: string) {
  const user = await getCurrentUser()

  if (!user) {
    throw new Error('Unauthorized')
  }

  await prisma.notification.update({
    where: {
      id: notificationId,
      userId: user.userId, // ตรวจสอบว่าเป็นของ user นี้
    },
    data: {
      isRead: true,
    },
  })

  revalidatePath('/notifications')
  revalidatePath('/')
}
