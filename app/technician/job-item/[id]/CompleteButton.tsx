'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import ConfirmDialog from '@/app/components/ConfirmDialog'
import { updateJobItemStatus } from '@/app/actions'
import { isRedirectError } from '@/lib/error-handler'

export default function CompleteJobItemButton({
  jobItemId,
  disabled,
  className,
  titleWhenDisabled,
}: {
  jobItemId: string
  disabled: boolean
  className: string
  titleWhenDisabled?: string
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  async function onConfirm() {
    setLoading(true)
    try {
      await (updateJobItemStatus(jobItemId, 'DONE') as unknown as Promise<void>)
      toast.success('ปิดงานเรียบร้อยแล้ว')
      setOpen(false)
      router.refresh()
    } catch (error) {
      if (isRedirectError(error)) throw error
      const msg = error instanceof Error ? error.message : 'เกิดข้อผิดพลาด'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button
        type="button"
        disabled={disabled}
        className={className}
        title={disabled ? titleWhenDisabled : undefined}
        onClick={() => setOpen(true)}
      >
        <span>เสร็จสิ้น</span>
      </button>

      <ConfirmDialog
        isOpen={open}
        title="ปิดงาน"
        message="คุณต้องการปิดงานนี้หรือไม่? เมื่อปิดงานแล้วจะไม่สามารถแก้ไขหรือเพิ่มรูปภาพได้"
        confirmText="ยืนยันปิดงาน"
        cancelText="ยกเลิก"
        confirmColor="green"
        onConfirm={onConfirm}
        onCancel={() => (loading ? null : setOpen(false))}
        isLoading={loading}
      />
    </>
  )
}

