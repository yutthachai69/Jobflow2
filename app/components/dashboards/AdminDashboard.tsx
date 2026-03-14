import { prisma } from "@/lib/prisma"
import Link from "next/link"
import EmptyState from "@/app/components/EmptyState"
import { getWOStatus } from "@/lib/status-colors"
import DateTimeDisplay from "@/app/components/DateTimeDisplay"
import SiteFilter from "./SiteFilter"
import { Suspense } from "react"

interface Props {
  siteId?: string;
}

export default async function AdminDashboard({ siteId }: Props) {
  // Fetch sites for the filter dropdown
  const sites = await prisma.site.findMany({
    orderBy: { name: 'asc' },
    select: { id: true, name: true }
  });

  // Build site filter condition
  const siteWhere = siteId ? { siteId } : {};
  const assetWhere = siteId
    ? { room: { floor: { building: { siteId } } } }
    : {};

  const [
    totalAssets,
    activeWorkOrders,
    completedToday,
    totalWorkOrders,
  ] = await Promise.all([
    prisma.asset.count({ where: assetWhere }),
    prisma.workOrder.count({ where: { status: { in: ["OPEN", "IN_PROGRESS"] }, ...siteWhere } }),
    prisma.workOrder.count({
      where: {
        status: "COMPLETED",
        updatedAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
        ...siteWhere,
      },
    }),
    prisma.workOrder.count({ where: siteWhere }),
  ])

  const recentWorkOrders = await prisma.workOrder.findMany({
    take: 5,
    orderBy: { createdAt: "desc" },
    where: siteWhere,
    include: {
      site: { include: { client: true } },
      jobItems: { include: { asset: true } },
    },
  })

  const progressData = await prisma.workOrder.findMany({
    where: { status: "IN_PROGRESS", ...siteWhere },
    include: {
      site: true,
      jobItems: true,
    },
  })

  const progressInfo = progressData.map((wo) => {
    const total = wo.jobItems.length
    const done = wo.jobItems.filter((j) => j.status === "DONE").length
    return { total, done, workOrder: wo }
  })

  const selectedSite = sites.find(s => s.id === siteId);

  return (
    <div className="p-4 md:p-8">
      <div className="w-full max-w-full">

        {/* Header + Filter */}
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-app-heading mb-1">Dashboard</h1>
            <p className="text-sm text-app-muted">
              {selectedSite ? `ภาพรวม: ${selectedSite.name}` : 'ภาพรวมทั้งระบบ'}
            </p>
          </div>
          <Suspense>
            <SiteFilter sites={sites} selectedSiteId={siteId ?? ''} />
          </Suspense>
        </div>

        {/* ปฏิทินและเวลา */}
        <div className="mb-6">
          <DateTimeDisplay />
        </div>

        {/* สถิติการ์ด */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'แอร์ทั้งหมด', value: totalAssets, emoji: '❄️', from: '#1d4ed8', to: '#1e40af', glow: 'rgba(59,130,246,0.25)', href: '/assets' },
            { label: 'งานที่ดำเนินการ', value: activeWorkOrders, emoji: '📋', from: '#c2a66a', to: '#92761a', glow: 'rgba(194,166,106,0.25)', href: '/work-orders' },
            { label: 'เสร็จสิ้นวันนี้', value: completedToday, emoji: '✅', from: '#059669', to: '#047857', glow: 'rgba(5,150,105,0.25)', href: '/work-orders' },
            { label: 'งานทั้งหมด', value: totalWorkOrders, emoji: '📊', from: '#7c3aed', to: '#6d28d9', glow: 'rgba(124,58,237,0.25)', href: '/work-orders' },
          ].map(({ label, value, emoji, from, to, glow, href }) => (
            <Link
              key={label}
              href={href}
              className="relative overflow-hidden rounded-2xl p-5 shadow-xl hover:shadow-2xl hover:scale-[1.03] transition-all duration-200 block border border-white/5"
              style={{ background: `linear-gradient(135deg, ${from}, ${to})`, boxShadow: `0 8px 24px ${glow}` }}
            >
              <div className="absolute -top-4 -right-4 w-20 h-20 rounded-full opacity-20" style={{ background: from }} />
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-2xl">{emoji}</span>
                </div>
                <p className="text-white font-bold text-3xl leading-none mb-1">{value}</p>
                <p className="text-white/70 text-xs font-medium">{label}</p>
              </div>
            </Link>
          ))}
        </div>

        {/* ความคืบหน้างาน */}
        {progressInfo.length > 0 && (
          <div className="bg-app-card rounded-lg border border-app shadow-lg mb-8 p-6">
            <h2 className="text-lg font-semibold text-app-heading mb-4">ความคืบหน้างานที่กำลังดำเนินการ</h2>
            <div className="space-y-4">
              {progressInfo.map((info) => (
                <div key={info.workOrder.id} className="border-b border-app pb-4 last:border-0">
                  <div className="flex justify-between items-center mb-2">
                    <div>
                      <Link href={`/work-orders/${info.workOrder.id}`} className="font-semibold hover:underline" style={{ color: '#C2A66A' }}>
                        {info.workOrder.jobType} - {info.workOrder.site.name}
                      </Link>
                      <p className="text-sm text-app-muted">{new Date(info.workOrder.scheduledDate).toLocaleDateString("th-TH")}</p>
                    </div>
                    <span className="text-sm font-medium text-app-body">{info.done}/{info.total}</span>
                  </div>
                  <div className="w-full rounded-full h-3 bg-app-section">
                    <div className="h-3 rounded-full transition-all" style={{ width: `${info.total > 0 ? (info.done / info.total) * 100 : 0}%`, backgroundColor: '#5B7C99' }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* งานล่าสุด */}
        <div className="bg-app-card rounded-lg border border-app shadow-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-app-heading">งานล่าสุด</h2>
            <Link href="/work-orders" className="text-sm font-medium hover:underline" style={{ color: '#C2A66A' }}>ดูทั้งหมด →</Link>
          </div>
          <div className="min-w-0 overflow-x-auto -mx-px">
            {recentWorkOrders.length === 0 ? (
              <div className="py-12">
                <EmptyState icon="📋" title="ยังไม่มีงานล่าสุด" description="เมื่อมีการสร้างใบสั่งงานใหม่ จะแสดงที่นี่" actionLabel="สร้างใบสั่งงานใหม่" actionHref="/work-orders/new" />
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-app-section border-b border-app">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-app-muted uppercase tracking-wider">ชนิดงาน</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-app-muted uppercase tracking-wider">สถานที่</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-app-muted uppercase tracking-wider">วันที่</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-app-muted uppercase tracking-wider">สถานะ</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-app-muted uppercase tracking-wider">รายการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-app">
                  {recentWorkOrders.map((wo) => {
                    const st = getWOStatus(wo.status)
                    return (
                      <tr key={wo.id} className="hover:bg-app-section/50 transition-colors">
                        <td className="px-4 py-3 font-medium text-app-heading">
                          <Link href={`/work-orders/${wo.id}`} className="hover:underline">{wo.jobType}</Link>
                        </td>
                        <td className="px-4 py-3 text-app-body">{wo.site.name} ({wo.site.client.name})</td>
                        <td className="px-4 py-3 text-app-body">{new Date(wo.scheduledDate).toLocaleDateString("th-TH")}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${st.tailwind}`}>{st.label}</span>
                        </td>
                        <td className="px-4 py-3 text-app-body">{wo.jobItems.length} รายการ</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { href: '/work-orders/new', label: 'สร้างใบสั่งงานใหม่', sub: 'เริ่มต้นงานใหม่', emoji: '➕', from: '#c2a66a', to: '#92761a', glow: 'rgba(194,166,106,0.25)' },
            { href: '/assets', label: 'ทรัพย์สินและอุปกรณ์', sub: 'เพิ่ม แก้ไข ลบเครื่อง', emoji: '⚙️', from: '#1d4ed8', to: '#1e40af', glow: 'rgba(59,130,246,0.25)' },
            { href: '/locations', label: 'จัดการสถานที่', sub: 'ตั้งค่าสถานที่ทำงาน', emoji: '📍', from: '#059669', to: '#047857', glow: 'rgba(5,150,105,0.25)' },
          ].map(({ href, label, sub, emoji, from, to, glow }) => (
            <Link
              key={href}
              href={href}
              className="relative overflow-hidden rounded-2xl p-5 shadow-xl hover:shadow-2xl hover:scale-[1.02] transition-all duration-200 block border border-white/5"
              style={{ background: `linear-gradient(135deg, ${from}, ${to})`, boxShadow: `0 8px 20px ${glow}` }}
            >
              <div className="absolute -top-3 -right-3 w-16 h-16 rounded-full opacity-20" style={{ background: from }} />
              <div className="relative z-10 text-center">
                <span className="text-3xl mb-2 block">{emoji}</span>
                <div className="font-semibold text-white">{label}</div>
                <div className="text-white/60 text-sm mt-1">{sub}</div>
              </div>
            </Link>
          ))}
        </div>

      </div>
    </div>
  )
}
