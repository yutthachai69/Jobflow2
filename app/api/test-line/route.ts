import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendLineMessage } from '@/app/lib/line-messaging'
import { getCurrentUser } from '@/lib/auth'

export async function GET() {
  const user = await getCurrentUser().catch(() => null)
  if (!user || user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const users = await prisma.user.findMany({
            where: {
                lineUserId: { not: null }
            },
            select: {
                id: true,
                username: true,
                fullName: true,
                lineUserId: true
            }
        })

        if (users.length === 0) {
            return NextResponse.json({
                success: false,
                message: 'No users found with LINE User ID. Please edit a user and add one.'
            })
        }

        const results = []

        for (const lineUser of users) {
            if (!lineUser.lineUserId) continue

            const message = {
                type: "text" as const,
                text: `🔔 ทดสอบการเชื่อมต่อ LINE Notification (System Test)\nถึงคุณ: ${lineUser.fullName || lineUser.username}`
            }

            const result = await sendLineMessage(lineUser.lineUserId, message)
            results.push({
                user: lineUser.username,
                lineUserId: lineUser.lineUserId,
                sent: result?.success ?? false,
                error: result?.error
            })
        }

        return NextResponse.json({
            success: true,
            usersFound: users.length,
            results
        })

    } catch (error: any) {
        return NextResponse.json({
            success: false,
            error: error.message
        }, { status: 500 })
    }
}
