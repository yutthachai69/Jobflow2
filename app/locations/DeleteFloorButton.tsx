'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { deleteFloor } from '@/app/actions'
import toast from 'react-hot-toast'
import ConfirmDialog from '@/app/components/ConfirmDialog'
import { isRedirectError } from '@/lib/error-handler'

interface Props {
  floorId: string
  floorName: string
}

export default function DeleteFloorButton({ floorId, floorName }: Props) {
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  async function handleDelete() {
    setIsDeleting(true)

    try {
      await deleteFloor(floorId)
      toast.success('ลบชั้นเรียบร้อยแล้ว')
      setShowConfirm(false)
      router.push('/locations')
      router.refresh()
    } catch (error) {
      if (isRedirectError(error)) throw error
      console.error('Error deleting floor:', error)
      const errorMessage = error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการลบข้อมูล'
      if (errorMessage.includes('rooms')) {
        toast.error('ไม่สามารถลบชั้นที่มีห้องได้')
      } else {
        toast.error(errorMessage)
      }
      setIsDeleting(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setShowConfirm(true)}
        disabled={isDeleting}
        className="inline-flex items-center px-2 py-0.5 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        ลบ
      </button>

      <ConfirmDialog
        isOpen={showConfirm}
        title="ลบชั้น"
        message={`คุณแน่ใจหรือไม่ว่าต้องการลบชั้น "${floorName}"? การกระทำนี้ไม่สามารถยกเลิกได้`}
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
