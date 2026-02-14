
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendLineMessage } from '@/app/lib/line-messaging'

export async function GET() {
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

        for (const user of users) {
            if (!user.lineUserId) continue

            const message = {
                type: "text" as const,
                text: `🔔 ทดสอบการเชื่อมต่อ LINE Notification (System Test)\nถึงคุณ: ${user.fullName || user.username}`
            }

            const result = await sendLineMessage(user.lineUserId, message)
            results.push({
                user: user.username,
                lineUserId: user.lineUserId,
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
