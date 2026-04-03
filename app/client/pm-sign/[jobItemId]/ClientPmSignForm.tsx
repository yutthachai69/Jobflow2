'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import toast from 'react-hot-toast'
import { useRouter } from 'next/navigation'
import { submitPmCustomerSignatureAsClient } from '@/app/actions/work-orders'

const SignaturePad = dynamic(() => import('@/app/components/SignaturePad'), {
  ssr: false,
  loading: () => (
    <div className="flex justify-center p-8">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
    </div>
  ),
})

export default function ClientPmSignForm({
  jobItemId,
  siteName,
  clientName,
  qrCode,
}: {
  jobItemId: string
  siteName: string
  clientName: string
  qrCode: string
}) {
  const router = useRouter()
  const [sig, setSig] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [done, setDone] = useState(false)

  async function handleSubmit() {
    if (!sig) {
      toast.error('กรุณาลงลายมือชื่อก่อน')
      return
    }
    setSaving(true)
    try {
      const res = await submitPmCustomerSignatureAsClient(jobItemId, sig)
      if (!res.success) {
        toast.error(res.error)
        return
      }
      setDone(true)
      toast.success('บันทึกลายเซ็นเรียบร้อย')
      router.refresh()
    } finally {
      setSaving(false)
    }
  }

  if (done) {
    return (
      <div className="mx-auto max-w-md rounded-2xl border border-green-200 bg-green-50 p-8 text-center shadow-sm">
        <p className="text-lg font-semibold text-green-900">บันทึกลายเซ็นแล้ว</p>
        <p className="mt-2 text-sm text-green-800">
          ทีมช่างจะได้รับแจ้งเตือนและดำเนินการปิดงานต่อไป
        </p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-lg space-y-6 rounded-2xl border border-app bg-app-card p-6 shadow-lg">
      <div>
        <h1 className="text-xl font-bold text-app-heading">ลงลายมือชื่อรับรองงาน PM</h1>
        <p className="mt-1 text-sm text-app-muted">
          {clientName} · {siteName}
        </p>
        <p className="mt-2 font-mono text-sm text-app-body">ทรัพย์สิน: {qrCode}</p>
      </div>
      <p className="text-sm text-app-body">
        กรุณาเซ็นในช่องด้านล่างเพื่อยืนยันการรับงานบริการ
      </p>
      <SignaturePad
        label="ลายเซ็นลูกค้า"
        onSave={(data) => setSig(data)}
        initialDataUrl={sig}
      />
      <button
        type="button"
        disabled={saving || !sig}
        onClick={handleSubmit}
        className="w-full rounded-xl bg-[var(--app-btn-primary)] py-3 font-semibold text-white shadow hover:opacity-95 disabled:opacity-50"
      >
        {saving ? 'กำลังบันทึก...' : 'ยืนยันลายเซ็น'}
      </button>
    </div>
  )
}
