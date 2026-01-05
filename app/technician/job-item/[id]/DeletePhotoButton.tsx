'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { deleteJobPhoto } from '@/app/actions'
import toast from 'react-hot-toast'

interface Props {
  photoId: string
  photoType: string
}

export default function DeletePhotoButton({ photoId, photoType }: Props) {
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
      await deleteJobPhoto(photoId)
      toast.success('ลบรูปภาพเรียบร้อยแล้ว')
      router.refresh()
    } catch (error) {
      console.error('Error deleting photo:', error)
      const errorMessage = error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการลบรูปภาพ'
      if (errorMessage.includes('completed')) {
        toast.error('ไม่สามารถลบรูปภาพจากงานที่เสร็จสิ้นแล้วได้')
      } else if (errorMessage.includes('Unauthorized')) {
        toast.error('คุณไม่มีสิทธิ์ลบรูปภาพนี้')
      } else {
        toast.error(errorMessage)
      }
      setIsDeleting(false)
      setShowConfirm(false)
    }
  }

  if (showConfirm) {
    return (
      <div className="absolute top-3 right-3 flex items-center gap-2 bg-black/90 backdrop-blur-sm rounded-lg px-3 py-2 z-10">
        <span className="text-xs text-white">ยืนยัน?</span>
        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className="px-2 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isDeleting ? 'ลบ...' : 'ยืนยัน'}
        </button>
        <button
          onClick={() => setShowConfirm(false)}
          disabled={isDeleting}
          className="px-2 py-1 bg-gray-400 text-white text-xs rounded hover:bg-gray-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
      className="absolute top-3 right-3 px-2 py-1 bg-red-600/90 backdrop-blur-sm text-white text-xs rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed z-10"
      title="ลบรูปภาพ"
    >
      ✕ ลบ
    </button>
  )
}
