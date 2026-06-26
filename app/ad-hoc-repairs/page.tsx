export const dynamic = 'force-dynamic'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import AdHocRepairsClient from './AdHocRepairsClient'

export default async function AdHocRepairsPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login')
  }

  if (!['ADMIN', 'TECHNICIAN', 'CLIENT'].includes(user.role)) {
    redirect('/dashboard')
  }

  const isAdmin = user.role === 'ADMIN'
  const isClient = user.role === 'CLIENT'

  let adHocRepairs = await prisma.workOrder.findMany({
    where: {
      jobType: 'AD_HOC',
      ...(user.role === 'CLIENT' && user.siteId ? { siteId: user.siteId } : {}),
    },
    include: { site: true, jobItems: true },
    orderBy: { createdAt: 'desc' },
  })

  // TECHNICIAN: filter เฉพาะงานที่กำหนดให้
  if (user.role === 'TECHNICIAN') {
    adHocRepairs = adHocRepairs.filter(repair =>
      repair.jobItems.some(job => job.technicianId === user.id)
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4 md:p-8">
      <div className="w-full">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">ซ่อมนอกแผน</h1>
              <p className="text-sm text-gray-600 mt-0.5">ใบแจ้งซ่อมสำหรับงานนอกแผนปกติ</p>
            </div>
            {isAdmin && (
              <Link
                href="/ad-hoc-repairs/new"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-6 py-3 rounded-xl hover:shadow-lg hover:scale-105 font-semibold transition-all duration-300"
              >
                <span>+</span>
                <span>สร้างใบแจ้งซ่อมใหม่</span>
              </Link>
            )}
          </div>
        </div>

        {/* List */}
        {adHocRepairs.length === 0 ? (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-12 text-center border border-gray-100">
            <p className="text-gray-600 mb-6">ยังไม่มีใบแจ้งซ่อมนอกแผน</p>
            {isAdmin && (
              <Link
                href="/ad-hoc-repairs/new"
                className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-all"
              >
                <span>สร้างใบแจ้งซ่อมแรก</span>
              </Link>
            )}
          </div>
        ) : (
          <AdHocRepairsClient
            adHocRepairs={adHocRepairs}
            userRole={user.role}
            isAdmin={isAdmin}
            isClient={isClient}
          />
        )}
      </div>
    </div>
  )
}
