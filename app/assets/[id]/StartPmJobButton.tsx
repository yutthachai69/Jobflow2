"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import toast from "react-hot-toast"
import { startPmJobFromAsset } from "@/app/actions/pm"

type Props = {
  assetId: string
  /** ข้อความสั้น เช่น รอบที่ถึงกำหนด */
  hint?: string
}

export default function StartPmJobButton({ assetId, hint }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const onClick = async () => {
    setLoading(true)
    try {
      const { jobItemId } = await startPmJobFromAsset(assetId)
      toast.success("สร้างใบงาน PM แล้ว — ไปหน้าทำงาน")
      router.push(`/technician/job-item/${jobItemId}`)
      router.refresh()
    } catch (e) {
      const msg = e instanceof Error ? e.message : "ไม่สามารถเริ่มงานได้"
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-xl border border-emerald-200 bg-emerald-50/80 p-4 dark:border-emerald-800 dark:bg-emerald-950/30">
      <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-200 mb-1">
        ถึงกำหนดล้าง PM — พร้อมเริ่มงานในสนาม
      </p>
      {hint ? <p className="text-xs text-emerald-800/90 dark:text-emerald-300/90 mb-3">{hint}</p> : null}
      <p className="text-xs text-app-muted mb-3">
        สร้างใบสั่งงาน PM 1 ใบสำหรับรอบนี้ — ถ้าล็อกอินเป็นช่าง ระบบจะมอบหมายให้คุณทันที (แอดมินจะได้ใบงานแบบยังไม่มอบหมายช่าง)
      </p>
      <button
        type="button"
        onClick={onClick}
        disabled={loading}
        className="w-full sm:w-auto inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-sm font-bold shadow-md hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed transition-all"
      >
        {loading ? "กำลังสร้างใบงาน…" : "เริ่มงาน PM (สร้างใบงาน)"}
      </button>
    </div>
  )
}
