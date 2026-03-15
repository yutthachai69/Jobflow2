'use client'

import { useState, useMemo, useEffect } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import AssetsSearchFilter from './AssetsSearchFilter'
import EmptyState from '@/app/components/EmptyState'
import Pagination from '@/app/components/Pagination'

const ITEMS_PER_PAGE = 20

interface Asset {
  id: string
  qrCode: string
  assetType: string
  machineType?: string | null
  btu: number | null
  installDate: Date | null
  status: string
  createdAt?: Date
  room?: {
    name: string
    floor: {
      name: string
      building: {
        name: string
        site: {
          name: string
          client?: {
            name: string
          }
        }
      }
    }
  } | null
}

interface Props {
  assets: Asset[]
  userRole: string
  defaultSiteName: string | null
}

export default function AssetsClient({ assets, userRole, defaultSiteName }: Props) {
  const searchParams = useSearchParams()

  const [search, setSearch] = useState('')
  const [siteFilter, setSiteFilter] = useState(searchParams.get('site') || 'ALL')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [typeFilter, setTypeFilter] = useState(searchParams.get('type') || 'ALL')
  const [currentPage, setCurrentPage] = useState(1)
  const [baseUrl, setBaseUrl] = useState<string>('')

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setBaseUrl(window.location.origin)
    }
  }, [])

  // ตรวจสอบว่ามี asset ที่เป็น AIR_CONDITIONER หรือไม่
  const hasAirConditioner = assets.some(a => a.assetType === 'AIR_CONDITIONER')

  // ดึงรายการ Site (สถานที่) ทั้งหมดที่ไม่ซ้ำกัน
  const availableSites = useMemo(() => {
    const sites = new Set<string>()
    assets.forEach(asset => {
      const siteName = asset.room?.floor?.building?.site?.name
      if (siteName) sites.add(siteName)
    })
    return Array.from(sites).sort()
  }, [assets])

  // Reset page when filters change
  const handleSearchChange = (v: string) => { setSearch(v); setCurrentPage(1) }
  const handleSiteChange = (v: string) => { setSiteFilter(v); setCurrentPage(1) }
  const handleStatusChange = (v: string) => { setStatusFilter(v); setCurrentPage(1) }
  const handleTypeChange = (v: string) => { setTypeFilter(v); setCurrentPage(1) }

  const filteredAssets = useMemo(() => {
    const result = assets.filter((asset) => {
      // Search filter
      const searchLower = search.toLowerCase()
      const room = asset.room
      const siteName = room?.floor?.building?.site?.name ?? ''
      const matchesSearch =
        !search ||
        asset.qrCode.toLowerCase().includes(searchLower) ||
        (room?.name?.toLowerCase().includes(searchLower)) ||
        (room?.floor?.name?.toLowerCase().includes(searchLower)) ||
        (room?.floor?.building?.name?.toLowerCase().includes(searchLower)) ||
        (siteName?.toLowerCase().includes(searchLower))

      // Status filter
      const matchesStatus = statusFilter === 'ALL' || asset.status === statusFilter

      // Type filter
      let matchesType = false
      if (typeFilter === 'ALL') {
        matchesType = true
      } else if (['AIR_CONDITIONER', 'EXHAUST', 'OTHER'].includes(typeFilter)) {
        matchesType = asset.assetType === typeFilter
      } else {
        matchesType = (asset as any).machineType === typeFilter
      }

      // Site filter (ถ้าไม่มี site จะแสดงเฉพาะเมื่อเลือก "ทุกสถานที่")
      const matchesSite = siteFilter === 'ALL' || siteName === siteFilter

      return matchesSearch && matchesStatus && matchesType && matchesSite
    })

    // Sort by type (AIR_CONDITIONER first) and then naturally by qrCode
    return result.sort((a, b) => {
      const typeOrder: Record<string, number> = {
        'AIR_CONDITIONER': 1,
        'EXHAUST': 2,
        'OTHER': 3,
      }
      const orderA = typeOrder[a.assetType] || 99
      const orderB = typeOrder[b.assetType] || 99
      
      if (orderA !== orderB) {
        return orderA - orderB
      }
      
      return a.qrCode.localeCompare(b.qrCode, undefined, { numeric: true, sensitivity: 'base' })
    })
  }, [assets, search, statusFilter, typeFilter, siteFilter])

  const paginatedAssets = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE
    return filteredAssets.slice(start, start + ITEMS_PER_PAGE)
  }, [filteredAssets, currentPage])

  const getStatusBadge = (status: string) => {
    const configs = {
      ACTIVE: { style: 'background:linear-gradient(135deg,#059669,#047857);color:#fff;boxShadow:0 2px 8px rgba(5,150,105,0.35)', text: '✅ ใช้งาน' },
      BROKEN: { style: 'background:linear-gradient(135deg,#dc2626,#991b1b);color:#fff;boxShadow:0 2px 8px rgba(220,38,38,0.35)', text: '⚠️ ชำรุด' },
      RETIRED: { style: 'background:linear-gradient(135deg,#475569,#334155);color:#fff;boxShadow:0 2px 8px rgba(71,85,105,0.35)', text: '⏸️ เลิกใช้งาน' },
    }
    const config = configs[status as keyof typeof configs] || configs.RETIRED
    return (
      <span
        className="px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap"
        style={Object.fromEntries(config.style.split(';').map(s => { const [k, v] = s.split(':'); return [k, v] })) as React.CSSProperties}
      >
        {config.text}
      </span>
    )
  }

  const getMachineTypeBadge = (machineType: string | null | undefined) => {
    if (!machineType) return null
    const configs: Record<string, { style: string; label: string }> = {
      AHU: { style: 'background:rgba(37,99,235,0.15);color:#60a5fa;border:1px solid rgba(37,99,235,0.3)', label: '🌀 AHU' },
      FCU: { style: 'background:rgba(124,58,237,0.15);color:#a78bfa;border:1px solid rgba(124,58,237,0.3)', label: '💨 FCU' },
      VRF: { style: 'background:rgba(14,165,233,0.15);color:#38bdf8;border:1px solid rgba(14,165,233,0.3)', label: '🔄 VRF' },
      SPLIT_TYPE: { style: 'background:rgba(5,150,105,0.15);color:#34d399;border:1px solid rgba(5,150,105,0.3)', label: '❄️ Split' },
      EXHAUST: { style: 'background:rgba(217,119,6,0.15);color:#fbbf24;border:1px solid rgba(217,119,6,0.3)', label: '💨 Exhaust' },
    }
    const cfg = configs[machineType] || { style: 'background:rgba(71,85,105,0.15);color:#94a3b8;border:1px solid rgba(71,85,105,0.3)', label: `⚙️ ${machineType}` }
    return (
      <span
        className="px-2 py-0.5 rounded-lg text-xs font-semibold"
        style={Object.fromEntries(cfg.style.split(';').map(s => { const [k, v] = s.split(':'); return [k, v] })) as React.CSSProperties}
      >
        {cfg.label}
      </span>
    )
  }

  // คำนวณชื่อ Site ที่แสดงบน Header
  let displaySiteName = defaultSiteName
  if (siteFilter !== 'ALL') {
    displaySiteName = siteFilter
  } else if (availableSites.length === 1) {
    displaySiteName = availableSites[0]
  }

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-app-heading mb-1 select-none">
            📋 {displaySiteName ? `รายการทรัพย์สิน: ${displaySiteName}` : 'ทรัพย์สินและอุปกรณ์'} ({filteredAssets.length})
          </h1>
          {displaySiteName && filteredAssets.length > 0 && (
            <p className="text-sm text-app-muted">จำนวนทั้งหมด {filteredAssets.length} รายการ (จากทั้งหมด {assets.length})</p>
          )}
          {filteredAssets.length === 0 && userRole === 'CLIENT' && (
            <p className="text-sm text-app-muted">ยังไม่มีทรัพย์สินในระบบ</p>
          )}
        </div>
        {userRole === 'ADMIN' && (
          <Link
            href="/assets/new"
            className="w-full sm:w-auto btn-app-primary px-4 py-2 rounded-lg hover:shadow-md font-medium text-sm sm:text-base text-center transition-all"
          >
            + เพิ่มทรัพย์สินใหม่
          </Link>
        )}
      </div>

      <AssetsSearchFilter
        searchValue={search}
        siteFilter={siteFilter}
        statusFilter={statusFilter}
        typeFilter={typeFilter}
        sites={availableSites}
        onSearchChange={handleSearchChange}
        onSiteFilterChange={handleSiteChange}
        onStatusFilterChange={handleStatusChange}
        onTypeFilterChange={handleTypeChange}
      />

      {/* Mobile Card View */}
      <div className="md:hidden space-y-3">
        {filteredAssets.length === 0 ? (
          <EmptyState
            icon="🔍"
            title={search || statusFilter !== 'ALL' || typeFilter !== 'ALL' ? "ไม่พบข้อมูลที่ค้นหา" : "ยังไม่มีข้อมูลทรัพย์สิน"}
            description={search || statusFilter !== 'ALL' || typeFilter !== 'ALL' ? "ลองเปลี่ยนคำค้นหาหรือตัวกรอง" : userRole === 'ADMIN' ? "เริ่มต้นโดยการเพิ่มทรัพย์สินใหม่" : "ยังไม่มีทรัพย์สินในระบบ"}
            actionLabel={userRole === 'ADMIN' && !search && statusFilter === 'ALL' && typeFilter === 'ALL' ? "+ เพิ่มทรัพย์สินใหม่" : undefined}
            actionHref={userRole === 'ADMIN' && !search && statusFilter === 'ALL' && typeFilter === 'ALL' ? "/assets/new" : undefined}
          />
        ) : (
          paginatedAssets.map((asset) => {
            const qrCodeUrl = baseUrl
              ? `${baseUrl}/scan/${encodeURIComponent(asset.qrCode)}`
              : `/scan/${encodeURIComponent(asset.qrCode)}`
            const qrCodeImageUrl = qrCodeUrl ? `/api/qrcode?text=${encodeURIComponent(qrCodeUrl)}` : ''

            return (
              <div key={asset.id} className="bg-app-card rounded-lg border border-app p-4 shadow-sm">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <div className="font-mono font-medium text-[var(--app-btn-primary)] text-sm mb-1">
                      {asset.qrCode}
                    </div>
                    <div className="text-xs text-app-muted mb-1">
                      {asset.btu ? `${asset.btu.toLocaleString()} BTU` : ''}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    {getStatusBadge(asset.status)}
                    {asset.assetType === 'AIR_CONDITIONER' && qrCodeImageUrl ? (
                      <div className="flex flex-col items-center gap-1">
                        <Link
                          href={qrCodeUrl}
                          className="hover:opacity-80 transition-opacity"
                          title={`QR Code: ${asset.qrCode}`}
                        >
                          <img
                            src={qrCodeImageUrl}
                            alt={`QR Code for ${asset.qrCode}`}
                            className="w-12 h-12 border border-app rounded p-0.5 bg-white"
                          />
                        </Link>
                        <span className="text-xs font-mono text-app-muted">{asset.qrCode}</span>
                      </div>
                    ) : asset.assetType === 'AIR_CONDITIONER' ? (
                      <span className="text-app-muted text-xs">กำลังโหลด...</span>
                    ) : null}
                  </div>
                </div>

                <div className="mb-3 pb-3 border-b border-app">
                  <div className="text-xs text-app-muted mb-1">สถานที่ติดตั้ง</div>
                  <div className="text-sm text-app-heading font-medium">
                    {asset.room?.floor?.building?.site?.name ?? '-'}
                  </div>
                  <div className="text-xs text-app-muted mt-1">
                    {asset.room?.floor?.building?.name ?? '-'} → {asset.room?.floor?.name ?? '-'} → {asset.room?.name ?? '-'}
                  </div>
                  {asset.installDate && (
                    <div className="text-xs text-app-muted mt-1">
                      ติดตั้ง: {new Date(asset.installDate).toLocaleDateString('th-TH', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit'
                      })}
                    </div>
                  )}
                </div>

                <Link
                  href={`/assets/${asset.id}`}
                  className="block w-full text-center btn-app-primary px-4 py-2 rounded-md hover:shadow-md font-medium text-sm transition-all"
                >
                  {userRole === 'CLIENT' ? 'ดูสถานะ' : 'ดูรายละเอียด'}
                </Link>
              </div>
            )
          })
        )}
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto border rounded-lg shadow-sm bg-app-card">
        <table className="w-full text-left text-sm text-app-body">
          <thead className="bg-app-section uppercase font-medium border-b border-app">
            <tr>
              <th className="px-4 py-3 text-app-heading font-semibold">รหัสทรัพย์สิน</th>
              {hasAirConditioner && (
                <th className="px-4 py-3 text-app-heading font-semibold">QR Code</th>
              )}
              <th className="px-4 py-3 text-app-heading font-semibold">ประเภททรัพย์สิน</th>
              <th className="px-4 py-3 text-app-heading font-semibold">BTU</th>
              <th className="px-4 py-3 text-app-heading font-semibold">อาคาร</th>
              <th className="px-4 py-3 text-app-heading font-semibold">ชั้น</th>
              <th className="px-4 py-3 text-app-heading font-semibold">ห้อง (แผนก)</th>
              <th className="px-4 py-3 text-app-heading font-semibold">วันที่ติดตั้ง</th>
              <th className="px-4 py-3 text-app-heading font-semibold">สถานะ</th>
              <th className="px-4 py-3 text-app-heading font-semibold">จัดการ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-app-border bg-app-card">
            {filteredAssets.length === 0 ? (
              <tr>
                <td colSpan={hasAirConditioner ? 10 : 9} className="px-6 py-12">
                  <EmptyState
                    icon="🔍"
                    title={search || statusFilter !== 'ALL' || typeFilter !== 'ALL' ? "ไม่พบข้อมูลที่ค้นหา" : "ยังไม่มีข้อมูลทรัพย์สิน"}
                    description={search || statusFilter !== 'ALL' || typeFilter !== 'ALL' ? "ลองเปลี่ยนคำค้นหาหรือตัวกรอง" : userRole === 'ADMIN' ? "เริ่มต้นโดยการเพิ่มทรัพย์สินใหม่" : "ยังไม่มีทรัพย์สินในระบบ"}
                    actionLabel={userRole === 'ADMIN' && !search && statusFilter === 'ALL' && typeFilter === 'ALL' ? "+ เพิ่มทรัพย์สินใหม่" : undefined}
                    actionHref={userRole === 'ADMIN' && !search && statusFilter === 'ALL' && typeFilter === 'ALL' ? "/assets/new" : undefined}
                  />
                </td>
              </tr>
            ) : (
              paginatedAssets.map((asset) => {
                // แปลง assetType enum เป็นชื่อภาษาไทย
                const assetTypeLabels: Record<string, string> = {
                  'AIR_CONDITIONER': 'เครื่องปรับอากาศ',
                  'EXHAUST': 'พัดลมดูดอากาศ (Exhaust)',
                  'OTHER': 'อื่นๆ',
                }
                const assetTypeName = assetTypeLabels[asset.assetType] || 'อื่นๆ'

                // กำหนดประเภททรัพย์สินจาก assetType และ brand/model
                // Format วันที่ติดตั้ง
                const installDateFormatted = asset.installDate
                  ? new Date(asset.installDate).toLocaleDateString('th-TH', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit'
                  })
                  : '-'

                // QR Code URL ที่จะพาไปหน้า detail
                const qrCodeUrl = baseUrl
                  ? `${baseUrl}/scan/${encodeURIComponent(asset.qrCode)}`
                  : `/scan/${encodeURIComponent(asset.qrCode)}`
                const qrCodeImageUrl = qrCodeUrl ? `/api/qrcode?text=${encodeURIComponent(qrCodeUrl)}` : ''

                return (
                  <tr key={asset.id} className="hover:bg-app-section transition-colors">
                    <td className="px-4 py-3 font-mono font-medium text-app-heading">
                      {asset.qrCode}
                    </td>
                    {hasAirConditioner && (
                      <td className="px-4 py-3">
                        {asset.assetType === 'AIR_CONDITIONER' ? (
                          qrCodeImageUrl ? (
                            <div className="flex flex-col items-center gap-1">
                              <Link
                                href={qrCodeUrl}
                                className="inline-block hover:opacity-80 transition-opacity"
                                title={`คลิกเพื่อดูรายละเอียด: ${asset.qrCode}`}
                              >
                                <img
                                  src={qrCodeImageUrl}
                                  alt={`QR Code for ${asset.qrCode}`}
                                  className="w-16 h-16 border border-app rounded p-1 bg-white"
                                />
                              </Link>
                              <span className="text-xs font-mono text-app-muted">{asset.qrCode}</span>
                            </div>
                          ) : (
                            <span className="text-app-muted text-xs">กำลังโหลด...</span>
                          )
                        ) : (
                          <span className="text-app-muted text-xs">-</span>
                        )}
                      </td>
                    )}
                    <td className="px-4 py-3">
                      <div className="text-app-body text-sm">{assetTypeName}</div>
                      {getMachineTypeBadge((asset as any).machineType) && (
                        <div className="mt-1">{getMachineTypeBadge((asset as any).machineType)}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-app-body">
                      {asset.btu ? `${asset.btu.toLocaleString()} BTU` : '-'}
                    </td>
                    <td className="px-4 py-3 text-app-body">
                      {asset.room?.floor?.building?.name ?? '-'}
                    </td>
                    <td className="px-4 py-3 text-app-body">
                      {asset.room?.floor?.name ?? '-'}
                    </td>
                    <td className="px-4 py-3 text-app-body">
                      {asset.room?.name ?? '-'}
                    </td>
                    <td className="px-4 py-3 text-app-body text-xs">
                      {installDateFormatted}
                    </td>
                    <td className="px-4 py-3">
                      {getStatusBadge(asset.status)}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/assets/${asset.id}`}
                        className="text-[var(--app-btn-primary)] hover:text-[var(--app-btn-primary-hover)] hover:underline font-medium text-sm transition-colors"
                      >
                        {userRole === 'CLIENT' ? 'ดูสถานะ' : 'ดูรายละเอียด'}
                      </Link>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination + summary */}
      {filteredAssets.length > 0 && (
        <>
          <div className="mt-4 text-sm text-app-muted">
            แสดง {Math.min((currentPage - 1) * ITEMS_PER_PAGE + 1, filteredAssets.length)}–{Math.min(currentPage * ITEMS_PER_PAGE, filteredAssets.length)} จาก {filteredAssets.length} รายการ
            {filteredAssets.length < assets.length && ` (กรองจากทั้งหมด ${assets.length} รายการ)`}
          </div>
          {Math.ceil(filteredAssets.length / ITEMS_PER_PAGE) > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={Math.ceil(filteredAssets.length / ITEMS_PER_PAGE)}
              totalItems={filteredAssets.length}
              itemsPerPage={ITEMS_PER_PAGE}
              onPageChange={setCurrentPage}
            />
          )}
        </>
      )}
    </>
  )
}
