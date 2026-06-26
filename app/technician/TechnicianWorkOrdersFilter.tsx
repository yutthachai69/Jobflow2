'use client'

import { useState } from 'react'

interface Props {
  onSearchChange: (search: string) => void
  onStatusFilterChange: (status: string) => void
  onDateRangeChange: (range: 'all' | 'today' | 'week' | 'month' | 'custom') => void
  onCustomDateChange: (startDate: string, endDate: string) => void
  onJobTypeFilterChange: (type: string) => void
  searchValue: string
  statusFilter: string
  dateRangeFilter: string
  jobTypeFilter: string
}

export default function TechnicianWorkOrdersFilter({
  onSearchChange,
  onStatusFilterChange,
  onDateRangeChange,
  onCustomDateChange,
  onJobTypeFilterChange,
  searchValue,
  statusFilter,
  dateRangeFilter,
  jobTypeFilter,
}: Props) {
  const [showCustomDate, setShowCustomDate] = useState(dateRangeFilter === 'custom')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const isFiltered = searchValue || statusFilter !== 'ALL' || dateRangeFilter !== 'all' || jobTypeFilter !== 'ALL'

  const handleDateRangeChange = (range: string) => {
    if (range === 'custom') {
      setShowCustomDate(true)
    } else {
      setShowCustomDate(false)
      onDateRangeChange(range as any)
    }
  }

  const handleCustomDateSubmit = () => {
    if (startDate && endDate) {
      onCustomDateChange(startDate, endDate)
      onDateRangeChange('custom')
    }
  }

  const handleClearAll = () => {
    onSearchChange('')
    onStatusFilterChange('ALL')
    onDateRangeChange('all')
    onJobTypeFilterChange('ALL')
    setStartDate('')
    setEndDate('')
    setShowCustomDate(false)
  }

  return (
    <div className="mb-6 flex flex-col gap-4">
      {/* Row 1: Search */}
      <div>
        <input
          type="text"
          placeholder="🔍 ค้นหาตาม Work Order #, สถานที่, ทรัพย์สิน..."
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full px-4 py-3 border border-app rounded-lg bg-app-card text-app-body focus:ring-2 focus:ring-[var(--app-btn-primary)] focus:border-[var(--app-btn-primary)] transition-all"
        />
      </div>

      {/* Row 2: Date Range Quick Buttons */}
      <div className="flex flex-wrap gap-2">
        <div className="text-sm font-semibold text-app-muted">📅 วันนัดหมาย:</div>
        <button
          onClick={() => handleDateRangeChange('today')}
          className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${
            dateRangeFilter === 'today'
              ? 'bg-blue-500 text-white'
              : 'bg-app-section text-app-body hover:bg-blue-100 dark:hover:bg-blue-900/30'
          }`}
        >
          วันนี้
        </button>
        <button
          onClick={() => handleDateRangeChange('week')}
          className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${
            dateRangeFilter === 'week'
              ? 'bg-blue-500 text-white'
              : 'bg-app-section text-app-body hover:bg-blue-100 dark:hover:bg-blue-900/30'
          }`}
        >
          สัปดาห์นี้
        </button>
        <button
          onClick={() => handleDateRangeChange('month')}
          className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${
            dateRangeFilter === 'month'
              ? 'bg-blue-500 text-white'
              : 'bg-app-section text-app-body hover:bg-blue-100 dark:hover:bg-blue-900/30'
          }`}
        >
          เดือนนี้
        </button>
        <button
          onClick={() => handleDateRangeChange('all')}
          className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${
            dateRangeFilter === 'all'
              ? 'bg-blue-500 text-white'
              : 'bg-app-section text-app-body hover:bg-blue-100 dark:hover:bg-blue-900/30'
          }`}
        >
          ทั้งหมด
        </button>
        <button
          onClick={() => handleDateRangeChange('custom')}
          className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${
            showCustomDate
              ? 'bg-blue-500 text-white'
              : 'bg-app-section text-app-body hover:bg-blue-100 dark:hover:bg-blue-900/30'
          }`}
        >
          ⚙️ กำหนดเอง
        </button>
      </div>

      {/* Custom Date Picker */}
      {showCustomDate && (
        <div className="flex flex-col sm:flex-row gap-3 p-4 bg-app-section rounded-lg border border-app">
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="flex-1 px-3 py-2 border border-app rounded-lg bg-app-card text-app-body focus:ring-2 focus:ring-[var(--app-btn-primary)] transition-all"
          />
          <div className="flex items-center text-app-muted">ถึง</div>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="flex-1 px-3 py-2 border border-app rounded-lg bg-app-card text-app-body focus:ring-2 focus:ring-[var(--app-btn-primary)] transition-all"
          />
          <button
            onClick={handleCustomDateSubmit}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-all whitespace-nowrap"
          >
            ✓ ยืนยัน
          </button>
        </div>
      )}

      {/* Row 3: Status + Job Type + Clear */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Status Filter */}
        <div className="sm:w-48">
          <select
            value={statusFilter}
            onChange={(e) => onStatusFilterChange(e.target.value)}
            className="w-full px-4 py-2 border border-app rounded-lg bg-app-card text-app-body focus:ring-2 focus:ring-[var(--app-btn-primary)] focus:border-[var(--app-btn-primary)] transition-all"
          >
            <option value="ALL">สถานะทั้งหมด</option>
            <option value="OPEN">🟢 รอดำเนินการ</option>
            <option value="IN_PROGRESS">🔵 กำลังทำงาน</option>
            <option value="WAITING_APPROVAL">⏳ รอลูกค้าอนุมัติ</option>
            <option value="APPROVED">✅ อนุมัติแล้ว</option>
            <option value="COMPLETED">🎉 เสร็จสิ้น</option>
          </select>
        </div>

        {/* Job Type Filter */}
        <div className="sm:w-48">
          <select
            value={jobTypeFilter}
            onChange={(e) => onJobTypeFilterChange(e.target.value)}
            className="w-full px-4 py-2 border border-app rounded-lg bg-app-card text-app-body focus:ring-2 focus:ring-[var(--app-btn-primary)] focus:border-[var(--app-btn-primary)] transition-all"
          >
            <option value="ALL">ประเภทงานทั้งหมด</option>
            <option value="PM">🔧 PM (บำรุงรักษา)</option>
            <option value="CM">🔨 CM (ซ่อมแซม)</option>
            <option value="INSTALL">📦 INSTALL (ติดตั้ง)</option>
          </select>
        </div>

        {/* Clear Button */}
        {isFiltered && (
          <button
            onClick={handleClearAll}
            className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium text-sm transition-all whitespace-nowrap"
          >
            🗑️ เคลียร์ทั้งหมด
          </button>
        )}
      </div>
    </div>
  )
}
