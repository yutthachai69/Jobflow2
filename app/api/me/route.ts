import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const user = await getCurrentUser()
    
    let unreadMessageCount = 0
    if (user?.role === 'ADMIN') {
      try {
        unreadMessageCount = await prisma.contactMessage.count({
          where: { isRead: false },
        })
      } catch {
        unreadMessageCount = 0
      }
    }

    // Debug log - commented out to reduce console noise
    // Uncomment if you need to debug /api/me endpoint:
    // if (process.env.NODE_ENV !== 'production' && process.env.DEBUG_API === 'true') {
    //   console.log('[API /me] User:', user)
    // }

    const response = NextResponse.json({
      role: user?.role || null,
      unreadMessageCount,
    })

    // ตั้ง cache headers สำหรับ client
    response.headers.set('Cache-Control', 'private, no-cache, no-store, must-revalidate')
    response.headers.set('Pragma', 'no-cache')
    
    return response
  } catch (error) {
    // Log errors (important for debugging)
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error('[API /me] Error:', errorMessage)
    if (process.env.NODE_ENV !== 'production') {
      console.error('[API /me] Error details:', error)
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
