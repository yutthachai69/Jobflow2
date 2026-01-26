'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import Pagination from '@/app/components/Pagination'
import EmptyState from '@/app/components/EmptyState'
import { getWOStatus, getJobStatus } from '@/lib/status-colors'
import { getWorkOrderDisplayNumber } from '@/lib/work-order-number'

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
  brand: string | null
  model: string | null
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
    asset: {
      id: string
      qrCode: string
    }
    technician: Technician | null
    photos: Array<{
      id: string
      type: string
      url: string
      createdAt: Date
    }>
  }>
}

interface Props {
  userRole: 'ADMIN' | 'TECHNICIAN' | 'CLIENT'
  workOrders?: WorkOrder[]
  technicianJobItems?: JobItem[]
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
        <div className="max-w-7xl mx-auto">
          <div className="mb-6">
            <h1 className="text-2xl md:text-3xl font-bold text-app-heading mb-2">📋 ประวัติการทำงานของฉัน</h1>
            <p className="text-app-muted">รายการงานทั้งหมดที่คุณเคยรับผิดชอบ ({technicianJobItems.length} รายการ)</p>
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
                          <h3 className="text-lg font-bold text-app-heading">{jobItem.asset.brand} {jobItem.asset.model}</h3>
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
      <div className="max-w-7xl mx-auto">
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
          </div>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden space-y-3">
          {workOrders
            .filter((wo) => {
              const searchLower = search.toLowerCase()
              const workOrderNumber = getWorkOrderDisplayNumber(wo)
              const matchesSearch = !search || 
                workOrderNumber.toLowerCase().includes(searchLower) ||
                wo.id.toLowerCase().includes(searchLower) || 
                wo.jobType.toLowerCase().includes(searchLower) || 
                wo.site.name.toLowerCase().includes(searchLower) || 
                wo.site.client.name.toLowerCase().includes(searchLower)
              const matchesStatus = statusFilter === 'ALL' || wo.status === statusFilter
              return matchesSearch && matchesStatus
            })
            .map((wo) => {
              const doneCount = wo.jobItems.filter((j) => j.status === "DONE").length
              const st = getWOStatus(wo.status)
              const workOrderNumber = getWorkOrderDisplayNumber(wo)
              return (
                <div key={wo.id} className="bg-app-card rounded-lg border border-app border-l-4 p-4 shadow-lg" style={{ borderLeftColor: st.hex }}>
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <div className="font-mono text-xs text-app-muted mb-1">เลขที่ {workOrderNumber}</div>
                      <div className="font-bold text-app-heading text-base mb-2">{wo.jobType}</div>
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
                      <div className="text-sm text-app-heading">{new Date(wo.scheduledDate).toLocaleDateString("th-TH", { year: "numeric", month: "long", day: "numeric" })}</div>
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
                  </div>
                  <Link href={`/work-orders/${wo.id}`} className="block w-full text-center btn-app-primary px-4 py-2 rounded-lg hover:shadow-md font-medium text-sm transition-all">
                    ดูรายละเอียด
                  </Link>
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
              {workOrders
                .filter((wo) => {
                  // Search filter
                  const searchLower = search.toLowerCase()
                  const matchesSearch = 
                    !search ||
                    wo.id.toLowerCase().includes(searchLower) ||
                    wo.jobType.toLowerCase().includes(searchLower) ||
                    wo.site.name.toLowerCase().includes(searchLower) ||
                    wo.site.client.name.toLowerCase().includes(searchLower)

                  // Status filter
                  const matchesStatus = statusFilter === 'ALL' || wo.status === statusFilter

                  return matchesSearch && matchesStatus
                })
                .map((wo) => {
                  const doneCount = wo.jobItems.filter((j) => j.status === "DONE").length
                  const st = getWOStatus(wo.status)
                  const workOrderNumber = getWorkOrderDisplayNumber(wo)
                  return (
                    <tr key={wo.id} className="hover:bg-app-section/50 transition-colors">
                      <td className="px-6 py-4 font-mono text-xs text-app-muted">{workOrderNumber}</td>
                      <td className="px-6 py-4"><span className="font-medium text-app-heading">{wo.jobType}</span></td>
                      <td className="px-6 py-4">
                        <div className="text-app-heading">{wo.site.name}</div>
                        <div className="text-xs text-app-muted">{wo.site.client.name}</div>
                      </td>
                      <td className="px-6 py-4 text-app-body">{new Date(wo.scheduledDate).toLocaleDateString("th-TH", { year: "numeric", month: "long", day: "numeric" })}</td>
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
                        <Link href={`/work-orders/${wo.id}`} className="text-sm font-medium hover:underline" style={{ color: '#C2A66A' }}>ดูรายละเอียด</Link>
                      </td>
                    </tr>
                  )
                })}
            </tbody>
          </table>
          {workOrders.filter((wo) => {
            const searchLower = search.toLowerCase()
            const matchesSearch = 
              !search ||
              wo.id.toLowerCase().includes(searchLower) ||
              wo.jobType.toLowerCase().includes(searchLower) ||
              wo.site.name.toLowerCase().includes(searchLower) ||
              wo.site.client.name.toLowerCase().includes(searchLower)
            const matchesStatus = statusFilter === 'ALL' || wo.status === statusFilter
            return matchesSearch && matchesStatus
          }).length === 0 && (
            <div className="py-8">
              <EmptyState
                icon="📋"
                title={search || statusFilter !== 'ALL' || selectedSiteId
                  ? "ไม่พบข้อมูลที่ตรงกับเงื่อนไข"
                  : userRole === 'ADMIN' && selectedSiteId 
                  ? "ไม่พบใบสั่งงานในสถานที่ที่เลือก"
                  : "ยังไม่มีใบสั่งงาน"}
                description={search || statusFilter !== 'ALL' || selectedSiteId
                  ? "ลองเปลี่ยนคำค้นหาหรือตัวกรอง"
                  : userRole === 'ADMIN' 
                  ? "เริ่มต้นโดยการสร้างใบสั่งงานใหม่"
                  : "ยังไม่มีใบสั่งงานในระบบ"}
                actionLabel={userRole === 'ADMIN' && !search && statusFilter === 'ALL' && !selectedSiteId ? "+ สร้างใบสั่งงานใหม่" : undefined}
                actionHref={userRole === 'ADMIN' && !search && statusFilter === 'ALL' && !selectedSiteId ? "/work-orders/new" : undefined}
              />
            </div>
          )}
        </div>

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
    </div>
  )
}
