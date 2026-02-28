import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { getWOStatus } from '@/lib/status-colors'
import ClientDashboardCharts from './ClientDashboardCharts'
import DateTimeDisplay from '@/app/components/DateTimeDisplay'

interface ClientDashboardProps {
  siteId: string | null
}

function toDateKey(d: Date) {
  return d.toISOString().slice(0, 10)
}

function toMonthKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

const MONTH_LABELS: Record<string, string> = {
  '1': 'ม.ค.', '2': 'ก.พ.', '3': 'มี.ค.', '4': 'เม.ย.', '5': 'พ.ค.', '6': 'มิ.ย.',
  '7': 'ก.ค.', '8': 'ส.ค.', '9': 'ก.ย.', '10': 'ต.ค.', '11': 'พ.ย.', '12': 'ธ.ค.',
}

export default async function ClientDashboard({ siteId }: ClientDashboardProps) {
  if (!siteId) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <svg className="w-16 h-16 mx-auto mb-4" style={{ color: '#C2A66A' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h1 className="text-2xl font-bold text-app-heading mb-2">ไม่พบข้อมูลสถานที่</h1>
          <p className="text-app-muted">กรุณาติดต่อผู้ดูแลระบบ หรือ ล็อกเอาท์แล้วล็อกอินใหม่</p>
        </div>
      </div>
    )
  }

  const site = await prisma.site.findUnique({
    where: { id: siteId },
    include: {
      client: true,
      buildings: {
        include: {
          floors: {
            include: {
              rooms: {
                include: {
                  assets: {
                    include: {
                      jobItems: {
                        include: { workOrder: true, technician: true },
                        orderBy: { startTime: 'desc' as const },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      workOrders: {
        include: {
          jobItems: {
            include: { asset: true, technician: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      },
    },
  })

  if (!site) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <svg className="w-16 h-16 mx-auto mb-4" style={{ color: '#C2A66A' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h1 className="text-2xl font-bold text-app-heading mb-2">ไม่พบข้อมูลสถานที่</h1>
          <p className="text-app-muted">กรุณาติดต่อผู้ดูแลระบบ</p>
        </div>
      </div>
    )
  }

  const allAssets = site.buildings.flatMap((b) =>
    b.floors.flatMap((f) => f.rooms.flatMap((r) => r.assets))
  )

  const ahuCount = allAssets.filter(a => (a as any).machineType === 'AHU').length
  const fcuCount = allAssets.filter(a => (a as any).machineType === 'FCU').length
  const splitCount = allAssets.filter(a => (a as any).machineType === 'SPLIT_TYPE').length
  const exhaustCount = allAssets.filter(a => (a as any).machineType === 'EXHAUST').length

  const activeWorkOrders = site.workOrders.filter((wo) => wo.status === 'OPEN' || wo.status === 'IN_PROGRESS')
  const inProgressJobItems = allAssets.flatMap((a) =>
    a.jobItems.filter((ji) => ji.status === 'IN_PROGRESS' || ji.status === 'PENDING')
  )
  const completedToday = site.workOrders.filter(
    (wo) => wo.status === 'COMPLETED' && new Date(wo.updatedAt).toDateString() === new Date().toDateString()
  ).length

  // สร้างข้อมูลกราฟรายวัน (ย้อนหลัง 30 วัน)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const dailyMap: Record<string, { PM: number; CM: number; INSTALL: number }> = {}
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const k = toDateKey(d)
    dailyMap[k] = { PM: 0, CM: 0, INSTALL: 0 }
  }
  for (const wo of site.workOrders) {
    const k = toDateKey(new Date(wo.scheduledDate))
    if (!dailyMap[k]) continue
    const jt = wo.jobType as 'PM' | 'CM' | 'INSTALL'
    if (jt === 'PM' || jt === 'CM' || jt === 'INSTALL') dailyMap[k][jt] += 1
  }
  const dailyData = Object.entries(dailyMap)
    .map(([date, v]) => ({
      date: new Date(date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' }),
      PM: v.PM,
      CM: v.CM,
      INSTALL: v.INSTALL,
      รวม: v.PM + v.CM + v.INSTALL,
    }))

  // สร้างข้อมูลกราฟรายเดือน (ย้อนหลัง 6 เดือน)
  const monthMap: Record<string, { PM: number; CM: number; INSTALL: number }> = {}
  for (let i = 5; i >= 0; i--) {
    const d = new Date(today.getFullYear(), today.getMonth() - i, 1)
    const k = toMonthKey(d)
    const [y, m] = k.split('-')
    monthMap[k] = { PM: 0, CM: 0, INSTALL: 0 }
  }
  for (const wo of site.workOrders) {
    const k = toMonthKey(new Date(wo.scheduledDate))
    if (!monthMap[k]) continue
    const jt = wo.jobType as 'PM' | 'CM' | 'INSTALL'
    if (jt === 'PM' || jt === 'CM' || jt === 'INSTALL') monthMap[k][jt] += 1
  }
  const monthlyData = Object.entries(monthMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => {
      const [, m] = k.split('-')
      return {
        เดือน: MONTH_LABELS[m] || m,
        PM: v.PM,
        CM: v.CM,
        INSTALL: v.INSTALL,
        รวม: v.PM + v.CM + v.INSTALL,
      }
    })

  return (
    <div className="p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Welcome + สรุปสั้นๆ ให้ไม่งง */}
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-app-heading mb-2">แดชบอร์ด</h1>
          <p className="text-app-muted mb-1">
            {site.name} • {site.client.name}
          </p>
          <p className="text-sm text-app-muted max-w-2xl">
            ภาพรวมงานล้างแอร์ บำรุงรักษา และซ่อมแซมในสถานที่ของคุณ — ดูสถานะล่าสุด สถิติ และงานที่กำลังดำเนินการได้ด้านล่าง
          </p>
        </div>

        {/* ปฏิทินและเวลา */}
        <div className="mb-6">
          <DateTimeDisplay />
        </div>

        {/* สถิติการ์ดแอร์ */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-4">
          {[
            { label: 'แอร์ทั้งหมด', value: allAssets.length, emoji: '❄️', from: '#1d4ed8', to: '#1e40af', glow: 'rgba(59,130,246,0.25)', href: '/assets' },
            { label: 'AHU', value: ahuCount, emoji: '🌀', from: '#0891b2', to: '#0e7490', glow: 'rgba(8,145,178,0.25)', href: '/assets' },
            { label: 'FCU', value: fcuCount, emoji: '💨', from: '#7c3aed', to: '#6d28d9', glow: 'rgba(124,58,237,0.25)', href: '/assets' },
            { label: 'Split Type', value: splitCount, emoji: '❄️', from: '#059669', to: '#047857', glow: 'rgba(5,150,105,0.25)', href: '/assets' },
            { label: 'Exhaust', value: exhaustCount, emoji: '💨', from: '#b45309', to: '#92400e', glow: 'rgba(180,83,9,0.25)', href: '/assets' },
          ].map(({ label, value, emoji, from, to, glow, href }) => (
            <Link
              key={label}
              href={href}
              className="relative overflow-hidden rounded-2xl p-4 md:p-5 shadow-xl hover:shadow-2xl hover:scale-[1.03] transition-all duration-200 block border border-white/5"
              style={{ background: `linear-gradient(135deg, ${from}, ${to})`, boxShadow: `0 8px 24px ${glow}` }}
            >
              <div className="absolute -top-3 -right-3 w-16 h-16 rounded-full opacity-20" style={{ background: from }} />
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xl">{emoji}</span>
                  <span className="text-white/50 text-[10px] font-medium uppercase tracking-wide">{label}</span>
                </div>
                <p className="text-white font-bold text-2xl md:text-3xl leading-none">{value}</p>
                <p className="text-white/60 text-xs mt-1">เครื่อง</p>
              </div>
            </Link>
          ))}
        </div>

        {/* สถิติการทำงาน */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {[
            { label: 'งานที่กำลังดำเนินการ', value: activeWorkOrders.length, emoji: '📋', from: '#c2a66a', to: '#92761a', glow: 'rgba(194,166,106,0.25)', href: '/work-orders' },
            { label: 'เสร็จสิ้นวันนี้', value: completedToday, emoji: '✅', from: '#059669', to: '#047857', glow: 'rgba(5,150,105,0.25)', href: '/work-orders' },
            { label: 'เครื่องที่กำลังซ่อม/บำรุง', value: inProgressJobItems.length, emoji: '🔧', from: '#475569', to: '#334155', glow: 'rgba(71,85,105,0.25)', href: '/work-orders' },
          ].map(({ label, value, emoji, from, to, glow, href }) => (
            <Link
              key={label}
              href={href}
              className="relative overflow-hidden rounded-2xl p-5 shadow-xl hover:shadow-2xl hover:scale-[1.02] transition-all duration-200 block border border-white/5"
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

        {/* กราฟ */}
        <div className="mb-8">
          <ClientDashboardCharts
            dailyData={dailyData}
            monthlyData={monthlyData}
            siteName={site.name}
            clientName={site.client.name}
          />
        </div>

        {/* งานล่าสุด */}
        <div className="bg-app-card rounded-xl border border-app shadow-lg p-6 mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-app-heading">งานล่าสุด</h2>
            <Link href="/work-orders" className="text-sm font-medium hover:underline" style={{ color: '#C2A66A' }}>
              ดูทั้งหมด →
            </Link>
          </div>
          {site.workOrders.slice(0, 5).length > 0 ? (
            <div className="space-y-3">
              {site.workOrders.slice(0, 5).map((wo) => {
                const st = getWOStatus(wo.status)
                return (
                  <Link
                    key={wo.id}
                    href={`/work-orders/${wo.id}`}
                    className="block p-4 bg-app-section hover:bg-app-section/80 rounded-lg border border-app border-l-4 transition-all"
                    style={{ borderLeftColor: st.hex }}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                          <span className="font-medium text-app-heading">
                            {wo.jobType === 'PM' ? 'PM - บำรุงรักษา' : wo.jobType === 'CM' ? 'CM - ซ่อมฉุกเฉิน' : 'INSTALL - ติดตั้งใหม่'}
                          </span>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${st.tailwind}`}>{st.label}</span>
                        </div>
                        <div className="text-sm text-app-muted">
                          <span>{new Date(wo.scheduledDate).toLocaleDateString('th-TH')}</span>
                          <span className="mx-2">•</span>
                          <span>{wo.jobItems.length} เครื่อง</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-app-muted">ยังไม่มีงาน</div>
          )}
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { href: '/assets', label: 'ทรัพย์สินและอุปกรณ์', sub: 'ดูรายการแอร์ทั้งหมดในสถานที่', emoji: '❄️', from: '#1d4ed8', to: '#1e40af', glow: 'rgba(59,130,246,0.2)' },
            { href: '/work-orders', label: 'ประวัติงาน', sub: 'ดูประวัติการทำงานทั้งหมด', emoji: '📋', from: '#c2a66a', to: '#92761a', glow: 'rgba(194,166,106,0.2)' },
            { href: '/reports/maintenance', label: 'รายงาน', sub: 'รายงานการบำรุงรักษา & การซ่อม', emoji: '📊', from: '#7c3aed', to: '#6d28d9', glow: 'rgba(124,58,237,0.2)' },
            { href: '/contact', label: 'ติดต่อเรา', sub: 'แจ้งปัญหาหรือสอบถามข้อมูล', emoji: '📞', from: '#059669', to: '#047857', glow: 'rgba(5,150,105,0.2)' },
          ].map(({ href, label, sub, emoji, from, to, glow }) => (
            <Link
              key={href}
              href={href}
              className="relative overflow-hidden rounded-2xl p-5 shadow-xl hover:shadow-2xl hover:scale-[1.02] transition-all duration-200 block border border-white/5"
              style={{ background: `linear-gradient(135deg, ${from}, ${to})`, boxShadow: `0 8px 20px ${glow}` }}
            >
              <div className="absolute -top-3 -right-3 w-16 h-16 rounded-full opacity-20" style={{ background: from }} />
              <div className="relative z-10">
                <span className="text-2xl mb-2 block">{emoji}</span>
                <h3 className="text-base font-semibold text-white mb-1">{label}</h3>
                <p className="text-white/60 text-xs">{sub}</p>
              </div>
            </Link>
          ))}
        </div>

      </div>
    </div>
  )
}
