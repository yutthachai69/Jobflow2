'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { migrateExhaustAssetCodes } from '@/app/actions/assets'

export default function MigrateExhaustBanner({
  needMigrateCount,
  userRole,
}: {
  needMigrateCount: number
  userRole: string
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  if (userRole !== 'ADMIN' || needMigrateCount === 0) return null

  const handleMigrate = async () => {
    setLoading(true)
    setMessage(null)
    try {
      const result = await migrateExhaustAssetCodes()
      if (result.error) {
        setMessage({ type: 'error', text: result.error })
      } else {
        setMessage({ type: 'success', text: `อัปเดตรหัส Exhaust เป็น EX-YYYY-NNN แล้ว ${result.updated} รายการ` })
        router.refresh()
      }
    } catch (e) {
      setMessage({ type: 'error', text: e instanceof Error ? e.message : 'เกิดข้อผิดพลาด' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-amber-800 dark:text-amber-200">
          <span className="font-semibold">พัดลมดูดอากาศ (Exhaust)</span> มี {needMigrateCount} รายการที่ยังไม่มีรหัสรูปแบบ EX-YYYY-NNN
          — กดปุ่มด้านล่างเพื่ออัปเดตให้เป็นรหัสมาตรฐาน (เรียงตามวันที่เพิ่ม)
        </p>
        <button
          type="button"
          onClick={handleMigrate}
          disabled={loading}
          className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-50"
        >
          {loading ? 'กำลังอัปเดต...' : 'อัปเดตรหัส Exhaust ให้เลย'}
        </button>
      </div>
      {message && (
        <p className={`mt-3 text-sm ${message.type === 'success' ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>
          {message.text}
        </p>
      )}
    </div>
  )
}
