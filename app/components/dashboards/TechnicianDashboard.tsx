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
    { label: 'งานที่รอดำเนินการ', value: pendingJobs.length, color: '#C2A66A', bg: 'rgba(194,166,106,0.2)', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
    { label: 'งานที่กำลังทำ', value: inProgressJobs.length, color: '#5B7C99', bg: 'rgba(91,124,153,0.2)', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
    { label: 'เสร็จสิ้นวันนี้', value: completedToday, color: '#5E8F75', bg: 'rgba(94,143,117,0.2)', icon: 'M5 13l4 4L19 7' },
    { label: 'งานที่เสร็จแล้ว', value: doneJobs.length, color: '#5E8F75', bg: 'rgba(94,143,117,0.2)', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
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
          {statCards.map(({ label, value, color, bg, icon }) => (
            <div key={label} className="bg-app-card rounded-lg border border-app p-6 shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-app-muted mb-1">{label}</p>
                  <p className="text-2xl font-semibold text-app-heading">{value}</p>
                </div>
                <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: bg }}>
                  <svg className="w-5 h-5" style={{ color }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} /></svg>
                </div>
              </div>
            </div>
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
          <Link href="/technician" className="bg-app-card rounded-lg border border-app shadow-lg p-6 hover:border-app-muted/30 hover:shadow-xl transition-all">
            <h3 className="text-base font-semibold text-app-heading mb-1">หน้างาน</h3>
            <p className="text-sm text-app-muted">ดูรายการงานทั้งหมดที่ต้องทำ</p>
          </Link>
          <Link href="/technician/scan" className="bg-app-card rounded-lg border border-app shadow-lg p-6 hover:border-app-muted/30 hover:shadow-xl transition-all">
            <h3 className="text-base font-semibold text-app-heading mb-1">สแกน QR Code</h3>
            <p className="text-sm text-app-muted">สแกน QR Code เพื่อดูข้อมูลเครื่อง</p>
          </Link>
          <Link href="/work-orders" className="bg-app-card rounded-lg border border-app shadow-lg p-6 hover:border-app-muted/30 hover:shadow-xl transition-all">
            <h3 className="text-base font-semibold text-app-heading mb-1">ประวัติงาน</h3>
            <p className="text-sm text-app-muted">ดูประวัติการทำงานทั้งหมด</p>
          </Link>
        </div>
      </div>
    </div>
  )
}


