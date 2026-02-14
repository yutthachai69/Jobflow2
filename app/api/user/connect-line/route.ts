
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/session'

export async function POST(req: Request) {
    try {
        const user = await getCurrentUser().catch(() => null)

        if (!user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        const body = await req.json()
        const { lineUserId } = body

        if (!lineUserId) {
            return NextResponse.json(
                { error: 'LINE User ID is required' },
                { status: 400 }
            )
        }

        // Update user with Line User ID
        await prisma.user.update({
            where: { id: user.id },
            data: { lineUserId }
        })

        return NextResponse.json({ success: true })

    } catch (error: any) {
        console.error('Error connecting LINE:', error)
        return NextResponse.json(
            { error: 'Failed to connect LINE account' },
            { status: 500 }
        )
    }
}
