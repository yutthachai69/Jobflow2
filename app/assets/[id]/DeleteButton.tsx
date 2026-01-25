'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import ConfirmDialog from '@/app/components/ConfirmDialog'

interface Props {
  assetId: string
}

export default function DeleteAssetButton({ assetId }: Props) {
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  async function handleDelete() {
    setIsDeleting(true)

    try {
      const response = await fetch(`/api/assets/${assetId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast.success('ลบข้อมูลทรัพย์สินเรียบร้อยแล้ว')
        setShowConfirm(false)
        router.push('/assets')
        router.refresh()
      } else {
        const data = await response.json()
        const errorMessage = data.error || 'เกิดข้อผิดพลาดในการลบข้อมูล'
        if (errorMessage.includes('work history') || errorMessage.includes('job items')) {
          toast.error('ไม่สามารถลบทรัพย์สินที่มีประวัติการซ่อมบำรุงได้')
        } else {
          toast.error(errorMessage)
        }
        setIsDeleting(false)
      }
    } catch (error) {
      console.error('Error deleting asset:', error)
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
        ลบ
      </button>

      <ConfirmDialog
        isOpen={showConfirm}
        title="ลบข้อมูลทรัพย์สิน"
        message="คุณแน่ใจหรือไม่ว่าต้องการลบข้อมูลทรัพย์สินนี้? การกระทำนี้ไม่สามารถยกเลิกได้"
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

