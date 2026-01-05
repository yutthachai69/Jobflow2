'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { deleteBuilding } from '@/app/actions'
import toast from 'react-hot-toast'

interface Props {
  buildingId: string
  buildingName: string
}

export default function DeleteBuildingButton({ buildingId, buildingName }: Props) {
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  async function handleDelete() {
    if (!showConfirm) {
      setShowConfirm(true)
      return
    }

    setIsDeleting(true)

    try {
      await deleteBuilding(buildingId)
      toast.success('ลบอาคารเรียบร้อยแล้ว')
      router.push('/locations')
      router.refresh()
    } catch (error) {
      console.error('Error deleting building:', error)
      const errorMessage = error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการลบข้อมูล'
      if (errorMessage.includes('floors')) {
        toast.error('ไม่สามารถลบอาคารที่มีชั้นได้')
      } else {
        toast.error(errorMessage)
      }
      setIsDeleting(false)
      setShowConfirm(false)
    }
  }

  if (showConfirm) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-600">ยืนยันการลบ?</span>
        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className="px-3 py-1.5 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isDeleting ? 'กำลังลบ...' : 'ยืนยัน'}
        </button>
        <button
          onClick={() => setShowConfirm(false)}
          disabled={isDeleting}
          className="px-3 py-1.5 bg-gray-200 text-gray-700 text-sm rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          ยกเลิก
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={handleDelete}
      disabled={isDeleting}
      className="inline-flex items-center px-2 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      ลบ
    </button>
  )
}

