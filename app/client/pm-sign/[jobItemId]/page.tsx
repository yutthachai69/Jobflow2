import { redirect, notFound } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import ClientPmSignForm from './ClientPmSignForm'
import {
  hasPmChecklistCustomerSignature,
  jobItemRequiresCustomerSignatureInChecklist,
} from '@/lib/pm-customer-signature'

interface Props {
  params: Promise<{ jobItemId: string }>
}

export default async function ClientPmSignPage({ params }: Props) {
  const { jobItemId } = await params
  const user = await getCurrentUser()
  if (!user || user.role !== 'CLIENT') {
    redirect(`/login?callbackUrl=/client/pm-sign/${jobItemId}`)
  }

  const siteId = user.siteId
  if (!siteId) {
    redirect('/client')
  }

  const jobItem = await prisma.jobItem.findUnique({
    where: { id: jobItemId },
    select: {
      id: true,
      status: true,
      checklist: true,
      asset: { select: { qrCode: true, assetType: true } },
      workOrder: {
        select: {
          jobType: true,
          siteId: true,
          site: {
            select: {
              name: true,
              client: { select: { name: true } },
            },
          },
        },
      },
    },
  })

  if (!jobItem) {
    notFound()
  }

  if (jobItem.workOrder.siteId !== siteId) {
    redirect('/client')
  }

  const canSignHere =
    jobItem.status === 'IN_PROGRESS' &&
    jobItemRequiresCustomerSignatureInChecklist(
      jobItem.workOrder.jobType,
      jobItem.checklist,
      jobItem.asset
    )

  if (!canSignHere) {
    return (
      <div className="mx-auto max-w-lg rounded-xl border border-amber-200 bg-amber-50 p-6 text-center">
        <p className="font-medium text-amber-900">ไม่สามารถเซ็นได้ในขณะนี้</p>
        <p className="mt-2 text-sm text-amber-800">
          งานอาจปิดแล้ว หรือไม่ใช่งาน PM/CM ที่มีแบบฟอร์มรายงานและกำลังดำเนินการ
        </p>
      </div>
    )
  }

  if (hasPmChecklistCustomerSignature(jobItem.checklist)) {
    return (
      <div className="mx-auto max-w-lg rounded-xl border border-emerald-200 bg-emerald-50 p-6 text-center">
        <p className="font-semibold text-emerald-900">มีลายเซ็นลูกค้าในระบบแล้ว</p>
        <p className="mt-2 text-sm text-emerald-800">ไม่ต้องเซ็นซ้ำ</p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl py-6">
      <ClientPmSignForm
        jobItemId={jobItemId}
        siteName={jobItem.workOrder.site.name}
        clientName={jobItem.workOrder.site.client.name}
        qrCode={jobItem.asset.qrCode}
      />
    </div>
  )
}
