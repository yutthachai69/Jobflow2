'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { deleteWorkOrder } from '@/app/actions'
import toast from 'react-hot-toast'
import ConfirmDialog from '@/app/components/ConfirmDialog'
import { isRedirectError } from '@/lib/error-handler'

interface Props {
  workOrderId: string
}

export default function DeleteWorkOrderButton({ workOrderId }: Props) {
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  async function handleDelete() {
    setIsDeleting(true)

    try {
      // NOTE: Server Actions imported into client can have awkward inferred types in Next.js build.
      // We treat the result as a simple { success, error } shape.
      const res = (await deleteWorkOrder(workOrderId)) as unknown as { success: boolean; error?: string }

      if (!res?.success) {
        const errorMessage = res?.error || 'เกิดข้อผิดพลาดในการลบข้อมูล'
        if (errorMessage.includes('completed jobs')) {
          toast.error('ไม่สามารถลบใบสั่งงานที่มีงานเสร็จสิ้นแล้วได้')
        } else {
          toast.error(errorMessage)
        }
        setIsDeleting(false)
        return
      }

      toast.success('ลบใบสั่งงานเรียบร้อยแล้ว')
      setShowConfirm(false)
      router.push('/work-orders')
      router.refresh()
    } catch (error) {
      // กันกรณีเกิด error ที่ไม่คาดคิด (เช่น network / runtime)
      if (isRedirectError(error)) throw error
      console.error('Error deleting work order:', error)
      toast.error('เกิดข้อผิดพลาดในการลบข้อมูล')
      setIsDeleting(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setShowConfirm(true)}
        disabled={isDeleting}
        className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        ลบใบสั่งงาน
      </button>

      <ConfirmDialog
        isOpen={showConfirm}
        title="ลบใบสั่งงาน"
        message="คุณแน่ใจหรือไม่ว่าต้องการลบใบสั่งงานนี้? การกระทำนี้ไม่สามารถยกเลิกได้"
        confirmText="ลบ"
        cancelText="ยกเลิก"
        confirmColor="red"
        onConfirm={handleDelete}
        onCancel={() => setShowConfirm(false)}
        isLoading={isDeleting}
      />
    </>
  )
}

