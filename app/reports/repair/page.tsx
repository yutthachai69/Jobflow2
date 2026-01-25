import { getCurrentUser } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { getWOStatus } from '@/lib/status-colors'

export const metadata = {
  title: 'รายงานการซ่อม - AirService Enterprise',
  description: 'รายงานงานซ่อม (CM) ตามสถานที่',
}

export default async function ReportsRepairPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/welcome')
  if (user.role !== 'CLIENT') {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <p className="text-app-muted">กรุณาเข้าสู่ระบบในฐานะลูกค้า</p>
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
          <p className="text-app-muted">กรุณาเข้าสู่ระบบในฐานะลูกค้า และมีสถานที่กำหนด หรือ ล็อกเอาท์แล้วล็อกอินใหม่</p>
          <Link href="/" className="mt-4 inline-block text-sm font-medium hover:underline" style={{ color: '#C2A66A' }}>
            ← กลับ Dashboard
          </Link>
        </div>
      </div>
    )
  }

  const site = await prisma.site.findUnique({
    where: { id: siteId },
    include: {
      client: true,
      workOrders: {
        where: { jobType: 'CM' },
        include: {
          jobItems: {
            include: {
              asset: { include: { room: { include: { floor: { include: { building: true } } } } } },
              technician: true,
            },
          },
        },
        orderBy: { scheduledDate: 'desc' },
      },
    },
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

  const rows = site.workOrders.flatMap((wo) =>
    wo.jobItems.map((ji) => ({
      workOrderId: wo.id,
      jobItemId: ji.id,
      scheduledDate: wo.scheduledDate,
      status: wo.status,
      jobItemStatus: ji.status,
      asset: ji.asset,
      technician: ji.technician,
      startTime: ji.startTime,
      endTime: ji.endTime,
      techNote: ji.techNote,
    }))
  )

  return (
    <div>
      <div className="mt-4 mb-8">
          <h1 className="text-2xl font-semibold text-app-heading">รายงานการซ่อม</h1>
          <p className="text-sm text-app-muted mt-1">
            {site.name} • {site.client.name}
          </p>
        </div>

        <div className="bg-app-card rounded-xl border border-app shadow-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-app">
            <h2 className="text-lg font-semibold text-app-heading">
              รายการงานซ่อม (CM) : {site.name}
            </h2>
            <p className="text-sm text-app-muted mt-1">รวม {rows.length} รายการ</p>
          </div>

          {rows.length === 0 ? (
            <div className="p-12 text-center text-app-muted">ยังไม่มีรายการงานซ่อม</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-app bg-app-section">
                    <th className="px-6 py-4 font-medium text-app-heading">วันที่</th>
                    <th className="px-6 py-4 font-medium text-app-heading">สถานะใบงาน</th>
                    <th className="px-6 py-4 font-medium text-app-heading">แอร์ / ตำแหน่ง</th>
                    <th className="px-6 py-4 font-medium text-app-heading">ช่าง</th>
                    <th className="px-6 py-4 font-medium text-app-heading">สถานะงาน</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => {
                    const st = getWOStatus(r.status)
                    const loc = r.asset.room?.floor?.building
                      ? `${r.asset.room.floor.building.name} → ${r.asset.room.floor.name} → ${r.asset.room.name}`
                      : '-'
                    return (
                      <tr key={r.jobItemId} className="border-b border-app hover:bg-app-section/50">
                        <td className="px-6 py-4 text-app-body">
                          {new Date(r.scheduledDate).toLocaleDateString('th-TH')}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex px-2 py-1 rounded text-xs font-medium ${st.tailwind}`}>
                            {st.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-app-body">
                          <Link
                            href={`/assets/${r.asset.id}`}
                            className="hover:underline"
                            style={{ color: '#C2A66A' }}
                          >
                            {r.asset.qrCode}
                          </Link>
                          <span className="text-app-muted ml-2">• {loc}</span>
                        </td>
                        <td className="px-6 py-4 text-app-body">
                          {r.technician?.fullName || r.technician?.username || '-'}
                        </td>
                        <td className="px-6 py-4 text-app-body capitalize">{r.jobItemStatus}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="mt-6 flex gap-4">
          <Link
            href="/reports/maintenance"
            className="text-sm font-medium hover:underline"
            style={{ color: '#C2A66A' }}
          >
            → รายงานการบำรุงรักษา
          </Link>
          <Link href="/" className="text-sm font-medium text-app-muted hover:text-app-body">
            ← กลับ Dashboard
          </Link>
        </div>
      </div>
  )
}
