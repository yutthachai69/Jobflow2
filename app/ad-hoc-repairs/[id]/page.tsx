import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import AdHocJobItemPhotos from './AdHocJobItemPhotos'

interface Props {
  params: Promise<{ id: string }>
}

export default async function AdHocRepairDetailPage({ params }: Props) {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  if (!['ADMIN', 'TECHNICIAN', 'CLIENT'].includes(user.role)) {
    redirect('/dashboard')
  }

  const { id } = await params
  const repair = await prisma.workOrder.findUnique({
    where: { id },
    include: {
      site: true,
      jobItems: {
        include: {
          technician: true,
          photos: true,
        },
      },
    },
  })

  // CLIENT เข้าได้แค่ site ของเขา
  if (user.role === 'CLIENT' && repair?.siteId !== user.siteId) {
    notFound()
  }

  if (!repair || repair.jobType !== 'AD_HOC') {
    notFound()
  }

  const statusLabel = {
    OPEN: 'เปิด',
    IN_PROGRESS: 'กำลังดำเนิน',
    COMPLETED: 'เสร็จแล้ว',
    WAITING_APPROVAL: 'รอการอนุมัติ',
    APPROVED: 'อนุมัติแล้ว',
    REJECTED: 'ปฏิเสธ',
    CANCELLED: 'ยกเลิก',
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4 md:p-8">
      <div className="w-full max-w-4xl mx-auto">
        {/* Back Link */}
        <Link
          href="/ad-hoc-repairs"
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-200 bg-white/70 text-gray-600 text-sm hover:bg-gray-100 hover:text-blue-600 shadow-sm mb-6 group transition-all duration-200"
        >
          <span className="group-hover:-translate-x-1 transition-transform duration-200">←</span>
          <span className="font-medium">กลับ</span>
        </Link>

        {/* Header Card */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-gray-100 mb-6">
          <div className="flex items-start justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">ใบซ่อมนอกแผน</h1>
              <p className="text-gray-600 mt-1">เลขที่: {repair.workOrderNumber || repair.id.slice(0, 8)}</p>
            </div>
            <span className={`px-4 py-2 rounded-full font-semibold text-sm ${
              repair.status === 'OPEN' ? 'bg-blue-100 text-blue-800' :
              repair.status === 'IN_PROGRESS' ? 'bg-yellow-100 text-yellow-800' :
              repair.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {statusLabel[repair.status as keyof typeof statusLabel]}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
            <div>
              <p className="text-sm text-gray-600 font-medium">สถานที่</p>
              <p className="text-lg font-semibold text-gray-900 mt-1">{repair.site.name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 font-medium">ประเภทการซ่อม</p>
              <p className="text-lg font-semibold text-gray-900 mt-1">
                {repair.repairType === 'WASH_AC' && 'ล้างแอร์'}
                {repair.repairType === 'REPAIR_AC' && 'ซ่อมแอร์'}
                {repair.repairType === 'WASH_FAN' && 'ล้างพัดลม'}
                {repair.repairType === 'REPAIR_FAN' && 'ซ่อมพัดลม'}
                {repair.repairType === 'OTHER' && 'อื่นๆ'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 font-medium">สถานที่ (รายละเอียด)</p>
              <p className="text-lg font-semibold text-gray-900 mt-1">{repair.locationDescription}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 font-medium">วันที่ที่ต้องการซ่อม</p>
              <p className="text-lg font-semibold text-gray-900 mt-1">
                {new Date(repair.scheduledDate).toLocaleDateString('th-TH')}
              </p>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-600 font-medium mb-2">รายละเอียดปัญหา</p>
            <p className="text-gray-900 whitespace-pre-wrap">{repair.problemDescription}</p>
          </div>
        </div>

        {/* Job Items */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 mb-6">ผลการทำงาน</h2>

          {repair.jobItems.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600 mb-4">ยังไม่มีการทำงาน</p>
              {user.role === 'TECHNICIAN' && (
                <p className="text-sm text-gray-500">
                  ลองกลับไปหน้าทำงาน เลือกงานนี้เพื่อเริ่มทำการซ่อม
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {repair.jobItems.map((item) => {
                const itemContent = (
                  <div className="flex items-center justify-between mb-3">
                    <p className="font-semibold text-gray-900">
                      {item.technician?.fullName || 'ไม่มีช่างกำหนด'}
                    </p>
                    <p className="text-sm text-gray-500">
                      {item.startTime && new Date(item.startTime).toLocaleString('th-TH')}
                    </p>
                  </div>
                );

                const itemDetails = (
                  <>
                    {item.techNote && (
                      <div>
                        <p className="text-sm text-gray-600 font-medium mb-1">หมายเหตุช่าง:</p>
                        <p className="text-gray-900 text-sm whitespace-pre-wrap">{item.techNote}</p>
                      </div>
                    )}
                    {item.photos.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <AdHocJobItemPhotos photos={item.photos} />
                      </div>
                    )}
                  </>
                );

                // CLIENT: read-only, ADMIN/TECHNICIAN: clickable link
                if (user.role === 'CLIENT') {
                  return (
                    <div
                      key={item.id}
                      className="border border-gray-200 rounded-xl p-4 bg-gray-50"
                    >
                      {itemContent}
                      {itemDetails}
                    </div>
                  );
                }

                return (
                  <Link
                    key={item.id}
                    href={`/technician/job-item/${item.id}`}
                    className="border border-gray-200 rounded-xl p-4 hover:border-blue-400 hover:bg-blue-50 transition-all duration-200 block"
                  >
                    {itemContent}
                    {itemDetails}
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
