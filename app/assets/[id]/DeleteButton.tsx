'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

interface Props {
  assetId: string
}

export default function DeleteAssetButton({ assetId }: Props) {
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
      const response = await fetch(`/api/assets/${assetId}/delete`, {
        method: 'POST',
      })

      if (response.ok) {
        toast.success('ลบข้อมูลแอร์เรียบร้อยแล้ว')
        router.push('/assets')
        router.refresh()
      } else {
        const url = new URL(response.url)
        const error = url.searchParams.get('error')
        if (error === 'has_job_items') {
          toast.error('ไม่สามารถลบแอร์ที่มีประวัติการซ่อมบำรุงได้')
        } else {
          toast.error('เกิดข้อผิดพลาดในการลบข้อมูล')
        }
        setIsDeleting(false)
        setShowConfirm(false)
      }
    } catch (error) {
      console.error('Error deleting asset:', error)
      toast.error('เกิดข้อผิดพลาดในการลบข้อมูล')
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
      className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      ลบ
    </button>
  )
}

