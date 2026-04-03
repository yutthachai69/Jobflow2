import { getCurrentUser } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { getWOStatus, getJobStatus } from '@/lib/status-colors'

export const metadata = {
  title: 'รายงานการซ่อม - LMT air service',
  description: 'รายงานงานซ่อม (CM) ตามสถานที่',
}

/** กรองตาม JobItem (แนว A): ยังไม่ปิดรายการ vs ปิดแล้ว */
const CM_ACTIVE_ITEM_STATUSES = ['PENDING', 'IN_PROGRESS', 'ISSUE_FOUND'] as const

function filterRepairRowsByJobItem<T extends { jobItemStatus: string }>(
  rows: T[],
  filter: string | undefined
): T[] {
  if (filter === 'active') {
    return rows.filter((r) =>
      (CM_ACTIVE_ITEM_STATUSES as readonly string[]).includes(r.jobItemStatus)
    )
  }
  if (filter === 'done') {
    return rows.filter((r) => r.jobItemStatus === 'DONE')
  }
  return rows
}

export default async function ReportsRepairPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>
}) {
  const { filter: filterRaw } = await searchParams
  const filter =
    filterRaw === 'active' || filterRaw === 'done' ? filterRaw : undefined
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

  const rows = site.workOrders
    .flatMap((wo) =>
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
    .sort((a, b) => {
      const d = new Date(b.scheduledDate).getTime() - new Date(a.scheduledDate).getTime()
      if (d !== 0) return d
      return (a.asset.qrCode || '').localeCompare(b.asset.qrCode || '')
    })

  const filteredRows = filterRepairRowsByJobItem(rows, filter)
  const filterLabel =
    filter === 'active'
      ? 'กำลังดำเนินการ (รายการยังไม่ปิด)'
      : filter === 'done'
        ? 'ซ่อมเสร็จแล้ว (รายการปิดแล้ว)'
        : 'ทั้งหมด'

  return (
    <div>
      <div className="mt-4 mb-8">
        <h1 className="text-2xl font-semibold text-app-heading">รายงานการซ่อม</h1>
        <p className="text-sm text-app-muted mt-1">
          {site.name} • {site.client.name}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            href="/reports/repair"
            className={`rounded-lg px-3 py-1.5 text-sm font-medium border transition-colors ${
              !filter
                ? 'border-[var(--app-btn-primary)] bg-[var(--app-btn-primary)]/10 text-[var(--app-btn-primary)]'
                : 'border-app text-app-muted hover:bg-app-section'
            }`}
          >
            ทั้งหมด
          </Link>
          <Link
            href="/reports/repair?filter=active"
            className={`rounded-lg px-3 py-1.5 text-sm font-medium border transition-colors ${
              filter === 'active'
                ? 'border-[var(--app-btn-primary)] bg-[var(--app-btn-primary)]/10 text-[var(--app-btn-primary)]'
                : 'border-app text-app-muted hover:bg-app-section'
            }`}
          >
            กำลังดำเนินการ
          </Link>
          <Link
            href="/reports/repair?filter=done"
            className={`rounded-lg px-3 py-1.5 text-sm font-medium border transition-colors ${
              filter === 'done'
                ? 'border-[var(--app-btn-primary)] bg-[var(--app-btn-primary)]/10 text-[var(--app-btn-primary)]'
                : 'border-app text-app-muted hover:bg-app-section'
            }`}
          >
            เสร็จแล้ว
          </Link>
        </div>
      </div>

      <div className="bg-app-card rounded-xl border border-app shadow-lg overflow-hidden">
        <div className="px-4 py-3 sm:px-6 sm:py-4 border-b border-app">
          <h2 className="text-base sm:text-lg font-semibold text-app-heading">
            รายการงานซ่อม (CM) : {site.name}
          </h2>
          <p className="text-sm text-app-muted mt-1">
            มุมมอง: {filterLabel}
            {filter
              ? ` — แสดง ${filteredRows.length} จาก ${rows.length} รายการ`
              : ` — รวม ${rows.length} รายการ`}
          </p>
        </div>

        {rows.length === 0 ? (
          <div className="p-8 sm:p-12 text-center text-app-muted text-sm sm:text-base">ยังไม่มีรายการงานซ่อม</div>
        ) : filteredRows.length === 0 ? (
          <div className="p-8 sm:p-12 text-center text-app-muted text-sm sm:text-base">
            ไม่มีรายการในหมวดนี้ (ลองเปลี่ยนแท็บด้านบน)
          </div>
        ) : (
          <div className="overflow-x-auto -mx-px">
            <table className="w-full min-w-[640px] sm:min-w-0 table-fixed text-left text-sm" role="table">
              <colgroup>
                <col style={{ width: '14%' }} />
                <col style={{ width: '16%' }} />
                <col style={{ width: '44%' }} />
                <col style={{ width: '14%' }} />
                <col style={{ width: '12%' }} />
              </colgroup>
              <thead>
                <tr className="border-b border-app bg-[var(--app-section)]">
                  <th scope="col" className="px-3 py-2 sm:px-6 sm:py-2 font-medium text-app-heading text-xs sm:text-sm">วันที่</th>
                  <th scope="col" className="px-3 py-2 sm:px-6 sm:py-2 font-medium text-app-heading text-xs sm:text-sm">สถานะใบงาน</th>
                  <th scope="col" className="px-3 py-2 sm:px-6 sm:py-2 font-medium text-app-heading text-xs sm:text-sm">แอร์ / ตำแหน่ง</th>
                  <th scope="col" className="px-3 py-2 sm:px-6 sm:py-2 font-medium text-app-heading text-xs sm:text-sm">ช่าง</th>
                  <th scope="col" className="px-3 py-2 sm:px-6 sm:py-2 font-medium text-app-heading text-xs sm:text-sm">สถานะงาน</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((r) => {
                  const st = getWOStatus(r.status)
                  const jobSt = getJobStatus(r.jobItemStatus)
                  const loc = r.asset.room?.floor?.building
                    ? `${r.asset.room.floor.building.name} → ${r.asset.room.floor.name} → ${r.asset.room.name}`
                    : '-'
                  return (
                    <tr key={r.jobItemId} className="border-b border-app hover:bg-app-section/50">
                      <td className="px-3 py-3 sm:px-6 sm:py-4 text-app-body text-xs sm:text-sm">
                        {new Date(r.scheduledDate).toLocaleDateString('th-TH')}
                      </td>
                      <td className="px-3 py-3 sm:px-6 sm:py-4">
                        <span className={`inline-flex whitespace-nowrap px-2 py-0.5 sm:py-1 rounded text-xs font-medium ${st.tailwind}`}>
                          {st.label}
                        </span>
                      </td>
                      <td className="px-3 py-3 sm:px-6 sm:py-4 text-app-body min-w-0">
                        <div className="flex flex-col min-w-0">
                          <Link
                            href={`/assets/${r.asset.id}`}
                            className="font-medium hover:underline truncate"
                            style={{ color: '#C2A66A' }}
                          >
                            {r.asset.qrCode}
                          </Link>
                          <span className="text-xs text-app-muted break-words">{loc}</span>
                        </div>
                      </td>
                      <td className="px-3 py-3 sm:px-6 sm:py-4 text-app-body text-xs sm:text-sm">
                        {r.technician?.fullName || r.technician?.username || '-'}
                      </td>
                      <td className="px-3 py-3 sm:px-6 sm:py-4">
                        <span className={`inline-flex whitespace-nowrap px-2 py-0.5 sm:py-1 rounded text-xs font-medium ${jobSt.tailwind}`}>
                          {jobSt.label}
                        </span>
                      </td>
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
