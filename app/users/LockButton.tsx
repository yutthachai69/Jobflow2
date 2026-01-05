'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import ConfirmDialog from '@/app/components/ConfirmDialog'

interface Props {
  userId: string
  username: string
  isLocked: boolean
}

export default function LockButton({ userId, username, isLocked }: Props) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  async function handleConfirm() {
    setIsLoading(true)

    try {
      const response = await fetch('/api/security/lock-account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          action: isLocked ? 'unlock' : 'lock',
          reason: isLocked ? undefined : 'Manual lock by admin',
          durationMinutes: isLocked ? undefined : 15,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'เกิดข้อผิดพลาด')
      }

      toast.success(data.message || (isLocked ? 'ปลดล็อกบัญชีสำเร็จ' : 'ล็อกบัญชีสำเร็จ'))
      setShowConfirm(false)
      router.refresh()
    } catch (error) {
      console.error('Error locking/unlocking account:', error)
      toast.error(error instanceof Error ? error.message : 'เกิดข้อผิดพลาด')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setShowConfirm(true)}
        disabled={isLoading}
        className={`inline-flex items-center px-3 py-1.5 text-sm rounded-md transition-colors ${
          isLocked
            ? 'bg-green-600 text-white hover:bg-green-700'
            : 'bg-orange-600 text-white hover:bg-orange-700'
        } disabled:opacity-50 disabled:cursor-not-allowed`}
        title={isLocked ? 'ปลดล็อกบัญชี' : 'ล็อกบัญชี'}
      >
        {isLocked ? 'ปลดล็อก' : 'ล็อก'}
      </button>

      <ConfirmDialog
        isOpen={showConfirm}
        title={isLocked ? 'ปลดล็อกบัญชี' : 'ล็อกบัญชี'}
        message={
          isLocked
            ? `คุณต้องการปลดล็อกบัญชี "${username}" ใช่หรือไม่?`
            : `คุณต้องการล็อกบัญชี "${username}" ใช่หรือไม่?`
        }
        confirmText={isLocked ? 'ปลดล็อก' : 'ล็อก'}
        confirmColor={isLocked ? 'green' : 'orange'}
        onConfirm={handleConfirm}
        onCancel={() => setShowConfirm(false)}
        isLoading={isLoading}
      />
    </>
  )
}

