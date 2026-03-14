'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { deleteBuilding } from '@/app/actions'
import toast from 'react-hot-toast'
import ConfirmDialog from '@/app/components/ConfirmDialog'
import { isRedirectError } from '@/lib/error-handler'

interface Props {
  buildingId: string
  buildingName: string
}

export default function DeleteBuildingButton({ buildingId, buildingName }: Props) {
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  async function handleDelete() {
    setIsDeleting(true)

    try {
      await deleteBuilding(buildingId)
      toast.success('ลบอาคารเรียบร้อยแล้ว')
      setShowConfirm(false)
      router.push('/locations')
      router.refresh()
    } catch (error) {
      if (isRedirectError(error)) throw error
      console.error('Error deleting building:', error)
      const errorMessage = error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการลบข้อมูล'
      if (errorMessage.includes('floors')) {
        toast.error('ไม่สามารถลบอาคารที่มีชั้นได้')
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
        className="inline-flex items-center px-2 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        ลบ
      </button>

      <ConfirmDialog
        isOpen={showConfirm}
        title="ลบอาคาร"
        message={`คุณแน่ใจหรือไม่ว่าต้องการลบอาคาร "${buildingName}"? การกระทำนี้ไม่สามารถยกเลิกได้`}
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

