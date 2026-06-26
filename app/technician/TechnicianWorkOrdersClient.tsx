'use client'

import { useState, useMemo, useEffect } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import TechnicianWorkOrdersFilter from './TechnicianWorkOrdersFilter'
import { formatThaiDate } from '@/lib/date-utils'

interface WorkOrder {
  id: string
  workOrderNumber?: string | null
  jobType: string
  status: string
  scheduledDate: Date
  site: {
    name: string
    client: {
      name: string
    }
  }
  jobItems: Array<{
    id: string
    status: string
    asset: {
      qrCode: string
    }
  }>
}

interface Props {
  myWorkOrders: WorkOrder[]
  unassignedWorkOrders: WorkOrder[]
}

export default function TechnicianWorkOrdersClient({
  myWorkOrders,
  unassignedWorkOrders,
}: Props) {
  const searchParams = useSearchParams()

  const [search, setSearch] = useState(searchParams.get('q') || '')
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'ALL')
  const [dateRangeFilter, setDateRangeFilter] = useState(searchParams.get('dateRange') || 'all')
  const [jobTypeFilter, setJobTypeFilter] = useState(searchParams.get('jobType') || 'ALL')
  const [customStartDate, setCustomStartDate] = useState(searchParams.get('startDate') || '')
  const [customEndDate, setCustomEndDate] = useState(searchParams.get('endDate') || '')

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams()
    if (search) params.set('q', search)
    if (statusFilter !== 'ALL') params.set('status', statusFilter)
    if (dateRangeFilter !== 'all') params.set('dateRange', dateRangeFilter)
    if (jobTypeFilter !== 'ALL') params.set('jobType', jobTypeFilter)
    if (customStartDate) params.set('startDate', customStartDate)
    if (customEndDate) params.set('endDate', customEndDate)

    const newUrl = params.toString() ? `/technician?${params.toString()}` : '/technician'
    window.history.replaceState({}, '', newUrl)
  }, [search, statusFilter, dateRangeFilter, jobTypeFilter, customStartDate, customEndDate])

  const filteredWorkOrders = useMemo(() => {
    const allWorkOrders = [...myWorkOrders, ...unassignedWorkOrders]

    // Get date range
    const now = new Date()
    let startDate = new Date(0)
    let endDate = new Date(now.getFullYear() + 10, 12, 31)

    if (dateRangeFilter === 'today') {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
    } else if (dateRangeFilter === 'week') {
      const dayOfWeek = now.getDay()
      startDate = new Date(now)
      startDate.setDate(now.getDate() - dayOfWeek)
      endDate = new Date(startDate)
      endDate.setDate(startDate.getDate() + 7)
    } else if (dateRangeFilter === 'month') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1)
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 1)
    } else if (dateRangeFilter === 'custom' && customStartDate && customEndDate) {
      startDate = new Date(customStartDate)
      endDate = new Date(customEndDate)
      endDate.setDate(endDate.getDate() + 1)
    }

    return allWorkOrders
      .filter((wo) => {
        // Search filter
        const searchLower = search.toLowerCase()
        const matchesSearch =
          !search ||
          (wo.workOrderNumber?.toLowerCase().includes(searchLower)) ||
          (wo.site.name.toLowerCase().includes(searchLower)) ||
          (wo.site.client.name.toLowerCase().includes(searchLower)) ||
          wo.jobItems.some((item) => item.asset.qrCode.toLowerCase().includes(searchLower))

        // Status filter
        const matchesStatus = statusFilter === 'ALL' || wo.status === statusFilter

        // Job Type filter
        const matchesJobType = jobTypeFilter === 'ALL' || wo.jobType === jobTypeFilter

        // Date range filter
        const woDate = new Date(wo.scheduledDate)
        const matchesDateRange = woDate >= startDate && woDate < endDate

        return matchesSearch && matchesStatus && matchesJobType && matchesDateRange
      })
      .sort((a, b) => {
        // Sort by: IN_PROGRESS first, then by scheduled date (soonest first)
        const statusOrder = {
          'IN_PROGRESS': 0,
          'OPEN': 1,
          'WAITING_APPROVAL': 2,
          'APPROVED': 3,
          'COMPLETED': 4,
        }

        const orderA = statusOrder[a.status as keyof typeof statusOrder] ?? 99
        const orderB = statusOrder[b.status as keyof typeof statusOrder] ?? 99

        if (orderA !== orderB) {
          return orderA - orderB
        }

        return new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime()
      })
  }, [myWorkOrders, unassignedWorkOrders, search, statusFilter, dateRangeFilter, jobTypeFilter, customStartDate, customEndDate])

  // Separate filtered work orders
  const filteredMyWorkOrders = filteredWorkOrders.filter((wo) => myWorkOrders.some((m) => m.id === wo.id))
  const filteredUnassignedWorkOrders = filteredWorkOrders.filter((wo) => unassignedWorkOrders.some((u) => u.id === wo.id))

  const renderWorkOrderCard = (wo: WorkOrder, isMyJob: boolean) => {
    const statusConfig = {
      'IN_PROGRESS': { bg: 'from-blue-500 to-indigo-600', text: '🔵 กำลังทำงาน' },
      'OPEN': { bg: 'from-green-400 to-emerald-500', text: '🟢 รอดำเนินการ' },
      'WAITING_APPROVAL': { bg: 'from-orange-400 to-amber-500', text: '⏳ รอลูกค้าอนุมัติ' },
      'APPROVED': { bg: 'from-purple-500 to-pink-500', text: '✅ อนุมัติแล้ว' },
      'COMPLETED': { bg: 'from-gray-400 to-gray-500', text: '🎉 เสร็จสิ้น' },
    }

    const config = statusConfig[wo.status as keyof typeof statusConfig] || { bg: 'from-gray-400 to-gray-500', text: wo.status }

    return (
      <div key={wo.id} className="bg-app-card rounded-2xl shadow-xl p-6 border border-app hover:shadow-2xl transition-all duration-300">
        <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4 mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <h2 className="text-xl font-bold text-app-heading">
                {wo.jobType}
                {wo.workOrderNumber && <span className="text-sm font-normal text-app-muted ml-2">#{wo.workOrderNumber}</span>}
              </h2>
              <div className={`px-3 py-1 bg-gradient-to-r ${config.bg} text-white rounded-lg shadow-sm text-xs font-semibold`}>
                {config.text}
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-app-body">
                <span className="text-lg">🏢</span>
                <span className="font-medium">{wo.site.name}</span>
              </div>
              <div className="flex items-center gap-2 text-app-muted text-sm">
                <span>•</span>
                <span>{wo.site.client.name}</span>
              </div>
              <div className="flex items-center gap-2 text-app-muted text-sm">
                <span>📅</span>
                <span>วันนัดหมาย: {formatThaiDate(wo.scheduledDate, 'long')}</span>
              </div>
            </div>
          </div>
          <Link
            href={`/technician/work-order/${wo.id}`}
            className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-6 py-3 rounded-xl hover:shadow-xl hover:scale-105 font-semibold transition-all duration-300 flex items-center justify-center gap-2 whitespace-nowrap"
          >
            <span>{isMyJob ? '▶️' : '👀'}</span>
            <span>{isMyJob ? 'เข้าทำงาน' : 'ดูรายละเอียด'}</span>
          </Link>
        </div>

        <div className="border-t border-app pt-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-sm font-semibold text-app-body">รายการงาน:</span>
            <span className="px-2 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded-lg text-sm font-bold">
              {wo.jobItems.length} รายการ
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {wo.jobItems.slice(0, 4).map((jobItem) => (
              <div key={jobItem.id} className="bg-app-section rounded-xl p-3 border border-app hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-200">
                <div className="flex items-start gap-2">
                  <span className="text-lg">❄️</span>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-app-heading truncate">{jobItem.asset.qrCode}</div>
                    <div className="text-xs text-app-muted font-mono bg-app-card px-2 py-0.5 rounded inline-block mt-1">
                      {jobItem.asset.qrCode}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {wo.jobItems.length > 4 && (
            <div className="mt-3 text-center">
              <span className="text-sm text-app-muted bg-app-section px-3 py-1 rounded-full">
                + อีก {wo.jobItems.length - 4} รายการ
              </span>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-md">
            <span className="text-2xl">🔧</span>
          </div>
          <h1 className="text-3xl font-bold text-app-heading">หน้างาน (ช่าง)</h1>
        </div>
        <p className="text-app-muted ml-15">จัดการงานบำรุงรักษาและซ่อมแซม</p>
      </div>

      {/* Filter Section */}
      <TechnicianWorkOrdersFilter
        searchValue={search}
        statusFilter={statusFilter}
        dateRangeFilter={dateRangeFilter}
        jobTypeFilter={jobTypeFilter}
        onSearchChange={(v) => setSearch(v)}
        onStatusFilterChange={(v) => setStatusFilter(v)}
        onDateRangeChange={(v) => {
          setDateRangeFilter(v)
          if (v !== 'custom') {
            setCustomStartDate('')
            setCustomEndDate('')
          }
        }}
        onCustomDateChange={(start, end) => {
          setCustomStartDate(start)
          setCustomEndDate(end)
        }}
        onJobTypeFilterChange={(v) => setJobTypeFilter(v)}
      />

      {/* Results Summary */}
      <div className="mb-6 p-4 bg-app-section rounded-lg border border-app">
        <p className="text-sm text-app-body">
          📊 พบ <span className="font-bold text-blue-500">{filteredWorkOrders.length}</span> ใบงาน
          {search && <span> • ค้นหา: &quot;<span className="font-semibold">{search}</span>&quot;</span>}
        </p>
      </div>

      {/* Unassigned Work Orders */}
      {filteredUnassignedWorkOrders.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-xl font-bold text-app-heading">📋 งานที่ยังไม่มีคนรับ</h2>
            <span className="px-2 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded-lg text-sm font-bold">
              {filteredUnassignedWorkOrders.length}
            </span>
          </div>
          <div className="space-y-4">
            {filteredUnassignedWorkOrders.map((wo) => renderWorkOrderCard(wo, false))}
          </div>
        </div>
      )}

      {/* My Work Orders */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-xl font-bold text-app-heading">📌 งานของฉัน</h2>
          <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg text-sm font-bold">
            {filteredMyWorkOrders.length}
          </span>
        </div>

        {filteredMyWorkOrders.length === 0 ? (
          <div className="bg-app-card rounded-2xl shadow-xl p-8 text-center border border-app">
            <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <span className="text-3xl">✅</span>
            </div>
            <h3 className="text-lg font-bold text-app-heading mb-2">
              {search || statusFilter !== 'ALL' || dateRangeFilter !== 'all' || jobTypeFilter !== 'ALL'
                ? 'ไม่พบงานที่ตรงกับเงื่อนไข'
                : 'ไม่มีงานที่ต้องทำ'}
            </h3>
            <p className="text-app-muted text-sm">
              {search || statusFilter !== 'ALL' || dateRangeFilter !== 'all' || jobTypeFilter !== 'ALL'
                ? 'ลองเปลี่ยนตัวกรองหรือคำค้นหา'
                : filteredUnassignedWorkOrders.length > 0
                  ? 'หรือเลือกรับงานจากรายการ "งานที่ยังไม่มีคนรับ" ด้านบน'
                  : 'ดูงานที่ยังไม่มีคนรับด้านบนเมื่อแอดมินสร้างใบงานใหม่'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredMyWorkOrders.map((wo) => renderWorkOrderCard(wo, true))}
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="bg-app-card border border-app rounded-2xl p-6 shadow-md">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-2xl">📱</span>
          <h3 className="font-bold text-app-heading text-lg">วิธีใช้งาน (สำหรับช่าง)</h3>
        </div>
        <ol className="space-y-3 text-sm text-app-body">
          {[
            'สำหรับ PM: สแกน QR ที่เครื่อง → เปิดหน้าทรัพย์สิน → ถ้าถึงกำหนดให้กด "เริ่มงาน PM" เพื่อสร้างใบงาน',
            'เลือกงานจาก "งานของฉัน" / "งานที่ยังไม่มีคนรับ" แล้วกด "เข้าทำงาน"',
            'สแกน QR ในใบงาน หรือเลือกจากรายการในใบงาน',
            'ถ่ายรูป Before (ก่อนทำ) และ After (หลังทำ)',
            'ให้ลูกค้าเซ็นรับงาน แล้วบันทึกข้อมูล',
          ].map((step, index) => (
            <li key={index} className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                {index + 1}
              </span>
              <span className="flex-1 pt-0.5">{step}</span>
            </li>
          ))}
        </ol>
      </div>
    </>
  )
}
