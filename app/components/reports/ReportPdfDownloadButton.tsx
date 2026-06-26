'use client'

import { useState } from 'react'

interface Props {
  jobItemId: string
  className?: string
  label?: string
}

export default function ReportPdfDownloadButton({
  jobItemId,
  className = 'px-5 py-2.5 bg-red-600 text-white rounded-lg font-semibold text-sm hover:bg-red-700 transition-colors flex items-center gap-2 disabled:opacity-60',
  label = '⬇️ ดาวน์โหลด PDF',
}: Props) {
  const [loading, setLoading] = useState(false)

  const handleDownload = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/pdf/report/${jobItemId}`)
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'PDF generation failed')
      }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      // ชื่อไฟล์จาก Content-Disposition header ถ้ามี
      const disposition = res.headers.get('Content-Disposition') ?? ''
      const match = disposition.match(/filename="?([^"]+)"?/)
      a.download = match?.[1] ?? `report-${jobItemId}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('PDF download error:', err)
      alert('เกิดข้อผิดพลาดในการสร้าง PDF กรุณาลองใหม่')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button onClick={handleDownload} disabled={loading} className={className}>
      {loading ? (
        <>
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
          กำลังสร้าง PDF...
        </>
      ) : (
        label
      )}
    </button>
  )
}
