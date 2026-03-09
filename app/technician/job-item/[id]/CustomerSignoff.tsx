'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import toast from 'react-hot-toast'

// Dynamic import SignaturePad to avoid SSR issues
const SignaturePad = dynamic(() => import('@/app/components/SignaturePad'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center p-8">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
  ),
})

interface CustomerSignoffProps {
  jobItemId: string
  status: string
  hasBeforePhoto: boolean
  hasAfterPhoto: boolean
  customerSignature?: string | null
  signedAt?: string | null
}

export default function CustomerSignoff({
  jobItemId,
  status,
  hasBeforePhoto,
  hasAfterPhoto,
  customerSignature,
  signedAt,
}: CustomerSignoffProps) {
  const [isSaving, setIsSaving] = useState(false)
  const [signatureData, setSignatureData] = useState<string | null>(customerSignature || null)
  const [savedAt, setSavedAt] = useState<string | null>(signedAt || null)
  const [showSignPad, setShowSignPad] = useState(false)

  // ถ้ามีลายเซ็นแล้ว แสดงแบบ read-only
  if (savedAt && signatureData) {
    return (
      <div className="bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-lg">✍️</span>
          <h3 className="font-bold text-green-800 dark:text-green-300">ลูกค้าเซ็นรับงานแล้ว</h3>
        </div>
        <div className="bg-white rounded-lg p-2 border border-green-200 dark:border-green-700">
          <img
            src={signatureData}
            alt="ลายเซ็นลูกค้า"
            className="w-full h-32 object-contain"
          />
        </div>
        <p className="text-xs text-green-600 dark:text-green-400 mt-2">
          เซ็นเมื่อ: {new Date(savedAt).toLocaleString('th-TH')}
        </p>
      </div>
    )
  }

  // ถ้ายังไม่ DONE และยังไม่มีรูปครบ → แสดง info
  if (status === 'PENDING') {
    return null // ซ่อนเลยถ้ายังไม่เริ่มงาน
  }

  const canSign = hasBeforePhoto && hasAfterPhoto && (status === 'IN_PROGRESS' || status === 'DONE')

  if (!canSign && status === 'IN_PROGRESS') {
    return (
      <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
        <div className="flex items-center gap-2">
          <span className="text-lg">⏳</span>
          <div>
            <h3 className="font-semibold text-amber-800 dark:text-amber-300 text-sm">รอถ่ายรูปก่อน/หลัง</h3>
            <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
              ต้องมีรูป Before + After ก่อนจึงจะให้ลูกค้าเซ็นรับงานได้
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (!canSign) return null

  const handleSaveSignature = async () => {
    if (!signatureData) {
      toast.error('กรุณาเซ็นชื่อก่อน')
      return
    }

    setIsSaving(true)
    try {
      const res = await fetch('/api/job-items/signature', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobItemId,
          signature: signatureData,
        }),
      })

      const data = await res.json()
      if (data.success) {
        setSavedAt(new Date().toISOString())
        toast.success('บันทึกลายเซ็นเรียบร้อยแล้ว!', { icon: '✍️' })
        setShowSignPad(false)
      } else {
        toast.error(data.error || 'เกิดข้อผิดพลาด')
      }
    } catch (error) {
      toast.error('เกิดข้อผิดพลาดในการบันทึก')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="bg-app-card border border-app rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">✍️</span>
          <h3 className="font-bold text-app-heading">ลูกค้าเซ็นรับงาน</h3>
        </div>
        {!showSignPad && (
          <button
            onClick={() => setShowSignPad(true)}
            className="btn-app-primary px-4 py-2 rounded-lg text-sm font-medium"
          >
            เปิดหน้าเซ็น
          </button>
        )}
      </div>

      {showSignPad && (
        <div className="space-y-3">
          <p className="text-sm text-app-muted">
            กรุณาให้ลูกค้าเซ็นชื่อด้านล่างเพื่อยืนยันการรับงาน
          </p>

          <SignaturePad
            label="ลายเซ็นลูกค้า (Customer Signature)"
            onSave={(dataUrl) => setSignatureData(dataUrl)}
            initialDataUrl={signatureData}
          />

          <div className="flex gap-2">
            <button
              onClick={handleSaveSignature}
              disabled={isSaving || !signatureData}
              className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 text-white px-4 py-3 rounded-xl font-medium hover:shadow-lg disabled:opacity-50 transition-all"
            >
              {isSaving ? 'กำลังบันทึก...' : '💾 บันทึกลายเซ็น'}
            </button>
            <button
              onClick={() => setShowSignPad(false)}
              className="px-4 py-3 rounded-xl border border-app text-app-body hover:bg-app-section transition-colors"
            >
              ยกเลิก
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
