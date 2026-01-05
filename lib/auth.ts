import { cookies } from 'next/headers'
import { prisma } from './prisma'

export const IDLE_TIMEOUT_MINUTES = 30 // Idle timeout 30 นาที
export const IDLE_TIMEOUT_MS = IDLE_TIMEOUT_MINUTES * 60 * 1000

export async function getCurrentUser() {
  const cookieStore = await cookies()
  const userId = cookieStore.get('user_id')?.value
  const lastActivity = cookieStore.get('session_last_activity')?.value

  if (!userId) {
    return null
  }

  // เช็ค idle timeout (30 นาที) - middleware จะจัดการ clear cookies แล้ว
  if (lastActivity) {
    const lastActivityTime = parseInt(lastActivity, 10)
    const now = Date.now()
    const timeSinceLastActivity = now - lastActivityTime

    if (timeSinceLastActivity > IDLE_TIMEOUT_MS) {
      // Session หมดอายุเนื่องจาก idle timeout
      // ไม่ต้อง clear cookies ที่นี่ (middleware จะจัดการ)
      return null
    }
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        site: {
          include: {
            client: true,
          },
        },
      },
    })

    if (!user) {
      return null
    }

    return user
  } catch (error) {
    return null
  }
}

export async function setSession(userId: string) {
  const cookieStore = await cookies()
  const now = Date.now().toString()
  
  cookieStore.set('user_id', userId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  })
  
  // เก็บ timestamp ของ lastActivity
  cookieStore.set('session_last_activity', now, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days (same as user_id cookie)
  })
}

export async function clearSession() {
  const cookieStore = await cookies()
  cookieStore.delete('user_id')
  cookieStore.delete('session_last_activity')
}


