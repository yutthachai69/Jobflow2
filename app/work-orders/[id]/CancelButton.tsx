'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { updateWorkOrderStatus } from '@/app/actions/index'
import toast from 'react-hot-toast'
import ConfirmDialog from '@/app/components/ConfirmDialog'

interface Props {
  workOrderId: string
}

export default function CancelWorkOrderButton({ workOrderId }: Props) {
  const router = useRouter()
  const [isCancelling, setIsCancelling] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  async function handleCancel() {
    setIsCancelling(true)

    try {
      await updateWorkOrderStatus(workOrderId, 'CANCELLED')
      toast.success('ยกเลิกใบสั่งงานเรียบร้อยแล้ว')
      setShowConfirm(false)
      router.refresh()
    } catch (error) {
      console.error('Error cancelling work order:', error)
      const errorMessage = error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการยกเลิก'
      toast.error(errorMessage)
      setIsCancelling(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setShowConfirm(true)}
        disabled={isCancelling}
        className="bg-gradient-to-r from-red-600 to-pink-600 text-white px-6 py-3 rounded-xl hover:shadow-xl hover:scale-105 font-semibold transition-all duration-300 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <span>ยกเลิก</span>
      </button>

      <ConfirmDialog
        isOpen={showConfirm}
        title="ยกเลิกใบสั่งงาน"
        message="คุณแน่ใจหรือไม่ว่าต้องการยกเลิกใบสั่งงานนี้? การกระทำนี้จะเปลี่ยนสถานะเป็น 'ยกเลิก' และไม่สามารถแก้ไขได้"
        confirmText="ยกเลิก"
        cancelText="ไม่ยกเลิก"
        confirmColor="red"
        onConfirm={handleCancel}
        onCancel={() => setShowConfirm(false)}
        isLoading={isCancelling}
      />
    </>
  )
}


