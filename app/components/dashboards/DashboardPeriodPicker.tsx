'use client'

import { useState } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'

const MONTH_NAMES = [
  'มกราคม',
  'กุมภาพันธ์',
  'มีนาคม',
  'เมษายน',
  'พฤษภาคม',
  'มิถุนายน',
  'กรกฎาคม',
  'สิงหาคม',
  'กันยายน',
  'ตุลาคม',
  'พฤศจิกายน',
  'ธันวาคม',
]

export default function DashboardPeriodPicker() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const now = new Date()
  const baseYear = now.getFullYear()
  const initialYear = Number(searchParams.get('year')) || baseYear
  const initialMonth = Number(searchParams.get('month')) || now.getMonth() + 1

  const [year, setYear] = useState(initialYear)
  const [month, setMonth] = useState(initialMonth)
  const [open, setOpen] = useState(false)

  const buddhistYear = year + 543
  // แสดงย้อนไปแค่ 4 ปี (ปีปัจจุบันและย้อนหลัง 3 ปี)
  const years = Array.from({ length: 4 }, (_, i) => baseYear - i)

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="inline-flex items-center justify-between min-w-[180px] px-3 py-2 rounded-xl border border-app bg-app-card text-sm font-medium text-app-heading shadow-sm"
      >
        <span>
          {MONTH_NAMES[month - 1]} {buddhistYear}
        </span>
        <svg
          className={`w-4 h-4 text-app-muted transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 z-50 bg-white rounded-xl border border-app shadow-xl flex overflow-hidden">
          <div className="min-w-[140px] max-h-72 overflow-y-auto">
            <div className="px-3 py-2 text-[11px] font-semibold text-app-muted border-b border-app bg-app-section">
              เดือน
            </div>
            {MONTH_NAMES.map((name, idx) => {
              const m = idx + 1
              const active = m === month
              return (
                <button
                  key={name}
                  type="button"
                  onClick={() => {
                    setMonth(m)
                    const params = new URLSearchParams(searchParams.toString())
                    params.set('month', String(m))
                    params.set('year', String(year))
                    router.push(`${pathname}?${params.toString()}`)
                    setOpen(false)
                  }}
                  className={`w-full text-left px-3 py-1.5 text-xs ${
                    active
                      ? 'bg-[var(--app-btn-primary)]/10 text-[var(--app-btn-primary)] font-semibold'
                      : 'text-app-body hover:bg-app-section'
                  }`}
                >
                  {name}
                </button>
              )
            })}
          </div>
          <div className="min-w-[80px] border-l border-app max-h-72 overflow-y-auto">
            <div className="px-3 py-2 text-[11px] font-semibold text-app-muted border-b border-app bg-app-section text-right">
              ปี
            </div>
            {years.map(y => {
              const active = y === year
              const display = y + 543
              return (
                <button
                  key={y}
                  type="button"
                  onClick={() => {
                    setYear(y)
                    const params = new URLSearchParams(searchParams.toString())
                    params.set('year', String(y))
                    params.set('month', String(month))
                    router.push(`${pathname}?${params.toString()}`)
                    setOpen(false)
                  }}
                  className={`w-full text-right px-3 py-1.5 text-xs ${
                    active
                      ? 'bg-[var(--app-btn-primary)] text-white font-semibold'
                      : 'text-app-body hover:bg-app-section'
                  }`}
                >
                  {display}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

