'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import ConfirmDialog from '@/app/components/ConfirmDialog'

interface DeleteButtonProps {
  userId: string
  username: string
}

export default function DeleteButton({ userId, username }: DeleteButtonProps) {
  const router = useRouter()
  const [showConfirm, setShowConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    try {
      const response = await fetch(`/api/users/${userId}/delete`, {
        method: 'POST',
      })

      if (response.ok) {
        toast.success('ลบผู้ใช้เรียบร้อยแล้ว')
        setShowConfirm(false)
        router.push('/users')
        router.refresh()
      } else {
        const url = new URL(response.url)
        const error = url.searchParams.get('error')
        if (error === 'cannot_delete_self') {
          toast.error('ไม่สามารถลบบัญชีของตัวเองได้')
        } else if (error === 'has_job_items') {
          toast.error('ไม่สามารถลบผู้ใช้ที่มีงานเกี่ยวข้องได้')
        } else {
          toast.error('เกิดข้อผิดพลาดในการลบผู้ใช้')
        }
        setIsDeleting(false)
        setShowConfirm(false)
      }
    } catch (error) {
      toast.error('เกิดข้อผิดพลาดในการลบผู้ใช้')
      setIsDeleting(false)
      setShowConfirm(false)
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setShowConfirm(true)}
        className="inline-flex items-center px-3 py-1.5 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 transition-colors"
      >
        ลบ
      </button>

      <ConfirmDialog
        isOpen={showConfirm}
        title="ลบผู้ใช้"
        message={`คุณแน่ใจหรือไม่ว่าต้องการลบผู้ใช้ "${username}"? การกระทำนี้ไม่สามารถยกเลิกได้`}
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


