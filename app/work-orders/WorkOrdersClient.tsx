'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import Pagination from '@/app/components/Pagination'
import EmptyState from '@/app/components/EmptyState'
import ConfirmDialog from '@/app/components/ConfirmDialog'
import { deleteWorkOrder } from '@/app/actions'
import { isRedirectError } from '@/lib/error-handler'
import { getWOStatus, getJobStatus } from '@/lib/status-colors'
import { getWorkOrderDisplayNumber } from '@/lib/work-order-number'
import { formatThaiDate } from '@/lib/date-utils'
import toast from 'react-hot-toast'

const JOB_TYPE_CONFIG: Record<string, { style: React.CSSProperties; emoji: string }> = {
  PM: { style: { background: 'linear-gradient(135deg,#1d4ed8,#1e40af)', color: '#fff', boxShadow: '0 2px 8px rgba(37,99,235,0.35)', padding: '2px 10px', borderRadius: '9999px', fontSize: '11px', fontWeight: 700 }, emoji: '🔧' },
  CM: { style: { background: 'linear-gradient(135deg,#dc2626,#991b1b)', color: '#fff', boxShadow: '0 2px 8px rgba(220,38,38,0.35)', padding: '2px 10px', borderRadius: '9999px', fontSize: '11px', fontWeight: 700 }, emoji: '⚡' },
  INSTALL: { style: { background: 'linear-gradient(135deg,#059669,#047857)', color: '#fff', boxShadow: '0 2px 8px rgba(5,150,105,0.35)', padding: '2px 10px', borderRadius: '9999px', fontSize: '11px', fontWeight: 700 }, emoji: '🆕' },
}
const getJobTypeBadge = (jobType: string) => {
  const cfg = JOB_TYPE_CONFIG[jobType] || { style: { background: '#475569', color: '#fff', padding: '2px 10px', borderRadius: '9999px', fontSize: '11px', fontWeight: 700 }, emoji: '📋' }
  return <span style={cfg.style}>{cfg.emoji} {jobType}</span>
}

interface Site {
  id: string
  name: string
  client: {
    name: string
  }
}

interface Technician {
  id: string
  fullName: string | null
  username: string
}

interface Asset {
  id: string
  qrCode: string
  room: {
    name: string
    floor: {
      name: string
      building: {
        name: string
        site: {
          name: string
        }
      }
    }
  }
}

interface JobItem {
  id: string
  status: string
  startTime: Date | null
  endTime: Date | null
  techNote: string | null
  workOrder: {
    id: string
    jobType: string
    scheduledDate: Date
    status: string
    site: {
      name: string
      client: {
        name: string
      }
    }
  }
  asset: Asset
  technician: Technician | null
  photos: Array<{
    id: string
    type: string
    url: string
    createdAt: Date
  }>
}

interface WorkOrder {
  id: string
  workOrderNumber?: string | null
  jobType: string
  scheduledDate: Date
  status: string
  duplicateOfId?: string | null
  isPotentialDuplicatePmMonthly?: boolean
  potentialDuplicateAssetCodes?: string[]
  potentialDuplicatePmCount?: number
  conflictingWorkOrderIds?: string[]
  potentialDuplicateBuckets?: Array<{
    assetId: string
    assetCode: string
    pmTypeLabel: string
    workOrderIds: string[]
  }>
  _count?: {
    duplicates: number
  }
  site: {
    id: string
    name: string
    client: {
      name: string
    }
  }
  jobItems: Array<{
    id: string
    status: string
    adHocPmType?: string | null
    asset: {
      id: string
      qrCode: string
    }
  }>
}

interface Props {
  userRole: 'ADMIN' | 'TECHNICIAN' | 'CLIENT'
  workOrders?: WorkOrder[]
  technicianJobItems?: JobItem[]
  technicianListTitle?: string
  technicianListScope?: 'mine' | 'all'
  allSites?: Site[] | null
  selectedSiteId?: string
  userSiteName?: string
  currentPage?: number
  totalPages?: number
  totalItems?: number
  itemsPerPage?: number
}

export default function WorkOrdersClient({
  userRole,
  workOrders = [],
  technicianJobItems = [],
  technicianListTitle,
  technicianListScope = 'mine',
  allSites = null,
  selectedSiteId,
  userSiteName,
  currentPage = 1,
  totalPages = 1,
  totalItems = 0,
  itemsPerPage = 20,
}: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [filterSiteId, setFilterSiteId] = useState(selectedSiteId || '')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [duplicateFilter, setDuplicateFilter] = useState<'ALL' | 'DUPLICATE_ONLY' | 'POTENTIAL_PM_MONTHLY' | 'NORMAL_ONLY'>('ALL')
  const [dateRangeFilter, setDateRangeFilter] = useState<'all' | 'today' | 'week' | 'month' | 'custom'>('all')
  const [customStartDate, setCustomStartDate] = useState('')
  const [customEndDate, setCustomEndDate] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null)
  const [forceDeleteTargetId, setForceDeleteTargetId] = useState<string | null>(null)

  const getDateRange = () => {
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

    return { startDate, endDate }
  }

  const matchesWorkOrderFilters = (wo: WorkOrder) => {
    const searchLower = search.toLowerCase()
    const workOrderNumber = getWorkOrderDisplayNumber(wo)
    const matchesSearch = !search ||
      workOrderNumber.toLowerCase().includes(searchLower) ||
      wo.id.toLowerCase().includes(searchLower) ||
      wo.jobType.toLowerCase().includes(searchLower) ||
      wo.site.name.toLowerCase().includes(searchLower) ||
      wo.site.client.name.toLowerCase().includes(searchLower)
    const matchesStatus = statusFilter === 'ALL' || wo.status === statusFilter

    const isDuplicateRelated = Boolean(wo.duplicateOfId) || (wo._count?.duplicates ?? 0) > 0
    const isPotentialPmMonthly = Boolean(wo.isPotentialDuplicatePmMonthly)
    const matchesDuplicate =
      duplicateFilter === 'ALL' ||
      (duplicateFilter === 'DUPLICATE_ONLY' && isDuplicateRelated) ||
      (duplicateFilter === 'POTENTIAL_PM_MONTHLY' && isPotentialPmMonthly) ||
      (duplicateFilter === 'NORMAL_ONLY' && !isDuplicateRelated)

    // Date range filter
    const { startDate, endDate } = getDateRange()
    const woDate = new Date(wo.scheduledDate)
    const matchesDateRange = dateRangeFilter === 'all' || (woDate >= startDate && woDate < endDate)

    return matchesSearch && matchesStatus && matchesDuplicate && matchesDateRange
  }

  const getWorkOrderLabel = (workOrderId: string) => {
    const wo = workOrders.find((item) => item.id === workOrderId)
    if (!wo) return workOrderId
    return getWorkOrderDisplayNumber(wo)
  }

  const filteredWorkOrders = workOrders
    .filter(matchesWorkOrderFilters)
    .sort((a, b) => {
      if (duplicateFilter !== 'POTENTIAL_PM_MONTHLY') return 0
      const aScore = a.potentialDuplicatePmCount ?? 0
      const bScore = b.potentialDuplicatePmCount ?? 0
      return bScore - aScore
    })

  const workOrdersById = new Map(workOrders.map((wo) => [wo.id, wo]))
  const pairConflictGroups = duplicateFilter === 'POTENTIAL_PM_MONTHLY'
    ? (() => {
      const groupMap = new Map<string, {
        assetId: string
        assetCode: string
        pmTypeLabel: string
        workOrders: WorkOrder[]
      }>()

      for (const wo of filteredWorkOrders) {
        const buckets = wo.potentialDuplicateBuckets ?? []
        for (const bucket of buckets) {
          const ids = Array.from(new Set([wo.id, ...bucket.workOrderIds])).sort()
          const key = `${bucket.assetCode}__${bucket.pmTypeLabel}__${ids.join('|')}`
          if (groupMap.has(key)) continue
          const grouped = ids
            .map((id) => workOrdersById.get(id))
            .filter((item): item is WorkOrder => Boolean(item))
            .sort((a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime())
          groupMap.set(key, {
            assetId: bucket.assetId,
            assetCode: bucket.assetCode,
            pmTypeLabel: bucket.pmTypeLabel,
            workOrders: grouped,
          })
        }
      }

      return [...groupMap.values()].sort((a, b) => b.workOrders.length - a.workOrders.length)
    })()
    : []

  async function doDeleteWorkOrder(workOrderId: string, force?: boolean) {
    setIsDeleting(true)
    try {
      const res = (await deleteWorkOrder(workOrderId, force)) as unknown as { success: boolean; error?: string }

      if (!res?.success) {
        const errorMessage = res?.error || 'เกิดข้อผิดพลาดในการลบข้อมูล'
        if (errorMessage === 'CONFIRM_DELETE_COMPLETED') {
          setDeleteTargetId(null)
          setForceDeleteTargetId(workOrderId)
          setIsDeleting(false)
          return
        }
        toast.error(errorMessage)
        setIsDeleting(false)
        return
      }

      toast.success('ลบใบสั่งงานเรียบร้อยแล้ว')
      setDeleteTargetId(null)
      setForceDeleteTargetId(null)
      setIsDeleting(false)
      router.refresh()
    } catch (error) {
      if (isRedirectError(error)) throw error
      console.error('Error deleting work order:', error)
      toast.error('เกิดข้อผิดพลาดในการลบข้อมูล')
      setIsDeleting(false)
    }
  }

  const handleSiteFilterChange = (siteId: string) => {
    setFilterSiteId(siteId)
    const params = new URLSearchParams(searchParams.toString())
    if (siteId) {
      params.set('siteId', siteId)
    } else {
      params.delete('siteId')
    }
    router.push(`/work-orders?${params.toString()}`)
  }

  // สำหรับ TECHNICIAN: แสดง Job Items ที่ตัวเองทำ
  if (userRole === 'TECHNICIAN') {
    return (
      <div className="p-4 md:p-8">
        <div className="w-full max-w-full">
          <div className="mb-6">
            <h1 className="text-2xl md:text-3xl font-bold text-app-heading mb-2">
              📋 {technicianListTitle ?? 'ประวัติการทำงานของฉัน'}
            </h1>
            <p className="text-app-muted">
              {technicianListScope === 'all'
                ? `รายการทั้งระบบ — ตัวเลขตรงกับแดชบอร์ดแอดมิน (ภาพรวมทั้งระบบ) · ${technicianJobItems.length} รายการ`
                : `รายการงานที่คุณรับผิดชอบ · ${technicianJobItems.length} รายการ`}
            </p>
            <div className="mt-3 flex flex-wrap gap-2 text-sm">
              <Link
                href="/work-orders"
                className={`px-3 py-1.5 rounded-lg border ${technicianListScope === 'mine' && !searchParams.get('status') ? 'border-[#C2A66A] bg-[#C2A66A]/10 text-app-heading' : 'border-app text-app-muted hover:bg-app-section'}`}
              >
                ของฉัน
              </Link>
              <Link
                href="/work-orders?scope=all&status=ACTIVE"
                className={`px-3 py-1.5 rounded-lg border ${technicianListScope === 'all' && searchParams.get('status') === 'ACTIVE' ? 'border-[#C2A66A] bg-[#C2A66A]/10 text-app-heading' : 'border-app text-app-muted hover:bg-app-section'}`}
              >
                กำลังดำเนินการ (ทั้งระบบ)
              </Link>
              <Link
                href="/work-orders?scope=all&status=DONE&today=1"
                className={`px-3 py-1.5 rounded-lg border ${technicianListScope === 'all' && searchParams.get('status') === 'DONE' && searchParams.get('today') === '1' ? 'border-[#C2A66A] bg-[#C2A66A]/10 text-app-heading' : 'border-app text-app-muted hover:bg-app-section'}`}
              >
                เสร็จวันนี้ (ทั้งระบบ)
              </Link>
              <Link
                href="/work-orders?scope=all&status=DONE"
                className={`px-3 py-1.5 rounded-lg border ${technicianListScope === 'all' && searchParams.get('status') === 'DONE' && searchParams.get('today') !== '1' ? 'border-[#C2A66A] bg-[#C2A66A]/10 text-app-heading' : 'border-app text-app-muted hover:bg-app-section'}`}
              >
                เสร็จแล้วทั้งหมด (ทั้งระบบ)
              </Link>
            </div>
          </div>

          {technicianJobItems.length === 0 ? (
            <EmptyState icon="📭" title="ยังไม่มีประวัติการทำงาน" description="เมื่อคุณทำงานเสร็จแล้ว ประวัติจะแสดงที่นี่" actionLabel="ไปหน้างาน" actionHref="/technician" />
          ) : (
            <div className="space-y-4">
              {technicianJobItems.map((jobItem) => {
                const st = getJobStatus(jobItem.status)
                return (
                  <div key={jobItem.id} className="bg-app-card rounded-lg shadow-lg border border-app border-l-4 p-6 hover:shadow-xl transition" style={{ borderLeftColor: st.hex }}>
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                          <span className="text-2xl">{jobItem.workOrder.jobType === 'PM' ? '🔧' : jobItem.workOrder.jobType === 'CM' ? '⚡' : '🆕'}</span>
                          <h3 className="text-lg font-bold text-app-heading">{jobItem.asset.qrCode}</h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${st.tailwind}`}>{st.label}</span>
                        </div>
                        <div className="text-sm text-app-body space-y-1">
                          <div className="flex items-center gap-2"><span className="font-medium text-app-muted">QR Code:</span><span className="font-mono">{jobItem.asset.qrCode}</span></div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span>{jobItem.asset.room.floor.building.site.name}</span>
                            <span className="text-app-muted">→</span>
                            <span>{jobItem.asset.room.floor.building.name}</span>
                            <span className="text-app-muted">→</span>
                            <span>{jobItem.asset.room.floor.name}</span>
                            <span className="text-app-muted">→</span>
                            <span>{jobItem.asset.room.name}</span>
                          </div>
                          <div className="flex items-center gap-2"><span className="font-medium text-app-muted">งาน:</span><span>{jobItem.workOrder.jobType} - {jobItem.workOrder.site.name}</span></div>
                          {jobItem.startTime && (
                            <div className="flex items-center gap-2"><span className="font-medium text-app-muted">วันที่ทำ:</span><span>{new Date(jobItem.startTime).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}</span></div>
                          )}
                          {jobItem.startTime && jobItem.endTime && (
                            <div className="flex items-center gap-2"><span className="font-medium text-app-muted">ใช้เวลา:</span><span>{Math.round((new Date(jobItem.endTime).getTime() - new Date(jobItem.startTime).getTime()) / 60000)} นาที</span></div>
                          )}
                        </div>
                        {jobItem.techNote && (
                          <div className="mt-3 p-3 bg-app-section rounded-lg">
                            <p className="text-sm text-app-body"><span className="font-medium text-app-muted">บันทึก:</span> {jobItem.techNote}</p>
                          </div>
                        )}
                        {jobItem.photos && jobItem.photos.length > 0 && (
                          <div className="mt-3">
                            <p className="text-xs text-app-muted mb-2">รูปภาพ ({jobItem.photos.length} รูป)</p>
                            <div className="grid grid-cols-4 gap-2">
                              {jobItem.photos.slice(0, 4).map((photo) => (
                                <img key={photo.id} src={photo.url} alt={photo.type} className="w-full h-20 object-cover rounded border border-app" />
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      <Link href={`/technician/job-item/${jobItem.id}`} className="ml-4 font-medium text-sm whitespace-nowrap btn-app-primary px-3 py-1.5 rounded-lg hover:shadow-md transition-all">
                        ดูรายละเอียด →
                      </Link>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    )
  }

  // สำหรับ ADMIN และ CLIENT: แสดง Work Orders
  return (
    <div className="p-4 md:p-8">
      <div className="w-full max-w-full">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-app-heading">
              {userRole === 'CLIENT' ? '📋 ประวัติงานทั้งหมด' : '📋 ใบสั่งงานทั้งหมด'}
            </h1>
            {userRole === 'CLIENT' && userSiteName && <p className="text-app-muted mt-1">สถานที่: {userSiteName}</p>}
            {userRole === 'ADMIN' && (
              <p className="text-app-muted mt-1">
                {selectedSiteId ? `กรองตามสถานที่: ${allSites?.find(s => s.id === selectedSiteId)?.name || 'ทั้งหมด'}` : 'แสดงทั้งหมด'}
              </p>
            )}
          </div>
          {userRole === 'ADMIN' && (
            <Link href="/work-orders/new" className="w-full sm:w-auto btn-app-primary px-4 py-2 rounded-lg hover:shadow-md font-medium text-sm sm:text-base text-center transition-all">
              + สร้างใบสั่งงานใหม่
            </Link>
          )}
        </div>

        {/* Search & Filters */}
        <div className="mb-6 bg-app-card rounded-lg shadow-lg border border-app p-4 space-y-4">
          <div>
            <input
              type="text"
              placeholder="ค้นหาตาม ID, ชนิดงาน, สถานที่..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-4 py-2 border border-app rounded-lg bg-app-section text-app-heading placeholder:text-app-muted focus:ring-2 focus:ring-[var(--app-btn-primary)] focus:border-[var(--app-btn-primary)] transition-all"
            />
          </div>
          <div className="flex flex-col sm:flex-row gap-4">
            {userRole === 'ADMIN' && allSites && allSites.length > 0 && (
              <div className="flex-1">
                <label className="block text-sm font-semibold text-app-muted mb-2">กรองตามสถานที่:</label>
                <select
                  value={filterSiteId}
                  onChange={(e) => handleSiteFilterChange(e.target.value)}
                  className="w-full border border-app rounded-lg px-4 py-2 bg-app-section text-app-heading focus:ring-2 focus:ring-[var(--app-btn-primary)] focus:border-[var(--app-btn-primary)] transition-all"
                >
                  <option value="">ทั้งหมด</option>
                  {allSites.map((site) => (
                    <option key={site.id} value={site.id}>{site.name} ({site.client.name})</option>
                  ))}
                </select>
              </div>
            )}
            <div className="sm:w-48">
              <label className="block text-sm font-semibold text-app-muted mb-2">กรองตามสถานะ:</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full border border-app rounded-lg px-4 py-2 bg-app-section text-app-heading focus:ring-2 focus:ring-[var(--app-btn-primary)] focus:border-[var(--app-btn-primary)]"
              >
                <option value="ALL">ทุกสถานะ</option>
                <option value="OPEN">{getWOStatus('OPEN').label}</option>
                <option value="IN_PROGRESS">{getWOStatus('IN_PROGRESS').label}</option>
                <option value="COMPLETED">{getWOStatus('COMPLETED').label}</option>
                <option value="CANCELLED">{getWOStatus('CANCELLED').label}</option>
              </select>
            </div>
            <div className="sm:w-56">
              <label className="block text-sm font-semibold text-app-muted mb-2">กรองงานซ้ำ:</label>
              <select
                value={duplicateFilter}
                onChange={(e) => setDuplicateFilter(e.target.value as 'ALL' | 'DUPLICATE_ONLY' | 'POTENTIAL_PM_MONTHLY' | 'NORMAL_ONLY')}
                className="w-full border border-app rounded-lg px-4 py-2 bg-app-section text-app-heading focus:ring-2 focus:ring-[var(--app-btn-primary)] focus:border-[var(--app-btn-primary)]"
              >
                <option value="ALL">ทั้งหมด</option>
                <option value="DUPLICATE_ONLY">เฉพาะงานซ้ำ</option>
                <option value="POTENTIAL_PM_MONTHLY">อาจซ้ำ (PM เดือนเดียวกัน)</option>
                <option value="NORMAL_ONLY">เฉพาะงานปกติ</option>
              </select>
            </div>
          </div>

          {/* Date Range Filter */}
          <div className="border-t border-app pt-4 space-y-3">
            <div className="flex flex-wrap gap-2">
              <label className="text-sm font-semibold text-app-muted self-center">📅 วันนัดหมาย:</label>
              <button
                onClick={() => setDateRangeFilter('all')}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${
                  dateRangeFilter === 'all'
                    ? 'bg-blue-500 text-white'
                    : 'bg-app-section text-app-body hover:bg-blue-100 dark:hover:bg-blue-900/30'
                }`}
              >
                ทั้งหมด
              </button>
              <button
                onClick={() => setDateRangeFilter('today')}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${
                  dateRangeFilter === 'today'
                    ? 'bg-blue-500 text-white'
                    : 'bg-app-section text-app-body hover:bg-blue-100 dark:hover:bg-blue-900/30'
                }`}
              >
                วันนี้
              </button>
              <button
                onClick={() => setDateRangeFilter('week')}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${
                  dateRangeFilter === 'week'
                    ? 'bg-blue-500 text-white'
                    : 'bg-app-section text-app-body hover:bg-blue-100 dark:hover:bg-blue-900/30'
                }`}
              >
                สัปดาห์นี้
              </button>
              <button
                onClick={() => setDateRangeFilter('month')}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${
                  dateRangeFilter === 'month'
                    ? 'bg-blue-500 text-white'
                    : 'bg-app-section text-app-body hover:bg-blue-100 dark:hover:bg-blue-900/30'
                }`}
              >
                เดือนนี้
              </button>
              <button
                onClick={() => setDateRangeFilter('custom')}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${
                  dateRangeFilter === 'custom'
                    ? 'bg-blue-500 text-white'
                    : 'bg-app-section text-app-body hover:bg-blue-100 dark:hover:bg-blue-900/30'
                }`}
              >
                ⚙️ กำหนดเอง
              </button>
            </div>

            {dateRangeFilter === 'custom' && (
              <div className="flex flex-col sm:flex-row gap-3 p-3 bg-app-section rounded-lg border border-app">
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="flex-1 px-3 py-2 border border-app rounded-lg bg-app-card text-app-body focus:ring-2 focus:ring-[var(--app-btn-primary)] transition-all"
                />
                <div className="flex items-center text-app-muted">ถึง</div>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="flex-1 px-3 py-2 border border-app rounded-lg bg-app-card text-app-body focus:ring-2 focus:ring-[var(--app-btn-primary)] transition-all"
                />
              </div>
            )}
          </div>
        </div>

        {duplicateFilter === 'POTENTIAL_PM_MONTHLY' && (
          <div className="mb-6 space-y-3">
            {pairConflictGroups.length === 0 ? (
              <div className="bg-app-card rounded-lg border border-app p-6">
                <EmptyState
                  icon="✅"
                  title="ไม่พบคู่งานซ้ำตามเงื่อนไข"
                  description="ระบบไม่พบ PM เครื่องเดียวกันและประเภทล้างเดียวกันในเดือนเดียวกัน"
                />
              </div>
            ) : (
              pairConflictGroups.map((group, idx) => (
                <div key={`${group.assetCode}_${idx}`} className="bg-app-card rounded-lg border border-orange-200 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-sm font-semibold text-orange-800">
                      คู่ซ้ำ: {group.assetCode} ({group.pmTypeLabel})
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-xs text-orange-700">
                        พบ {group.workOrders.length} ใบงาน
                      </div>
                      <Link
                        href={`/assets/${group.assetId}`}
                        className="text-xs font-semibold text-blue-700 hover:underline"
                      >
                        ดูรายละเอียดเครื่อง
                      </Link>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {group.workOrders.map((wo) => (
                      <div key={wo.id} className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 border border-app rounded-lg p-3 bg-white">
                        <div className="text-sm text-app-body">
                          <span className="font-mono font-semibold">{getWorkOrderDisplayNumber(wo)}</span>
                          <span className="mx-2 text-app-muted">|</span>
                          <span>{formatThaiDate(wo.scheduledDate, 'long')}</span>
                          <span className="mx-2 text-app-muted">|</span>
                          <span>{wo.site.name}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {duplicateFilter !== 'POTENTIAL_PM_MONTHLY' && (
        <>
        {/* Mobile Card View */}
        <div className="md:hidden space-y-3">
          {filteredWorkOrders.map((wo) => {
              const doneCount = wo.jobItems.filter((j) => j.status === "DONE").length
              const st = getWOStatus(wo.status)
              const workOrderNumber = getWorkOrderDisplayNumber(wo)
              const isLinkedDuplicate = Boolean(wo.duplicateOfId)
              const hasChildrenDuplicates = (wo._count?.duplicates ?? 0) > 0
              const isPotentialPmMonthly = Boolean(wo.isPotentialDuplicatePmMonthly)
              const duplicateAssets = wo.potentialDuplicateAssetCodes ?? []
              const duplicateAssetPreview = duplicateAssets.slice(0, 2)
              const extraDuplicateAssets = Math.max(0, duplicateAssets.length - duplicateAssetPreview.length)
              const conflictingWorkOrders = wo.conflictingWorkOrderIds ?? []
              const conflictingPreview = conflictingWorkOrders.slice(0, 2)
              const extraConflicting = Math.max(0, conflictingWorkOrders.length - conflictingPreview.length)
              const conflictBuckets = wo.potentialDuplicateBuckets ?? []
              const bucketPreview = conflictBuckets.slice(0, 1)
              const extraBuckets = Math.max(0, conflictBuckets.length - bucketPreview.length)
              return (
                <div key={wo.id} className="bg-app-card rounded-lg border border-app border-l-4 p-4 shadow-lg" style={{ borderLeftColor: st.hex }}>
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <div className="font-mono text-xs text-app-muted mb-1">เลขที่ {workOrderNumber}</div>
                      <div className="font-bold text-app-heading text-base mb-2 flex items-center gap-2 flex-wrap">
                        {getJobTypeBadge(wo.jobType)}
                        {isLinkedDuplicate && (
                          <span className="px-2 py-1 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-800">
                            งานซ้ำยืนยันแล้ว
                          </span>
                        )}
                        {!isLinkedDuplicate && hasChildrenDuplicates && (
                          <span className="px-2 py-1 rounded-full text-[11px] font-semibold bg-purple-100 text-purple-800">
                            มีงานซ้ำต่อจากงานนี้
                          </span>
                        )}
                        {isPotentialPmMonthly && (
                          <span className="px-2 py-1 rounded-full text-[11px] font-semibold bg-orange-100 text-orange-800">
                            อาจซ้ำ PM เครื่องเดิม+ประเภทล้างเดียวกัน
                          </span>
                        )}
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${st.tailwind}`}>{st.label}</span>
                  </div>
                  <div className="space-y-2 mb-3 pb-3 border-b border-app">
                    <div>
                      <div className="text-xs text-app-muted mb-1">สถานที่</div>
                      <div className="text-sm text-app-heading font-medium">{wo.site.name}</div>
                      <div className="text-xs text-app-muted">{wo.site.client.name}</div>
                    </div>
                    <div>
                      <div className="text-xs text-app-muted mb-1">วันนัดหมาย</div>
                      <div className="text-sm text-app-heading">{formatThaiDate(wo.scheduledDate, 'long')}</div>
                    </div>
                    <div>
                      <div className="text-xs text-app-muted mb-1">รายการงาน</div>
                      <div className="text-sm text-app-heading mb-1">{doneCount}/{wo.jobItems.length} เสร็จ</div>
                      {wo.jobItems.length > 0 && (
                        <div className="w-full bg-app-section rounded-full h-1.5">
                          <div className="h-1.5 rounded-full transition-all" style={{ width: `${(doneCount / wo.jobItems.length) * 100}%`, backgroundColor: st.hex }} />
                        </div>
                      )}
                    </div>
                    {isPotentialPmMonthly && (
                      <div className="mt-3 p-3 bg-orange-50 rounded-lg border border-orange-100">
                        <div className="text-xs text-orange-700 font-bold mb-1 flex items-center gap-1">
                          ⚠️ อาจซ้ำกับ PM อื่นในเดือนนี้
                        </div>
                        <div className="text-[11px] text-orange-800 space-y-1">
                          {bucketPreview.length > 0 && (
                            <div className="mb-2">
                              <span className="font-semibold">คู่ที่ชน:</span>{' '}
                              <div className="flex flex-wrap gap-1 mt-1">
                                {bucketPreview.map((bucket) => (
                                  <span key={`${bucket.assetCode}_${bucket.pmTypeLabel}`} className="px-1.5 py-0.5 bg-orange-200 rounded text-orange-900">
                                    {bucket.assetCode} ({bucket.pmTypeLabel}){' -> '}{bucket.workOrderIds.slice(0, 2).map((id) => getWorkOrderLabel(id)).join(', ')}
                                    {bucket.workOrderIds.length > 2 ? ` +อีก ${bucket.workOrderIds.length - 2}` : ''}
                                  </span>
                                ))}
                                {extraBuckets > 0 && <span className="px-1.5 py-0.5 bg-orange-100 rounded text-orange-800">+อีก {extraBuckets} คู่</span>}
                              </div>
                            </div>
                          )}
                          <div>
                            <span className="font-semibold">รหัสทรัพย์สินที่ซ้ำ ({duplicateAssets.length}):</span>{' '}
                            <span className="break-words">
                              {duplicateAssetPreview.join(', ')}
                              {extraDuplicateAssets > 0 ? ` และอีก ${extraDuplicateAssets} รายการ` : ''}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Link href={`/work-orders/${wo.id}`} className="block w-full text-center btn-app-primary px-4 py-2 rounded-lg hover:shadow-md font-medium text-sm transition-all">
                      ดูรายละเอียด
                    </Link>
                    {userRole === 'ADMIN' && (
                      <button
                        type="button"
                        onClick={() => setDeleteTargetId(wo.id)}
                        className="block w-full text-center px-4 py-2 rounded-lg border border-red-300 text-red-700 hover:bg-red-50 font-medium text-sm transition-all"
                      >
                        ลบ
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block bg-app-card rounded-lg shadow-lg border border-app overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-app-section border-b border-app">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-app-muted uppercase">ใบงาน ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-app-muted uppercase">ชนิดงาน</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-app-muted uppercase">สถานที่</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-app-muted uppercase">วันนัดหมาย</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-app-muted uppercase">สถานะ</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-app-muted uppercase">รายการงาน</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-app-muted uppercase">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-app">
              {filteredWorkOrders.map((wo) => {
                  const doneCount = wo.jobItems.filter((j) => j.status === "DONE").length
                  const st = getWOStatus(wo.status)
                  const workOrderNumber = getWorkOrderDisplayNumber(wo)
                  const isLinkedDuplicate = Boolean(wo.duplicateOfId)
                  const hasChildrenDuplicates = (wo._count?.duplicates ?? 0) > 0
                  const isPotentialPmMonthly = Boolean(wo.isPotentialDuplicatePmMonthly)
                  const duplicateAssets = wo.potentialDuplicateAssetCodes ?? []
                  const duplicateAssetPreview = duplicateAssets.slice(0, 2)
                  const extraDuplicateAssets = Math.max(0, duplicateAssets.length - duplicateAssetPreview.length)
                  const conflictingWorkOrders = wo.conflictingWorkOrderIds ?? []
                  const conflictingPreview = conflictingWorkOrders.slice(0, 2)
                  const extraConflicting = Math.max(0, conflictingWorkOrders.length - conflictingPreview.length)
                  const conflictBuckets = wo.potentialDuplicateBuckets ?? []
                  const bucketPreview = conflictBuckets.slice(0, 1)
                  const extraBuckets = Math.max(0, conflictBuckets.length - bucketPreview.length)
                  return (
                    <tr key={wo.id} className="hover:bg-app-section/50 transition-colors">
                      <td className="px-6 py-4 font-mono text-xs text-app-muted">{workOrderNumber}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 flex-wrap">
                          {getJobTypeBadge(wo.jobType)}
                          {isLinkedDuplicate && (
                            <span className="px-2 py-1 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-800">
                              งานซ้ำยืนยันแล้ว
                            </span>
                          )}
                          {!isLinkedDuplicate && hasChildrenDuplicates && (
                            <span className="px-2 py-1 rounded-full text-[11px] font-semibold bg-purple-100 text-purple-800">
                              มีงานซ้ำต่อจากงานนี้
                            </span>
                          )}
                          {isPotentialPmMonthly && (
                            <span className="px-2 py-1 rounded-full text-[11px] font-semibold bg-orange-100 text-orange-800">
                              อาจซ้ำ PM เครื่องเดิม+ประเภทล้างเดียวกัน
                            </span>
                          )}
                        </div>
                        {isPotentialPmMonthly && (
                          <div className="mt-2 p-2 bg-orange-50/50 rounded border border-orange-100/50">
                            <div className="text-[11px] text-orange-700 font-bold mb-1">
                              ⚠️ ตรวจพบทรัพย์สินซ้ำในเดือนนี้
                            </div>
                            <div className="text-[10px] text-orange-800 leading-relaxed">
                              {bucketPreview.length > 0 && (
                                <div className="mb-1">
                                  <span className="font-semibold">คู่ที่ชน:</span>{' '}
                                  {bucketPreview.map((bucket) => (
                                    <span key={`${bucket.assetCode}_${bucket.pmTypeLabel}`}>
                                      {bucket.assetCode} ({bucket.pmTypeLabel}){' -> '}{bucket.workOrderIds.slice(0, 2).map((id) => getWorkOrderLabel(id)).join(', ')}
                                      {bucket.workOrderIds.length > 2 ? ` +อีก ${bucket.workOrderIds.length - 2}` : ''}
                                    </span>
                                  ))}
                                  {extraBuckets > 0 ? ` | +อีก ${extraBuckets} คู่` : ''}
                                </div>
                              )}
                              <div className="line-clamp-2" title={duplicateAssets.join(', ')}>
                                <span className="font-semibold text-orange-700">ทรัพย์สิน ({duplicateAssets.length}):</span> {duplicateAssetPreview.join(', ')}{extraDuplicateAssets > 0 ? ` และอีก ${extraDuplicateAssets}` : ''}
                              </div>
                            </div>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-app-heading">{wo.site.name}</div>
                        <div className="text-xs text-app-muted">{wo.site.client.name}</div>
                      </td>
                      <td className="px-6 py-4 text-app-body">{formatThaiDate(wo.scheduledDate, 'long')}</td>
                      <td className="px-6 py-4"><span className={`px-2 py-1 rounded-full text-xs font-semibold ${st.tailwind}`}>{st.label}</span></td>
                      <td className="px-6 py-4 text-app-body">
                        <div className="text-sm">{doneCount}/{wo.jobItems.length} เสร็จ</div>
                        {wo.jobItems.length > 0 && (
                          <div className="w-full bg-app-section rounded-full h-1.5 mt-1">
                            <div className="h-1.5 rounded-full transition-all" style={{ width: `${(doneCount / wo.jobItems.length) * 100}%`, backgroundColor: st.hex }} />
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <Link href={`/work-orders/${wo.id}`} className="text-sm font-medium hover:underline" style={{ color: '#C2A66A' }}>
                            ดูรายละเอียด
                          </Link>
                          {userRole === 'ADMIN' && (
                            <button
                              type="button"
                              onClick={() => setDeleteTargetId(wo.id)}
                              className="text-sm font-medium text-red-600 hover:underline"
                            >
                              ลบ
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
            </tbody>
          </table>
          {filteredWorkOrders.length === 0 && (
              <div className="py-8">
                <EmptyState
                  icon="📋"
                  title={search || statusFilter !== 'ALL' || duplicateFilter !== 'ALL' || selectedSiteId
                    ? "ไม่พบข้อมูลที่ตรงกับเงื่อนไข"
                    : userRole === 'ADMIN' && selectedSiteId
                      ? "ไม่พบใบสั่งงานในสถานที่ที่เลือก"
                      : "ยังไม่มีใบสั่งงาน"}
                  description={search || statusFilter !== 'ALL' || duplicateFilter !== 'ALL' || selectedSiteId
                    ? "ลองเปลี่ยนคำค้นหาหรือตัวกรอง"
                    : userRole === 'ADMIN'
                      ? "เริ่มต้นโดยการสร้างใบสั่งงานใหม่"
                      : "ยังไม่มีใบสั่งงานในระบบ"}
                  actionLabel={userRole === 'ADMIN' && !search && statusFilter === 'ALL' && duplicateFilter === 'ALL' && !selectedSiteId ? "+ สร้างใบสั่งงานใหม่" : undefined}
                  actionHref={userRole === 'ADMIN' && !search && statusFilter === 'ALL' && duplicateFilter === 'ALL' && !selectedSiteId ? "/work-orders/new" : undefined}
                />
              </div>
            )}
        </div>
        </>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            itemsPerPage={itemsPerPage}
          />
        )}
      </div>

      <ConfirmDialog
        isOpen={Boolean(deleteTargetId)}
        title="ลบใบสั่งงาน"
        message={`คุณแน่ใจหรือไม่ว่าต้องการลบใบสั่งงาน ${deleteTargetId ? getWorkOrderLabel(deleteTargetId) : ''}? การกระทำนี้ไม่สามารถยกเลิกได้`}
        confirmText="ลบ"
        cancelText="ยกเลิก"
        confirmColor="red"
        onConfirm={() => deleteTargetId && doDeleteWorkOrder(deleteTargetId, false)}
        onCancel={() => setDeleteTargetId(null)}
        isLoading={isDeleting}
      />

      <ConfirmDialog
        isOpen={Boolean(forceDeleteTargetId)}
        title="ยืนยันการลบงานที่เสร็จสิ้นแล้ว"
        message={`ใบสั่งงาน ${forceDeleteTargetId ? getWorkOrderLabel(forceDeleteTargetId) : ''} มีรายการที่เสร็จสิ้นแล้ว ต้องการลบต่อหรือไม่?`}
        confirmText="ยืนยันลบ"
        cancelText="ยกเลิก"
        confirmColor="red"
        onConfirm={() => forceDeleteTargetId && doDeleteWorkOrder(forceDeleteTargetId, true)}
        onCancel={() => setForceDeleteTargetId(null)}
        isLoading={isDeleting}
      />
    </div>
  )
}
