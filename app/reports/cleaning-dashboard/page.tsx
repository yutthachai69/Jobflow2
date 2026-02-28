import { getCurrentUser } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import CleaningDashboardClient from './CleaningDashboardClient'

export const metadata = {
    title: 'รายงานการล้างแอร์ - LMT air service',
    description: 'Cleaning Air Conditioner Report Dashboard',
}

export default async function CleaningDashboardPage() {
    const user = await getCurrentUser()
    if (!user) redirect('/welcome')

    if (user.role !== 'CLIENT' && user.role !== 'ADMIN') {
        return (
            <div className="p-8 flex items-center justify-center min-h-[60vh]">
                <div className="text-center">
                    <p className="text-app-muted">ไม่มีสิทธิ์เข้าถึงหน้านี้</p>
                    <Link href="/" className="mt-4 inline-block text-sm font-medium hover:underline" style={{ color: '#C2A66A' }}>
                        ← กลับ Dashboard
                    </Link>
                </div>
            </div>
        )
    }

    let siteId = user.siteId
    if (!siteId) {
        const dbUser = await prisma.user.findUnique({
            where: { id: user.userId },
            select: { siteId: true },
        })
        siteId = dbUser?.siteId ?? null
    }

    if (!siteId) {
        return (
            <div className="p-8 flex items-center justify-center min-h-[60vh]">
                <div className="text-center">
                    <p className="text-app-muted">ไม่พบข้อมูลสถานที่ กรุณาติดต่อผู้ดูแลระบบ</p>
                    <Link href="/" className="mt-4 inline-block text-sm font-medium hover:underline" style={{ color: '#C2A66A' }}>
                        ← กลับ Dashboard
                    </Link>
                </div>
            </div>
        )
    }

    const site = await prisma.site.findUnique({
        where: { id: siteId },
        include: { client: true },
    })

    if (!site) {
        return (
            <div className="p-8 flex items-center justify-center min-h-[60vh]">
                <div className="text-center">
                    <p className="text-app-muted">ไม่พบข้อมูลสถานที่</p>
                    <Link href="/" className="mt-4 inline-block text-sm font-medium hover:underline" style={{ color: '#C2A66A' }}>
                        ← กลับ Dashboard
                    </Link>
                </div>
            </div>
        )
    }

    // Fetch all PM JobItems for this site (no date filter on server — client handles filtering)
    const jobItems = await prisma.jobItem.findMany({
        where: {
            workOrder: {
                jobType: 'PM',
                siteId: siteId,
            },
        },
        include: {
            asset: {
                include: {
                    room: {
                        include: {
                            floor: {
                                include: { building: true },
                            },
                        },
                    },
                },
            },
            workOrder: {
                select: {
                    id: true,
                    scheduledDate: true,
                    status: true,
                    jobType: true,
                },
            },
        },
        orderBy: {
            workOrder: { scheduledDate: 'desc' },
        },
    })

    const plain = JSON.parse(JSON.stringify(jobItems))

    return (
        <CleaningDashboardClient
            jobItems={plain}
            siteName={site.name}
            clientName={site.client.name}
        />
    )
}
