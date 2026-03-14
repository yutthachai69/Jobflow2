'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { deleteBuilding } from '@/app/actions'
import toast from 'react-hot-toast'
import ConfirmDialog from '@/app/components/ConfirmDialog'

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
      const result = await deleteBuilding(buildingId)
      if (result.success) {
        toast.success('ลบอาคารเรียบร้อยแล้ว')
        setShowConfirm(false)
        router.push('/locations')
        router.refresh()
      } else {
        toast.error(result.error)
      }
    } catch (error) {
      console.error('Error deleting building:', error)
      toast.error('เกิดข้อผิดพลาดในการลบข้อมูล')
    } finally {
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

