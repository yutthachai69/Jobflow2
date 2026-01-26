import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // ตรวจสอบว่า Notification table มีอยู่หรือไม่
    try {
      const unreadCount = await prisma.notification.count({
        where: {
          userId: user.userId,
          isRead: false,
        },
      })

      return NextResponse.json({ unreadCount })
    } catch (dbError: any) {
      // ถ้า table ไม่มีอยู่ ให้ return 0 แทน
      if (dbError.message?.includes('does not exist') || dbError.message?.includes('no such table')) {
        if (process.env.NODE_ENV !== 'production') {
          console.warn('[Notifications API] Notification table does not exist, returning 0')
        }
        return NextResponse.json({ unreadCount: 0 })
      }
      throw dbError
    }
  } catch (error: any) {
    // Log errors (important for debugging, but only show details in development)
    console.error('[Notifications API] Error:', error.message)
    if (process.env.NODE_ENV !== 'production') {
      console.error('[Notifications API] Error details:', {
        message: error.message,
        stack: error.stack,
      })
    }
    // Return 0 instead of error to prevent UI issues
    return NextResponse.json({ unreadCount: 0 })
  }
}
