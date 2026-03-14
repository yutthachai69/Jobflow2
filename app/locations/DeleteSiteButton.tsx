'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { deleteSite } from '@/app/actions'
import toast from 'react-hot-toast'
import ConfirmDialog from '@/app/components/ConfirmDialog'
import { isRedirectError } from '@/lib/error-handler'

interface Props {
  siteId: string
  siteName: string
}

export default function DeleteSiteButton({ siteId, siteName }: Props) {
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  async function handleDelete() {
    setIsDeleting(true)

    try {
      await deleteSite(siteId)
      toast.success('ลบสถานที่เรียบร้อยแล้ว')
      setShowConfirm(false)
      router.push('/locations')
      router.refresh()
    } catch (error) {
      if (isRedirectError(error)) throw error
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
    }
  }

  return (
    <>
      <button
        onClick={() => setShowConfirm(true)}
        disabled={isDeleting}
        className="inline-flex items-center px-3 py-1.5 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        ลบ
      </button>

      <ConfirmDialog
        isOpen={showConfirm}
        title="ลบสถานที่"
        message={`คุณแน่ใจหรือไม่ว่าต้องการลบสถานที่ "${siteName}"? การกระทำนี้ไม่สามารถยกเลิกได้`}
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
