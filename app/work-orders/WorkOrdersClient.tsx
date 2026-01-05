'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import Pagination from '@/app/components/Pagination'

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
  }>
}

interface Props {
  userRole: 'ADMIN' | 'TECHNICIAN' | 'CLIENT'
  workOrders?: WorkOrder[]
  technicianJobItems?: JobItem[]
  allSites?: Site[] | null
  selectedSiteId?: string
  userSiteName?: string
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
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              📋 ประวัติการทำงานของฉัน
            </h1>
            <p className="text-gray-600">
              รายการงานทั้งหมดที่คุณเคยรับผิดชอบ ({technicianJobItems.length} รายการ)
            </p>
          </div>

          {technicianJobItems.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <div className="text-6xl mb-4">📭</div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">ยังไม่มีประวัติการทำงาน</h2>
              <p className="text-gray-600 mb-6">เมื่อคุณทำงานเสร็จแล้ว ประวัติจะแสดงที่นี่</p>
              <Link
                href="/technician"
                className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-medium"
              >
                ไปหน้างาน
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {technicianJobItems.map((jobItem) => {
                const statusConfig = {
                  DONE: { bg: 'bg-green-100 text-green-800', text: 'เสร็จสิ้น', icon: '' },
                  IN_PROGRESS: { bg: 'bg-blue-100 text-blue-800', text: 'กำลังทำ', icon: '' },
                  ISSUE_FOUND: { bg: 'bg-yellow-100 text-yellow-800', text: 'พบปัญหา', icon: '' },
                  PENDING: { bg: 'bg-gray-100 text-gray-800', text: 'รอทำ', icon: '' },
                }[jobItem.status] || { bg: 'bg-gray-100 text-gray-800', text: jobItem.status, icon: '' }

                return (
                  <div key={jobItem.id} className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-2xl">
                            {jobItem.workOrder.jobType === 'PM' ? '🔧' : jobItem.workOrder.jobType === 'CM' ? '⚡' : '🆕'}
                          </span>
                          <h3 className="text-lg font-bold text-gray-900">
                            {jobItem.asset.brand} {jobItem.asset.model}
                          </h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${statusConfig.bg}`}>
                            {statusConfig.icon} {statusConfig.text}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600 space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">QR Code:</span>
                            <span className="font-mono">{jobItem.asset.qrCode}</span>
                          </div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span>{jobItem.asset.room.floor.building.site.name}</span>
                            <span className="text-gray-400">→</span>
                            <span>{jobItem.asset.room.floor.building.name}</span>
                            <span className="text-gray-400">→</span>
                            <span>{jobItem.asset.room.floor.name}</span>
                            <span className="text-gray-400">→</span>
                            <span>{jobItem.asset.room.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">งาน:</span>
                            <span>{jobItem.workOrder.jobType} - {jobItem.workOrder.site.name}</span>
                          </div>
                          {jobItem.startTime && (
                            <div className="flex items-center gap-2">
                              <span className="font-medium">วันที่ทำ:</span>
                              <span>{new Date(jobItem.startTime).toLocaleDateString('th-TH', { 
                                year: 'numeric', 
                                month: 'long', 
                                day: 'numeric' 
                              })}</span>
                            </div>
                          )}
                          {jobItem.startTime && jobItem.endTime && (
                            <div className="flex items-center gap-2">
                              <span className="font-medium">ใช้เวลา:</span>
                              <span>{Math.round((new Date(jobItem.endTime).getTime() - new Date(jobItem.startTime).getTime()) / 60000)} นาที</span>
                            </div>
                          )}
                        </div>
                        {jobItem.techNote && (
                          <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                            <p className="text-sm text-gray-700">
                              <span className="font-medium">บันทึก:</span> {jobItem.techNote}
                            </p>
                          </div>
                        )}
                        {jobItem.photos && jobItem.photos.length > 0 && (
                          <div className="mt-3">
                            <p className="text-xs text-gray-500 mb-2">รูปภาพ ({jobItem.photos.length} รูป)</p>
                            <div className="grid grid-cols-4 gap-2">
                              {jobItem.photos.slice(0, 4).map((photo) => (
                                <img
                                  key={photo.id}
                                  src={photo.url}
                                  alt={photo.type}
                                  className="w-full h-20 object-cover rounded border border-gray-200"
                                />
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      <Link
                        href={`/technician/job-item/${jobItem.id}`}
                        className="ml-4 text-blue-600 hover:text-blue-800 hover:underline font-medium text-sm whitespace-nowrap"
                      >
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
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">
              {userRole === 'CLIENT' ? '📋 ประวัติงานทั้งหมด' : '📋 ใบสั่งงานทั้งหมด'}
            </h1>
            {userRole === 'CLIENT' && userSiteName && (
              <p className="text-gray-600 mt-1">สถานที่: {userSiteName}</p>
            )}
            {userRole === 'ADMIN' && (
              <p className="text-gray-600 mt-1">
                {selectedSiteId 
                  ? `กรองตามสถานที่: ${allSites?.find(s => s.id === selectedSiteId)?.name || 'ทั้งหมด'}`
                  : 'แสดงทั้งหมด'
                }
              </p>
            )}
          </div>
          {userRole === 'ADMIN' && (
            <Link
              href="/work-orders/new"
              className="w-full sm:w-auto bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-medium text-sm sm:text-base text-center"
            >
              + สร้างใบสั่งงานใหม่
            </Link>
          )}
        </div>

        {/* Search & Filters */}
        <div className="mb-6 bg-white rounded-lg shadow-sm border border-gray-200 p-4 space-y-4">
          {/* Search */}
          <div>
            <input
              type="text"
              placeholder="ค้นหาตาม ID, ชนิดงาน, สถานที่..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Site Filter (ADMIN only) */}
            {userRole === 'ADMIN' && allSites && allSites.length > 0 && (
              <div className="flex-1">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  กรองตามสถานที่:
                </label>
                <select
                  value={filterSiteId}
                  onChange={(e) => handleSiteFilterChange(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white text-gray-900"
                >
                  <option value="">ทั้งหมด</option>
                  {allSites.map((site) => (
                    <option key={site.id} value={site.id}>
                      {site.name} ({site.client.name})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Status Filter */}
            <div className="sm:w-48">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                กรองตามสถานะ:
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="ALL">ทุกสถานะ</option>
                <option value="OPEN">เปิด</option>
                <option value="IN_PROGRESS">กำลังทำ</option>
                <option value="COMPLETED">เสร็จสิ้น</option>
                <option value="CANCELLED">ยกเลิก</option>
              </select>
            </div>
          </div>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden space-y-3">
          {workOrders
            .filter((wo) => {
              const searchLower = search.toLowerCase()
              const matchesSearch = 
                !search ||
                wo.id.toLowerCase().includes(searchLower) ||
                wo.jobType.toLowerCase().includes(searchLower) ||
                wo.site.name.toLowerCase().includes(searchLower) ||
                wo.site.client.name.toLowerCase().includes(searchLower)
              const matchesStatus = statusFilter === 'ALL' || wo.status === statusFilter
              return matchesSearch && matchesStatus
            })
            .map((wo) => {
              const doneCount = wo.jobItems.filter((j) => j.status === "DONE").length;
              const statusColors = {
                COMPLETED: "bg-green-100 text-green-800",
                IN_PROGRESS: "bg-blue-100 text-blue-800",
                CANCELLED: "bg-red-100 text-red-800",
                OPEN: "bg-gray-100 text-gray-800",
              }
              return (
                <div key={wo.id} className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <div className="font-mono text-xs text-gray-600 mb-1">
                        {wo.id.slice(0, 8)}...
                      </div>
                      <div className="font-bold text-gray-900 text-base mb-2">
                        {wo.jobType}
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${statusColors[wo.status as keyof typeof statusColors] || statusColors.OPEN}`}>
                      {wo.status}
                    </span>
                  </div>

                  <div className="space-y-2 mb-3 pb-3 border-b border-gray-100">
                    <div>
                      <div className="text-xs text-gray-500 mb-1">สถานที่</div>
                      <div className="text-sm text-gray-900 font-medium">{wo.site.name}</div>
                      <div className="text-xs text-gray-500">{wo.site.client.name}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 mb-1">วันนัดหมาย</div>
                      <div className="text-sm text-gray-900">
                        {new Date(wo.scheduledDate).toLocaleDateString("th-TH", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 mb-1">รายการงาน</div>
                      <div className="text-sm text-gray-900 mb-1">
                        {doneCount}/{wo.jobItems.length} เสร็จ
                      </div>
                      {wo.jobItems.length > 0 && (
                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                          <div
                            className="bg-blue-600 h-1.5 rounded-full"
                            style={{
                              width: `${(doneCount / wo.jobItems.length) * 100}%`,
                            }}
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  <Link
                    href={`/work-orders/${wo.id}`}
                    className="block w-full text-center bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 font-medium text-sm transition-colors"
                  >
                    ดูรายละเอียด
                  </Link>
                </div>
              );
            })}
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  ใบงาน ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  ชนิดงาน
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  สถานที่
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  วันนัดหมาย
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  สถานะ
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  รายการงาน
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  จัดการ
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
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
                const doneCount = wo.jobItems.filter((j) => j.status === "DONE").length;
                return (
                  <tr key={wo.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-mono text-xs text-gray-600">
                      {wo.id.slice(0, 8)}...
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-medium text-gray-900">{wo.jobType}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-gray-900">{wo.site.name}</div>
                      <div className="text-xs text-gray-500">{wo.site.client.name}</div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {new Date(wo.scheduledDate).toLocaleDateString("th-TH", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          wo.status === "COMPLETED"
                            ? "bg-green-100 text-green-800"
                            : wo.status === "IN_PROGRESS"
                            ? "bg-blue-100 text-blue-800"
                            : wo.status === "CANCELLED"
                            ? "bg-red-100 text-red-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {wo.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      <div className="text-sm">
                        {doneCount}/{wo.jobItems.length} เสร็จ
                      </div>
                      {wo.jobItems.length > 0 && (
                        <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                          <div
                            className="bg-blue-600 h-1.5 rounded-full"
                            style={{
                              width: `${(doneCount / wo.jobItems.length) * 100}%`,
                            }}
                          />
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <Link
                        href={`/work-orders/${wo.id}`}
                        className="text-blue-600 hover:underline text-sm font-medium"
                      >
                        ดูรายละเอียด
                      </Link>
                    </td>
                  </tr>
                );
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
            <div className="text-center py-12 text-gray-500">
              {search || statusFilter !== 'ALL' || selectedSiteId
                ? 'ไม่พบข้อมูลที่ตรงกับเงื่อนไข'
                : userRole === 'ADMIN' && selectedSiteId 
                ? 'ไม่พบใบสั่งงานในสถานที่ที่เลือก'
                : 'ยังไม่มีใบสั่งงาน'
              }
              {userRole === 'ADMIN' && (
                <Link href="/work-orders/new" className="text-blue-600 hover:underline ml-1">
                  สร้างใหม่
                </Link>
              )}
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
