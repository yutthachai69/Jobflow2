import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { getWOStatus } from '@/lib/status-colors'
import ClientDashboardCharts from './ClientDashboardCharts'
import DateTimeDisplay from '@/app/components/DateTimeDisplay'
import {
  type ChartGranularity,
  parseChartDate,
  toLocalDateKey,
  clampChartRange,
  buildWashChartSeries,
} from '@/lib/client-wash-chart'

interface ClientDashboardProps {
  siteId: string | null
  chartFrom: string
  chartTo: string
  chartGranularity: ChartGranularity
}

/** เป้าหมายจำนวนเครื่องต่อสัปดาห์ (ล้างใหญ่ / ล้างย่อย) — บนกราฟคำนวณตามจำนวนวันในช่วง (× วัน ÷ 7) */
const CLIENT_WEEKLY_WASH_TARGET_MAJOR = 5
const CLIENT_WEEKLY_WASH_TARGET_MINOR = 22.5

export default async function ClientDashboard({ siteId, chartFrom, chartTo, chartGranularity }: ClientDashboardProps) {
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
            include: {
              asset: true,
              technician: true,
              pmSchedule: { select: { pmType: true } },
            },
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

  const now = new Date()
  const parsedFrom = parseChartDate(chartFrom) ?? new Date(now.getFullYear(), now.getMonth(), 1)
  const parsedTo = parseChartDate(chartTo) ?? now
  const { from: rangeFrom, to: rangeTo, wasClamped: rangeWasClamped } = clampChartRange(parsedFrom, parsedTo)

  const granLabels: Record<ChartGranularity, string> = {
    day: 'รายวัน',
    week: 'รายสัปดาห์',
    month: 'รายเดือน',
    year: 'รายปี',
  }
  const filterSummary = `${rangeFrom.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })} – ${rangeTo.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })} • ${granLabels[chartGranularity]}`

  const allAssets = site.buildings.flatMap((b) =>
    b.floors.flatMap((f) => f.rooms.flatMap((r) => r.assets))
  )

  // "แอร์ทั้งหมด" ต้องนับเฉพาะ AIR_CONDITIONER (ไม่รวม EXHAUST)
  const airAssets = allAssets.filter((a) => (a as any).assetType === 'AIR_CONDITIONER')

  // กลุ่ม machineType ให้นับเฉพาะแอร์เท่านั้น
  const ahuCount = airAssets.filter(a => (a as any).machineType === 'AHU').length
  const fcuCount = airAssets.filter(a => (a as any).machineType === 'FCU').length
  const splitCount = airAssets.filter(a => (a as any).machineType === 'SPLIT_TYPE').length

  // Exhaust ให้นับจาก assetType = EXHAUST (ไม่ปนกับ machineType ของแอร์)
  const exhaustCount = allAssets.filter(a => (a as any).assetType === 'EXHAUST').length

  /** ขอบเขตนับเครื่องสำหรับวางแผน/อธิบายเป้า: แอร์ = ล้างใหญ่+ล้างย่อย, Exhaust = ล้างย่อยอย่างเดียว (ไม่มีล้างใหญ่) */
  const washMajorScopeCount = airAssets.length
  const washMinorScopeCount = airAssets.length + exhaustCount

  const activeWorkOrders = site.workOrders.filter((wo) => wo.status === 'OPEN' || wo.status === 'IN_PROGRESS')
  const inProgressJobItems = allAssets.flatMap((a) =>
    a.jobItems.filter((ji) => ji.status === 'IN_PROGRESS' || ji.status === 'PENDING')
  )
  const completedToday = site.workOrders.filter(
    (wo) => wo.status === 'COMPLETED' && new Date(wo.updatedAt).toDateString() === new Date().toDateString()
  ).length

  // กราฟการล้าง: นับ JobItem PM ที่เสร็จ (DONE) — ประเภทจากแผน PM หรือใบมือ (adHocPmType)
  const washDateForJobItem = (wo: { scheduledDate: Date }, ji: { endTime: Date | null; startTime: Date | null }) =>
    new Date(ji.endTime ?? ji.startTime ?? wo.scheduledDate)

  const washByDay = new Map<string, { majorWash: number; minorWashAir: number; minorWashExhaust: number }>()
  for (const wo of site.workOrders) {
    if (wo.jobType !== 'PM') continue
    for (const ji of wo.jobItems) {
      if (ji.status !== 'DONE') continue
      const pt = ji.pmSchedule?.pmType ?? ji.adHocPmType
      if (pt !== 'MAJOR' && pt !== 'MINOR') continue
      const d = washDateForJobItem(wo, ji)
      const k = toLocalDateKey(d)
      const cell = washByDay.get(k) ?? { majorWash: 0, minorWashAir: 0, minorWashExhaust: 0 }
      const assetType = (ji.asset as { assetType?: string }).assetType
      if (pt === 'MAJOR') {
        cell.majorWash += 1
      } else {
        if (assetType === 'EXHAUST') cell.minorWashExhaust += 1
        else cell.minorWashAir += 1
      }
      washByDay.set(k, cell)
    }
  }

  const { major: majorSeries, minor: minorSeries } = buildWashChartSeries(
    washByDay,
    rangeFrom,
    rangeTo,
    chartGranularity,
    CLIENT_WEEKLY_WASH_TARGET_MAJOR,
    CLIENT_WEEKLY_WASH_TARGET_MINOR
  )

  return (
    <div className="p-4 md:p-8">
      <div className="w-full max-w-full">
        {/* หัวแดชบอร์ด — ตัวกรอกกราฟอยู่ใน ClientDashboardCharts.tsx (use client) */}
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
            { label: 'แอร์ทั้งหมด', value: airAssets.length, emoji: '❄️', from: '#1d4ed8', to: '#1e40af', glow: 'rgba(59,130,246,0.25)', href: '/assets?type=AIR_CONDITIONER' },
            { label: 'AHU', value: ahuCount, emoji: '🌀', from: '#0891b2', to: '#0e7490', glow: 'rgba(8,145,178,0.25)', href: '/assets?type=AHU' },
            { label: 'FCU', value: fcuCount, emoji: '💨', from: '#7c3aed', to: '#6d28d9', glow: 'rgba(124,58,237,0.25)', href: '/assets?type=FCU' },
            { label: 'Split Type', value: splitCount, emoji: '❄️', from: '#059669', to: '#047857', glow: 'rgba(5,150,105,0.25)', href: '/assets?type=SPLIT_TYPE' },
            { label: 'Exhaust', value: exhaustCount, emoji: '💨', from: '#b45309', to: '#92400e', glow: 'rgba(180,83,9,0.25)', href: '/assets?type=EXHAUST' },
          ].map(({ label, value, emoji, from, to, glow, href }) => (
            <Link
              key={label}
              href={href}
              className="relative overflow-hidden rounded-2xl p-4 md:p-5 shadow-xl hover:shadow-2xl transition-shadow duration-200 block border border-white/5"
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
              className="relative overflow-hidden rounded-2xl p-5 shadow-xl hover:shadow-2xl transition-shadow duration-200 block border border-white/5"
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

        {/* กราฟการล้าง (ตัวกรอง URL อยู่ใน ClientDashboardCharts.tsx) */}
        <div className="mb-8">
          <ClientDashboardCharts
            majorSeries={majorSeries}
            minorSeries={minorSeries}
            weeklyWashTargetMajor={CLIENT_WEEKLY_WASH_TARGET_MAJOR}
            weeklyWashTargetMinor={CLIENT_WEEKLY_WASH_TARGET_MINOR}
            siteName={site.name}
            clientName={site.client.name}
            filterSummary={filterSummary}
            granularity={chartGranularity}
            rangeWasClamped={rangeWasClamped}
            washMajorScopeCount={washMajorScopeCount}
            washMinorScopeCount={washMinorScopeCount}
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
            { href: '/client/pm-plan', label: 'แผน PM', sub: 'ดูแผนบำรุงรักษารายปีของสาขา', emoji: '📅', from: '#0f766e', to: '#115e59', glow: 'rgba(15,118,110,0.2)' },
            { href: '/reports/maintenance', label: 'รายงาน', sub: 'รายงานการบำรุงรักษา & การซ่อม', emoji: '📊', from: '#7c3aed', to: '#6d28d9', glow: 'rgba(124,58,237,0.2)' },
          ].map(({ href, label, sub, emoji, from, to, glow }) => (
            <Link
              key={href}
              href={href}
              className="relative overflow-hidden rounded-2xl p-5 shadow-xl hover:shadow-2xl transition-shadow duration-200 block border border-white/5"
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
