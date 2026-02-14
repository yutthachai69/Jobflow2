'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { randomBytes } from 'crypto'
import { sendLineMessage, createApprovalFlexMessage } from '@/app/lib/line-messaging'

// 1. Generate Link & Send to LINE (Called by Technician)
export async function sendForApproval(workOrderId: string) {
    try {
        // Generate secure token
        const token = randomBytes(32).toString('hex')

        // Update Work Order
        const workOrder = await prisma.workOrder.update({
            where: { id: workOrderId },
            data: {
                status: 'WAITING_APPROVAL',
                approvalToken: token
            },
            include: {
                jobItems: {
                    include: {
                        asset: {
                            include: {
                                room: { include: { floor: { include: { building: true } } } }
                            }
                        }
                    }
                }
            }
        })

        // Construct Approval URL
        // In production, use meaningful domain. For now use localhost or relative if handled by client redirect, but for LINE we need absolute.
        // We'll rely on NEXT_PUBLIC_BASE_URL or fallback to headers, but hardcoding for ensuring it works is safer for MVP if known.
        // Let's assume process.env.NEXT_PUBLIC_APP_URL is set, or default to something generic.
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
        const approvalLink = `${baseUrl}/approve/${token}`

        // Prepare LINE Message
        // Prepare LINE Message
        const jobItem = workOrder.jobItems[0]
        const assetName = jobItem?.asset ? `${jobItem.asset.brand} - ${jobItem.asset.model}` : 'Unknown Asset'
        const issue = workOrder.jobItems[0]?.techNote || workOrder.jobItems[0]?.checklist || 'ไม่ระบุรายละเอียด'

        // Send to Admin Group / Technician
        const adminGroupId = process.env.LINE_ADMIN_URI_ID
        const location = jobItem?.asset ? `${jobItem.asset.room.name} (${jobItem.asset.room.floor.building.name})` : 'ไม่ระบุสถานที่'

        const flexMessage = createApprovalFlexMessage(
            `${workOrder.workOrderNumber} - ${assetName}`,
            `อาการ: ${issue}\nสถานที่: ${location}`,
            approvalLink
        )

        if (adminGroupId) {
            await sendLineMessage(adminGroupId, flexMessage)
        }

        // Send to Client Users
        const clientUsers = await prisma.user.findMany({
            where: {
                role: 'CLIENT',
                siteId: workOrder.siteId,
                lineUserId: { not: null }
            }
        })

        if (clientUsers.length > 0) {
            console.log(`Sending approval request to ${clientUsers.length} clients`)
            await Promise.all(clientUsers.map(user =>
                sendLineMessage(user.lineUserId!, flexMessage)
            ))
        }

        revalidatePath(`/work-orders/${workOrderId}`)
        revalidatePath(`/technician/job-item/${workOrder.jobItems[0]?.id}`)
        return { success: true, link: approvalLink }

    } catch (error: any) {
        console.error('Error sending for approval:', error)
        return { success: false, error: 'Failed to send approval request' }
    }
}

// 2. Process Customer Decision (Called by Customer Page)
export async function processApproval(token: string, decision: 'APPROVE' | 'REJECT', reason?: string) {
    try {
        const workOrder = await prisma.workOrder.findUnique({
            where: { approvalToken: token }
        })

        if (!workOrder) {
            throw new Error('ไม่พบรายการ หรือลิงก์หมดอายุ')
        }

        if (workOrder.status !== 'WAITING_APPROVAL') {
            return { success: false, error: 'รายการนี้ได้รับการดำเนินการไปแล้ว' }
        }

        const newStatus = decision === 'APPROVE' ? 'APPROVED' : 'REJECTED'
        const updateData: any = {
            status: newStatus,
        }

        if (decision === 'APPROVE') {
            updateData.approvedAt = new Date()
        } else {
            updateData.rejectedAt = new Date()
            updateData.rejectionReason = reason
        }

        const updatedWorkOrder = await prisma.workOrder.update({
            where: { id: workOrder.id },
            data: updateData
        })

        // Notify Technician via LINE
        const adminGroupId = process.env.LINE_ADMIN_URI_ID
        if (adminGroupId) {
            const message = decision === 'APPROVE'
                ? `✅ ลูกค้าอนุมัติงานซ่อม ${workOrder.workOrderNumber} แล้ว! ทีมช่างสามารถเข้าดำเนินการได้เลย`
                : `❌ ลูกค้า "ไม่อนุมัติ" งานซ่อม ${workOrder.workOrderNumber}\nเหตุผล: ${reason || '-'}`

            await sendLineMessage(adminGroupId, { type: 'text', text: message })
        }

        return { success: true }

    } catch (error: any) {
        console.error('Error processing approval:', error)
        return { success: false, error: error.message }
    }
}
