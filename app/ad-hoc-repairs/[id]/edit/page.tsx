import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import AdHocRepairEditForm from './AdHocRepairEditForm'

interface Props {
  params: Promise<{ id: string }>
}

export default async function EditAdHocRepairPage({ params }: Props) {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login')
  }

  if (user.role !== 'ADMIN') {
    redirect('/dashboard')
  }

  const { id } = await params

  const repair = await prisma.workOrder.findUnique({
    where: { id },
    include: { site: true },
  })

  if (!repair || repair.jobType !== 'AD_HOC') {
    notFound()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4 md:p-8">
      <div className="w-full max-w-2xl mx-auto">
        {/* Back Link */}
        <Link
          href={`/ad-hoc-repairs/${id}`}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-200 bg-white/70 text-gray-600 text-sm hover:bg-gray-100 hover:text-blue-600 shadow-sm mb-6 group transition-all duration-200"
        >
          <span className="group-hover:-translate-x-1 transition-transform duration-200">←</span>
          <span className="font-medium">กลับ</span>
        </Link>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">แก้ไขใบแจ้งซ่อมนอกแผน</h1>
          <p className="text-gray-600 mt-2">อัพเดตรายละเอียดการซ่อม</p>
        </div>

        {/* Form */}
        <AdHocRepairEditForm repair={repair} />
      </div>
    </div>
  )
}
