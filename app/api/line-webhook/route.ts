import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import crypto from 'crypto'

// LINE Webhook Signature Verification
function verifySignature(body: string, signature: string): boolean {
    const channelSecret = process.env.LINE_CHANNEL_SECRET
    if (!channelSecret) return false

    const hmac = crypto.createHmac('SHA256', channelSecret)
    hmac.update(body)
    const digest = hmac.digest('base64')
    return digest === signature
}

// Reply message ผ่าน LINE Messaging API
async function replyMessage(replyToken: string, text: string) {
    const accessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN
    if (!accessToken) return

    await fetch('https://api.line.me/v2/bot/message/reply', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
            replyToken,
            messages: [{ type: 'text', text }],
        }),
    })
}

// GET - สำหรับ LINE Console verify webhook
export async function GET() {
    return NextResponse.json({ status: 'ok' })
}

// POST - รับ Webhook events จาก LINE
export async function POST(req: Request) {
    try {
        const bodyText = await req.text()
        const signature = req.headers.get('x-line-signature') || ''

        // ตรวจสอบ Signature (ป้องกัน request ปลอม)
        if (!verifySignature(bodyText, signature)) {
            return NextResponse.json({ error: 'Invalid signature' }, { status: 403 })
        }

        const body = JSON.parse(bodyText)
        const events = body.events || []

        for (const event of events) {
            // รับเฉพาะ message event ที่เป็น text
            if (event.type !== 'message' || event.message.type !== 'text') continue

            const lineUserId = event.source?.userId
            const messageText = event.message.text?.trim()
            const replyToken = event.replyToken

            if (!lineUserId || !messageText || !replyToken) continue

            // เช็คว่าข้อความขึ้นต้นด้วย "เชื่อมต่อ"
            const connectMatch = messageText.match(/^เชื่อมต่อ\s+(.+)$/i)

            if (connectMatch) {
                const username = connectMatch[1].trim()

                // หา user ใน DB
                const user = await prisma.user.findFirst({
                    where: {
                        username: username,
                    },
                    select: { id: true, username: true, fullName: true, lineUserId: true },
                })

                if (!user) {
                    await replyMessage(replyToken, `❌ ไม่พบ Username "${username}" ในระบบ JobFlow\nกรุณาตรวจสอบ Username แล้วลองใหม่`)
                    continue
                }

                // เช็คว่าเคยเชื่อมต่อแล้วหรือยัง
                if (user.lineUserId) {
                    await replyMessage(replyToken, `⚠️ บัญชี "${user.username}" เชื่อมต่อ LINE แล้ว\nหากต้องการเปลี่ยน กรุณาติดต่อ Admin`)
                    continue
                }

                // บันทึก lineUserId
                await prisma.user.update({
                    where: { id: user.id },
                    data: { lineUserId },
                })

                const displayName = user.fullName || user.username
                await replyMessage(replyToken, `✅ เชื่อมต่อสำเร็จ!\n\n👤 บัญชี: ${displayName} (${user.username})\n🔗 LINE UID: ${lineUserId}\n\nระบบจะส่งการแจ้งเตือนผ่าน LINE ให้คุณแล้วครับ`)
            }
            // ข้อความอื่นๆ → ไม่ต้องตอบ (หรือตอบก็ได้)
        }

        return NextResponse.json({ status: 'ok' })

    } catch (error: any) {
        console.error('LINE Webhook Error:', error)
        return NextResponse.json({ status: 'ok' }) // LINE ต้องการ 200 เสมอ
    }
}
