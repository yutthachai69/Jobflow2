import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { getJobStatus } from "@/lib/status-colors"
import DateTimeDisplay from "@/app/components/DateTimeDisplay"

interface TechnicianDashboardProps {
  userId: string
}

export default async function TechnicianDashboard({ userId }: TechnicianDashboardProps) {
  // ดึงข้อมูลงานทั้งหมดของช่าง
  const allJobItems = await prisma.jobItem.findMany({
    where: {
      OR: [
        { technicianId: userId },
        { technicianId: null }, // งานที่ยังไม่ได้มอบหมาย
      ],
    },
    include: {
      workOrder: {
        include: {
          site: {
            include: { client: true },
          },
        },
      },
      asset: true,
      photos: true,
    },
    orderBy: { id: 'desc' },
  })

  // คำนวณสถิติ
  const pendingJobs = allJobItems.filter(j => j.status === 'PENDING')
  const inProgressJobs = allJobItems.filter(j => j.status === 'IN_PROGRESS')
  const doneJobs = allJobItems.filter(j => j.status === 'DONE')
  const issueJobs = allJobItems.filter(j => j.status === 'ISSUE_FOUND')

  // งานที่ต้องทำวันนี้
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayJobs = allJobItems.filter(j => {
    if (!j.workOrder.scheduledDate) return false
    const scheduledDate = new Date(j.workOrder.scheduledDate)
    scheduledDate.setHours(0, 0, 0, 0)
    return scheduledDate.getTime() === today.getTime()
  })

  // งานที่เสร็จวันนี้
  const completedToday = doneJobs.filter(j => {
    if (!j.endTime) return false
    const endDate = new Date(j.endTime)
    endDate.setHours(0, 0, 0, 0)
    return endDate.getTime() === today.getTime()
  }).length

  // งานที่กำลังทำอยู่ (IN_PROGRESS)
  const currentJobs = inProgressJobs.slice(0, 5)

  const statCards = [
    { label: 'งานที่รอดำเนินการ', value: pendingJobs.length, emoji: '⏳', from: '#c2a66a', to: '#92761a', glow: 'rgba(194,166,106,0.25)', href: '/technician' },
    { label: 'งานที่กำลังทำ', value: inProgressJobs.length, emoji: '🔨', from: '#1d4ed8', to: '#1e40af', glow: 'rgba(59,130,246,0.25)', href: '/technician' },
    { label: 'เสร็จสิ้นวันนี้', value: completedToday, emoji: '✅', from: '#059669', to: '#047857', glow: 'rgba(5,150,105,0.25)', href: '/technician' },
    { label: 'งานที่เสร็จแล้ว', value: doneJobs.length, emoji: '🏆', from: '#7c3aed', to: '#6d28d9', glow: 'rgba(124,58,237,0.25)', href: '/technician' },
  ]

  return (
    <div className="p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-app-heading mb-1">Dashboard</h1>
          <p className="text-sm text-app-muted">ภาพรวมงานของช่าง</p>
        </div>

        {/* ปฏิทินและเวลา */}
        <div className="mb-6">
          <DateTimeDisplay />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {statCards.map(({ label, value, emoji, from, to, glow, href }) => (
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

        {todayJobs.length > 0 && (
          <div className="bg-app-card rounded-lg border border-app shadow-lg p-6 mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-app-heading">งานที่ต้องทำวันนี้</h2>
              <span className="text-sm font-medium" style={{ color: '#C2A66A' }}>{todayJobs.length} รายการ</span>
            </div>
            <div className="space-y-3">
              {todayJobs.slice(0, 5).map((job) => {
                const st = getJobStatus(job.status)
                return (
                  <Link key={job.id} href={`/technician/job-item/${job.id}`} className="block p-4 bg-app-section hover:bg-app-section/80 rounded-lg border border-app border-l-4 transition-all" style={{ borderLeftColor: st.hex }}>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="font-medium text-app-heading">{job.asset.brand} {job.asset.model}</span>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${st.tailwind}`}>{job.workOrder.jobType}</span>
                        </div>
                        <div className="text-sm text-app-body">
                          <span>{job.workOrder.site.name}</span>
                          <span className="mx-2">•</span>
                          <span>{job.workOrder.site.client.name}</span>
                        </div>
                      </div>
                      <span className="font-medium ml-4" style={{ color: '#C2A66A' }}>→</span>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        )}

        {currentJobs.length > 0 && (
          <div className="bg-app-card rounded-lg border border-app shadow-lg p-6 mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-app-heading">งานที่กำลังทำอยู่</h2>
              <Link href="/technician" className="text-sm font-medium hover:underline" style={{ color: '#C2A66A' }}>ดูทั้งหมด →</Link>
            </div>
            <div className="space-y-3">
              {currentJobs.map((job) => {
                const st = getJobStatus('IN_PROGRESS')
                return (
                  <Link key={job.id} href={`/technician/job-item/${job.id}`} className="block p-4 rounded-lg border border-app border-l-4 transition-all bg-app-section/50 hover:bg-app-section" style={{ borderLeftColor: st.hex }}>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="font-medium text-app-heading">{job.asset.brand} {job.asset.model}</span>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${st.tailwind}`}>กำลังทำ</span>
                        </div>
                        <div className="text-sm text-app-body">
                          <span>{job.workOrder.site.name}</span>
                          <span className="mx-2">•</span>
                          <span>{job.workOrder.site.client.name}</span>
                        </div>
                        {job.startTime && <div className="text-xs text-app-muted mt-1">เริ่มงาน: {new Date(job.startTime).toLocaleString('th-TH')}</div>}
                      </div>
                      <span className="font-medium ml-4" style={{ color: '#C2A66A' }}>→</span>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { href: '/technician', label: 'หน้างาน', sub: 'ดูรายการงานทั้งหมดที่ต้องทำ', emoji: '🔨', from: '#1d4ed8', to: '#1e40af', glow: 'rgba(59,130,246,0.2)' },
            { href: '/technician/scan', label: 'สแกน QR Code', sub: 'สแกน QR Code เพื่อดูข้อมูลเครื่อง', emoji: '📷', from: '#7c3aed', to: '#6d28d9', glow: 'rgba(124,58,237,0.2)' },
            { href: '/work-orders', label: 'ประวัติงาน', sub: 'ดูประวัติการทำงานทั้งหมด', emoji: '📊', from: '#059669', to: '#047857', glow: 'rgba(5,150,105,0.2)' },
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


