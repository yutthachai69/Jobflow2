'use client'

import { useState } from 'react'
import Link from 'next/link'
import { markNotificationAsRead } from '@/app/actions/notifications'

interface Notification {
  id: string
  type: string
  title: string
  message: string
  isRead: boolean
  relatedId: string | null
  createdAt: Date
}

interface Props {
  notifications: Notification[]
}

export default function NotificationList({ notifications: initialNotifications }: Props) {
  const [notifications, setNotifications] = useState(initialNotifications)

  const handleMarkAsRead = async (id: string) => {
    try {
      await markNotificationAsRead(id)
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      )
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  const getNotificationLink = (notification: Notification) => {
    if (notification.type === 'WORK_ORDER_COMPLETED' && notification.relatedId) {
      return `/survey/${notification.relatedId}`
    }
    if (notification.type === 'FEEDBACK_RECEIVED' && notification.relatedId) {
      return `/work-orders/${notification.relatedId}`
    }
    return null
  }

  if (notifications.length === 0) {
    return (
      <div className="bg-app-card rounded-lg shadow-lg border border-app p-8 text-center">
        <p className="text-app-muted">ยังไม่มีการแจ้งเตือน</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {notifications.map((notification) => {
        const link = getNotificationLink(notification)
        const content = (
          <div
            className={`bg-app-card rounded-lg border border-app p-4 ${
              !notification.isRead
                ? 'border-[var(--app-btn-primary)] bg-[var(--app-btn-primary)]/5'
                : ''
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-app-heading">
                    {notification.title}
                  </h3>
                  {!notification.isRead && (
                    <span className="w-2 h-2 bg-[var(--app-btn-primary)] rounded-full"></span>
                  )}
                </div>
                <p className="text-sm text-app-body mb-2">{notification.message}</p>
                <p className="text-xs text-app-muted">
                  {new Date(notification.createdAt).toLocaleString('th-TH', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
              {!notification.isRead && (
                <button
                  onClick={() => handleMarkAsRead(notification.id)}
                  className="px-3 py-1 text-xs bg-[var(--app-btn-primary)] text-[var(--app-btn-primary-text)] rounded-lg hover:opacity-90 transition-opacity"
                >
                  อ่านแล้ว
                </button>
              )}
            </div>
          </div>
        )

        if (link) {
          return (
            <Link key={notification.id} href={link}>
              {content}
            </Link>
          )
        }

        return <div key={notification.id}>{content}</div>
      })}
    </div>
  )
}
