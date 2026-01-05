'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { deleteRoom } from '@/app/actions'
import toast from 'react-hot-toast'

interface Props {
  roomId: string
  roomName: string
}

export default function DeleteRoomButton({ roomId, roomName }: Props) {
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
      await deleteRoom(roomId)
      toast.success('ลบห้องเรียบร้อยแล้ว')
      router.push('/locations')
      router.refresh()
    } catch (error) {
      console.error('Error deleting room:', error)
      const errorMessage = error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการลบข้อมูล'
      if (errorMessage.includes('assets')) {
        toast.error('ไม่สามารถลบห้องที่มีแอร์ได้')
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
        <span className="text-xs text-gray-600">ยืนยัน?</span>
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
          className="px-2 py-1 bg-gray-200 text-gray-700 text-xs rounded hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
      className="inline-flex items-center px-2 py-0.5 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      ลบ
    </button>
  )
}
