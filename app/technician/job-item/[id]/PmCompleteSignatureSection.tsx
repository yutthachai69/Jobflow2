'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import CompleteJobItemButton from './CompleteButton'
import { notifySiteClientsForPmSignature } from '@/app/actions/work-orders'

export default function PmCompleteSignatureSection({
  jobItemId,
  requiresCustomerSignature,
  hasCustomerSignature,
  canComplete,
  completeButtonClassName,
  titleWhenDisabled,
}: {
  jobItemId: string
  requiresCustomerSignature: boolean
  hasCustomerSignature: boolean
  canComplete: boolean
  completeButtonClassName: string
  titleWhenDisabled?: string
}) {
  const router = useRouter()
  const [sending, setSending] = useState(false)

  async function handleNotifyClients() {
    setSending(true)
    try {
      const res = await notifySiteClientsForPmSignature(jobItemId)
      if (!res.success) {
        toast.error(res.error)
        return
      }
      toast.success(`ส่งแจ้งเตือนให้ลูกค้า ${res.notifiedCount} บัญชีแล้ว — ลูกค้าเข้าระบบเพื่อเซ็น`)
      router.refresh()
    } finally {
      setSending(false)
    }
  }

  if (!requiresCustomerSignature) {
    return (
      <CompleteJobItemButton
        jobItemId={jobItemId}
        disabled={!canComplete}
        className={completeButtonClassName}
        titleWhenDisabled={titleWhenDisabled}
      />
    )
  }

  return (
    <div className="flex w-full flex-col gap-3">
      {hasCustomerSignature && canComplete && (
        <div className="w-full rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          <span className="font-semibold">ลูกค้าเซ็นแล้ว</span>
          <span className="text-emerald-800">
            {' '}
            — กดปิดงานได้เมื่อพร้อม
          </span>
        </div>
      )}

      {!hasCustomerSignature && canComplete && (
        <div className="w-full rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm text-indigo-900">
          ยังไม่มีลายเซ็นลูกค้า — ให้ลูกค้าเซ็นในฟอร์มด้านล่าง (ที่เครื่องช่าง) หรือกดส่งแจ้งเตือนไปยังบัญชี CLIENT ของสถานที่นี้ให้เข้าระบบเซ็น
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        {!hasCustomerSignature && canComplete && (
          <button
            type="button"
            disabled={sending}
            onClick={handleNotifyClients}
            className="rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-3 font-semibold text-white shadow transition hover:scale-[1.02] hover:shadow-lg disabled:opacity-60"
          >
            {sending ? 'กำลังส่ง...' : 'แจ้งลูกค้าให้เซ็นในระบบ'}
          </button>
        )}

        <CompleteJobItemButton
          jobItemId={jobItemId}
          disabled={!canComplete || !hasCustomerSignature}
          className={
            canComplete && hasCustomerSignature
              ? 'px-6 py-3 rounded-xl font-semibold transition-all duration-300 flex items-center gap-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:shadow-xl hover:scale-105'
              : 'px-6 py-3 rounded-xl font-semibold transition-all duration-300 flex items-center gap-2 bg-gray-400 text-white cursor-not-allowed opacity-60'
          }
          titleWhenDisabled={
            !canComplete
              ? titleWhenDisabled
              : 'กรุณาให้ลูกค้าเซ็นในรายงานก่อนปิดงาน'
          }
        />
      </div>
    </div>
  )
}
