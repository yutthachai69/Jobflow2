'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import ConfirmDialog from '@/app/components/ConfirmDialog'
import { adminReopenJobItem } from '@/app/actions'
import { isRedirectError } from '@/lib/error-handler'

export default function ReopenJobItemButton({ jobItemId }: { jobItemId: string }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  async function onConfirm() {
    setLoading(true)
    try {
      const res = (await adminReopenJobItem(jobItemId)) as unknown as { success: boolean; error?: string; workOrderId?: string }
      if (!res?.success) {
        toast.error(res?.error || 'ไม่สามารถเปิดงานกลับมาแก้ไขได้')
        return
      }
      toast.success('เปิดงานกลับมาแก้ไขแล้ว')
      setOpen(false)
      if (res?.workOrderId) {
        router.push(`/technician/work-order/${res.workOrderId}`)
      } else {
        router.refresh()
      }
    } catch (error) {
      if (isRedirectError(error)) throw error
      const msg = error instanceof Error ? error.message : 'เกิดข้อผิดพลาด'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-2 inline-flex items-center gap-1 px-3 py-1.5 bg-amber-50 text-amber-800 hover:bg-amber-100 rounded-lg text-xs font-semibold transition-colors border border-amber-200"
      >
        ♻️ เปิดงานกลับมาแก้
      </button>

      <ConfirmDialog
        isOpen={open}
        title="เปิดงานกลับมาแก้ไข"
        message="คุณต้องการเปิดงานนี้กลับมาแก้ไขหรือไม่? ระบบจะเปลี่ยนสถานะกลับเป็น “กำลังทำงาน” และล้างเวลาเสร็จสิ้น"
        confirmText="ยืนยัน"
        cancelText="ยกเลิก"
        confirmColor="orange"
        onConfirm={onConfirm}
        onCancel={() => (loading ? null : setOpen(false))}
        isLoading={loading}
      />
    </>
  )
}

