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

        {/* สถิติการ์ด */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'แอร์ทั้งหมด', value: allAssets.length, icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6', color: '#5B7C99', bg: 'rgba(91,124,153,0.2)' },
            { label: 'งานที่กำลังดำเนินการ', value: activeWorkOrders.length, icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2', color: '#C2A66A', bg: 'rgba(194,166,106,0.2)' },
            { label: 'เสร็จสิ้นวันนี้', value: completedToday, icon: 'M5 13l4 4L19 7', color: '#5E8F75', bg: 'rgba(94,143,117,0.2)' },
            { label: 'เครื่องที่กำลังซ่อม/บำรุง', value: inProgressJobItems.length, icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z', color: '#8A8A8A', bg: 'rgba(138,138,138,0.2)' },
          ].map(({ label, value, icon, color, bg }) => (
            <div key={label} className="bg-app-card rounded-xl border border-app p-6 shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-app-muted mb-1">{label}</p>
                  <p className="text-2xl font-bold text-app-heading">{value}</p>
                </div>
                <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: bg }}>
                  <svg className="w-5 h-5" style={{ color }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} />
                  </svg>
                </div>
              </div>
            </div>
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
          <Link href="/assets" className="bg-app-card rounded-xl border border-app shadow-lg p-6 hover:border-app-muted/30 hover:shadow-xl transition-all">
            <h3 className="text-base font-semibold text-app-heading mb-1">ทรัพย์สินและอุปกรณ์</h3>
            <p className="text-sm text-app-muted">ดูรายการแอร์ทั้งหมดในสถานที่</p>
          </Link>
          <Link href="/work-orders" className="bg-app-card rounded-xl border border-app shadow-lg p-6 hover:border-app-muted/30 hover:shadow-xl transition-all">
            <h3 className="text-base font-semibold text-app-heading mb-1">ประวัติงาน</h3>
            <p className="text-sm text-app-muted">ดูประวัติการทำงานทั้งหมด</p>
          </Link>
          <Link href="/reports/maintenance" className="bg-app-card rounded-xl border border-app shadow-lg p-6 hover:border-app-muted/30 hover:shadow-xl transition-all">
            <h3 className="text-base font-semibold text-app-heading mb-1">รายงาน</h3>
            <p className="text-sm text-app-muted">รายงานการบำรุงรักษา & การซ่อม</p>
          </Link>
          <Link href="/contact" className="bg-app-card rounded-xl border border-app shadow-lg p-6 hover:border-app-muted/30 hover:shadow-xl transition-all">
            <h3 className="text-base font-semibold text-app-heading mb-1">ติดต่อเรา</h3>
            <p className="text-sm text-app-muted">แจ้งปัญหาหรือสอบถามข้อมูล</p>
          </Link>
        </div>
      </div>
    </div>
  )
}
