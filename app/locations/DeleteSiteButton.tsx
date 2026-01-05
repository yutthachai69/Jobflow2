'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { deleteSite } from '@/app/actions'
import toast from 'react-hot-toast'

interface Props {
  siteId: string
  siteName: string
}

export default function DeleteSiteButton({ siteId, siteName }: Props) {
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
      await deleteSite(siteId)
      toast.success('ลบสถานที่เรียบร้อยแล้ว')
      router.push('/locations')
      router.refresh()
    } catch (error) {
      console.error('Error deleting site:', error)
      const errorMessage = error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการลบข้อมูล'
      if (errorMessage.includes('buildings')) {
        toast.error('ไม่สามารถลบสถานที่ที่มีอาคารได้')
      } else if (errorMessage.includes('users')) {
        toast.error('ไม่สามารถลบสถานที่ที่มีผู้ใช้ที่มอบหมายได้')
      } else if (errorMessage.includes('work orders')) {
        toast.error('ไม่สามารถลบสถานที่ที่มีใบสั่งงานได้')
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
      className="inline-flex items-center px-3 py-1.5 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      ลบ
    </button>
  )
}
