'use client'

import { useState } from "react"
import { useRouter } from "next/navigation"

const MONTH_NAMES = [
  "มกราคม",
  "กุมภาพันธ์",
  "มีนาคม",
  "เมษายน",
  "พฤษภาคม",
  "มิถุนายน",
  "กรกฎาคม",
  "สิงหาคม",
  "กันยายน",
  "ตุลาคม",
  "พฤศจิกายน",
  "ธันวาคม",
]

type MonthSummary = {
  month: number
  total: number
  acCount: number
  exhaustCount: number
  done: number
  inProgress: number
  pending: number
}

function MonthYearPicker({
  year,
  month,
  onMonthChange,
  onYearChange,
}: {
  year: number
  month: number
  onMonthChange: (m: number) => void
  onYearChange: (y: number) => void
}) {
  const [open, setOpen] = useState(false)
  const buddhistYear = year + 543

  const baseYear = year
  // แสดงแค่ 4 ปี: ปีปัจจุบันและย้อนหลัง 3 ปี
  const years = [0, -1, -2, -3].map((offset) => baseYear + offset)

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center justify-between min-w-[180px] px-3 py-2 rounded-xl border border-app bg-app-card text-sm font-medium text-app-heading shadow-sm"
      >
        <span>
          {MONTH_NAMES[month - 1]} {buddhistYear}
        </span>
        <svg
          className={`w-4 h-4 text-app-muted transition-transform ${
            open ? "rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 z-50 bg-white rounded-xl border border-app shadow-xl flex overflow-hidden">
          {/* คอลัมน์เดือน */}
          <div className="min-w-[140px] max-h-72 overflow-y-auto">
            <div className="px-3 py-2 text-xs font-semibold text-app-muted border-b border-app bg-app-section">
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
                    onMonthChange(m)
                    setOpen(false)
                  }}
                  className={`w-full text-left px-3 py-2 text-sm ${
                    active
                      ? "bg-[var(--app-btn-primary)]/10 text-[var(--app-btn-primary)] font-semibold"
                      : "text-app-body hover:bg-app-section"
                  }`}
                >
                  {name}
                </button>
              )
            })}
          </div>

          {/* คอลัมน์ปี */}
          <div className="min-w-[80px] border-l border-app max-h-72 overflow-y-auto">
            <div className="px-3 py-2 text-xs font-semibold text-app-muted border-b border-app bg-app-section text-right">
              ปี
            </div>
            {years.map((y) => {
              const active = y === year
              const display = y + 543
              return (
                <button
                  key={y}
                  type="button"
                  onClick={() => {
                    onYearChange(y)
                    setOpen(false)
                  }}
                  className={`w-full text-right px-3 py-2 text-sm ${
                    active
                      ? "bg-[var(--app-btn-primary)] text-white font-semibold"
                      : "text-app-body hover:bg-app-section"
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

interface ClientPMPlanClientProps {
  year: number
  summary: MonthSummary[]
  initialMonth: number
}

function StatusCard({
  title,
  count,
  unit,
  color,
}: {
  title: string
  count: number
  unit: string
  color: "blue" | "purple" | "gray"
}) {
  const colorClasses =
    color === "blue"
      ? "from-blue-500 to-indigo-500 text-white"
      : color === "purple"
      ? "from-violet-500 to-fuchsia-500 text-white"
      : "from-slate-600 to-slate-700 text-white"

  return (
    <div
      className={`rounded-2xl px-4 py-5 shadow-md bg-gradient-to-r ${colorClasses}`}
    >
      <div className="text-xs font-medium opacity-80 mb-1">{title}</div>
      <div className="flex items-baseline gap-1">
        <div className="text-3xl font-bold leading-none">{count}</div>
        <div className="text-xs opacity-80">{unit}</div>
      </div>
    </div>
  )
}

export default function ClientPMPlanClient({
  year,
  summary,
  initialMonth,
}: ClientPMPlanClientProps) {
  const router = useRouter()
  const [selectedMonth, setSelectedMonth] = useState(
    initialMonth,
  )

  const currentData =
    summary.find((m) => m.month === selectedMonth) ??
    ({
      month: selectedMonth,
      total: 0,
      acCount: 0,
      exhaustCount: 0,
      done: 0,
      inProgress: 0,
      pending: 0,
    } as MonthSummary)

  const yearly = summary.reduce(
    (acc, m) => {
      acc.total += m.total
      acc.ac += m.acCount
      acc.exhaust += m.exhaustCount
      acc.done += m.done
      acc.inProgress += m.inProgress
      acc.pending += m.pending
      return acc
    },
    {
      total: 0,
      ac: 0,
      exhaust: 0,
      done: 0,
      inProgress: 0,
      pending: 0,
    },
  )

  return (
    <div className="p-4 md:p-8">
      <header className="mb-6 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-app-heading mb-1">
            แผน PM ประจำปี {year}
          </h1>
        </div>
        {/* ตัวเลือก เดือน + ปี แบบ dropdown สองคอลัมน์ */}
        <MonthYearPicker
          year={year}
          month={selectedMonth}
          onMonthChange={(m) => {
            setSelectedMonth(m)
            router.replace(
              `/client/pm-plan?year=${year}&month=${m}`,
              { scroll: false },
            )
          }}
          onYearChange={(y) => {
            router.push(
              `/client/pm-plan?year=${y}&month=${selectedMonth}`,
            )
          }}
        />
      </header>

      {/* สรุปภาพรวมทั้งปี */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <StatusCard
          title="แอร์ทั้งปี"
          count={yearly.ac}
          unit="รอบ"
          color="blue"
        />
        <StatusCard
          title="Exhaust ทั้งปี"
          count={yearly.exhaust}
          unit="รอบ"
          color="purple"
        />
        <StatusCard
          title="แผนรวมทั้งปี"
          count={yearly.total}
          unit="รอบ"
          color="gray"
        />
        <StatusCard
          title="เสร็จแล้วทั้งปี"
          count={yearly.done}
          unit="รอบ"
          color="blue"
        />
      </div>

      {/* สรุปตัวเลขของเดือนที่เลือก */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <StatusCard
          title="แอร์"
          count={currentData.acCount}
          unit="เครื่อง"
          color="blue"
        />
        <StatusCard
          title="Exhaust"
          count={currentData.exhaustCount}
          unit="ตัว"
          color="purple"
        />
        <StatusCard
          title="รวมทั้งหมด"
          count={currentData.total}
          unit="รอบ"
          color="gray"
        />
      </div>

      {/* กล่องสถานะการดำเนินงาน */}
      <div className="bg-app-card rounded-2xl border border-app shadow-sm p-6">
        <h2 className="text-lg font-semibold text-app-heading mb-4">
          สถานะการดำเนินงานเดือน {MONTH_NAMES[selectedMonth - 1]}
        </h2>

        <div className="space-y-3">
          <div className="flex items-center justify-between rounded-xl bg-green-50 border border-green-100 px-4 py-3">
            <div className="text-sm font-medium text-green-800">
              เสร็จสิ้นแล้ว
            </div>
            <div className="text-2xl font-bold text-green-800">
              {currentData.done} รอบ
            </div>
          </div>

          <div className="flex items-center justify-between rounded-xl bg-blue-50 border border-blue-100 px-4 py-3">
            <div className="text-sm font-medium text-blue-800">
              มีใบงานแล้ว (กำลังดำเนินการ)
            </div>
            <div className="text-2xl font-bold text-blue-800">
              {currentData.inProgress} รอบ
            </div>
          </div>

          <div className="flex items-center justify-between rounded-xl bg-gray-50 border border-gray-200 px-4 py-3">
            <div className="text-sm font-medium text-gray-800">
              รอออกใบงาน
            </div>
            <div className="text-2xl font-bold text-gray-800">
              {currentData.pending} รอบ
            </div>
          </div>
        </div>
      </div>

      {/* ตารางภาพรวมทั้งปี */}
      <div className="mt-8 bg-app-card rounded-2xl border border-app shadow-sm p-6">
        <h2 className="text-lg font-semibold text-app-heading mb-4">
          ภาพรวมทั้งปี (แยกรายเดือน)
        </h2>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-app-muted border-b border-app">
                <th className="py-2 pr-4">เดือน</th>
                <th className="py-2 pr-4">แอร์</th>
                <th className="py-2 pr-4">Exhaust</th>
                <th className="py-2 pr-4">รวม</th>
                <th className="py-2 pr-4">เสร็จแล้ว</th>
                <th className="py-2 pr-4">มีใบงานแล้ว</th>
                <th className="py-2 pr-0">รอออกใบงาน</th>
              </tr>
            </thead>
            <tbody>
              {summary.map((m) => (
                <tr
                  key={m.month}
                  className="border-b border-app/60 last:border-b-0"
                >
                  <td className="py-2 pr-4 text-app-heading">
                    {MONTH_NAMES[m.month - 1]}
                  </td>
                  <td className="py-2 pr-4">{m.acCount}</td>
                  <td className="py-2 pr-4">{m.exhaustCount}</td>
                  <td className="py-2 pr-4 font-medium">{m.total}</td>
                  <td className="py-2 pr-4 text-green-700">{m.done}</td>
                  <td className="py-2 pr-4 text-blue-700">
                    {m.inProgress}
                  </td>
                  <td className="py-2 pr-0 text-gray-700">{m.pending}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

