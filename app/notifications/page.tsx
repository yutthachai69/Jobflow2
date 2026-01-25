import { getCurrentUser } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import NotificationList from './NotificationList'

export default async function NotificationsPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login')
  }

  const notifications = await prisma.notification.findMany({
    where: {
      userId: user.userId,
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: 50,
  })

  const unreadCount = notifications.filter((n) => !n.isRead).length

  return (
    <div className="min-h-screen bg-app-bg p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-app-heading mb-2">
            🔔 การแจ้งเตือน
          </h1>
          {unreadCount > 0 && (
            <p className="text-app-muted">
              คุณมี {unreadCount} การแจ้งเตือนที่ยังไม่ได้อ่าน
            </p>
          )}
        </div>

        <NotificationList notifications={notifications} />
      </div>
    </div>
  )
}
