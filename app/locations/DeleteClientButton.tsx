'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { deleteClient } from '@/app/actions'
import toast from 'react-hot-toast'
import ConfirmDialog from '@/app/components/ConfirmDialog'
import { isRedirectError } from '@/lib/error-handler'

interface Props {
  clientId: string
  clientName: string
}

export default function DeleteClientButton({ clientId, clientName }: Props) {
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  async function handleDelete() {
    setIsDeleting(true)

    try {
      await deleteClient(clientId)
      toast.success('ลบลูกค้าเรียบร้อยแล้ว')
      setShowConfirm(false)
      router.push('/locations')
      router.refresh()
    } catch (error) {
      if (isRedirectError(error)) throw error
      console.error('Error deleting client:', error)
      const errorMessage = error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการลบข้อมูล'
      if (errorMessage.includes('sites')) {
        toast.error('ไม่สามารถลบลูกค้าที่มีสถานที่ได้')
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
        title="ลบลูกค้า"
        message={`คุณแน่ใจหรือไม่ว่าต้องการลบลูกค้า "${clientName}"? การกระทำนี้ไม่สามารถยกเลิกได้`}
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

