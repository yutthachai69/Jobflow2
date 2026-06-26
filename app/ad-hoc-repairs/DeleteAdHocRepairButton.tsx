'use client'

import { useState } from 'react'
import { deleteAdHocRepair } from '@/app/actions/work-orders'
import { useConfirm } from '@/app/components/ConfirmModal'
import toast from 'react-hot-toast'

interface Props {
  repairId: string
}

export default function DeleteAdHocRepairButton({ repairId }: Props) {
  const [isDeleting, setIsDeleting] = useState(false)
  const { confirm, ConfirmDialog } = useConfirm()

  async function handleDelete() {
    const confirmed = await confirm({
      title: 'ลบใบแจ้งซ่อม?',
      description: 'การลบใบแจ้งซ่อมนี้จะลบประวัติการทำงานด้วย ไม่สามารถกู้คืนได้',
      confirmText: 'ลบ',
      cancelText: 'ยกเลิก',
      variant: 'danger',
      icon: '🗑️',
    })

    if (!confirmed) return

    setIsDeleting(true)
    try {
      await deleteAdHocRepair(repairId)
      toast.success('ลบใบแจ้งซ่อมเรียบร้อยแล้ว')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'เกิดข้อผิดพลาด'
      toast.error(message)
      setIsDeleting(false)
    }
  }

  return (
    <>
      <button
        onClick={handleDelete}
        disabled={isDeleting}
        className="text-red-600 hover:text-red-800 font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isDeleting ? 'กำลังลบ...' : 'ลบ'}
      </button>
      <ConfirmDialog />
    </>
  )
}
