'use client'

import { useState, useMemo, useEffect } from 'react'
import Link from 'next/link'
import AssetsSearchFilter from './AssetsSearchFilter'
import EmptyState from '@/app/components/EmptyState'

interface Asset {
  id: string
  qrCode: string
  assetType: string
  machineType?: string | null
  brand: string | null
  model: string | null
  serialNo: string | null
  btu: number | null
  installDate: Date | null
  status: string
  createdAt?: Date
  room: {
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
  }
}

interface Props {
  assets: Asset[]
  userRole: string
}

export default function AssetsClient({ assets, userRole }: Props) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [typeFilter, setTypeFilter] = useState('ALL')
  const [baseUrl, setBaseUrl] = useState<string>('')

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setBaseUrl(window.location.origin)
    }
  }, [])

  // ตรวจสอบว่ามี asset ที่เป็น AIR_CONDITIONER หรือไม่
  const hasAirConditioner = assets.some(a => a.assetType === 'AIR_CONDITIONER')

  const filteredAssets = useMemo(() => {
    return assets.filter((asset) => {
      // Search filter
      const searchLower = search.toLowerCase()
      const matchesSearch =
        !search ||
        asset.qrCode.toLowerCase().includes(searchLower) ||
        asset.brand?.toLowerCase().includes(searchLower) ||
        asset.model?.toLowerCase().includes(searchLower) ||
        asset.serialNo?.toLowerCase().includes(searchLower) ||
        asset.room.name.toLowerCase().includes(searchLower) ||
        asset.room.floor.name.toLowerCase().includes(searchLower) ||
        asset.room.floor.building.name.toLowerCase().includes(searchLower) ||
        asset.room.floor.building.site.name.toLowerCase().includes(searchLower)

      // Status filter
      const matchesStatus = statusFilter === 'ALL' || asset.status === statusFilter

      // Type filter
      const matchesType = typeFilter === 'ALL' || (asset as any).machineType === typeFilter

      return matchesSearch && matchesStatus && matchesType
    })
  }, [assets, search, statusFilter, typeFilter])

  const getStatusBadge = (status: string) => {
    const configs = {
      ACTIVE: { bg: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400', text: 'ใช้งาน' },
      BROKEN: { bg: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400', text: 'ชำรุด' },
      RETIRED: { bg: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400', text: 'เลิกใช้งาน' },
    }
    const config = configs[status as keyof typeof configs] || configs.RETIRED
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${config.bg}`}>
        {config.text}
      </span>
    )
  }

  return (
    <>
      <AssetsSearchFilter
        searchValue={search}
        statusFilter={statusFilter}
        typeFilter={typeFilter}
        onSearchChange={setSearch}
        onStatusFilterChange={setStatusFilter}
        onTypeFilterChange={setTypeFilter}
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
          filteredAssets.map((asset) => {
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
                    <div className="font-bold text-app-heading text-base mb-1">
                      {asset.brand || '-'}
                    </div>
                    <div className="text-xs text-app-muted mb-1">
                      {asset.model || '-'} {asset.btu && `(${asset.btu.toLocaleString()} BTU)`}
                    </div>
                    {asset.serialNo && (
                      <div className="text-xs text-app-muted font-mono">
                        SN: {asset.serialNo}
                      </div>
                    )}
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
                    {asset.room.floor.building.site.name}
                  </div>
                  <div className="text-xs text-app-muted mt-1">
                    {asset.room.floor.building.name} → {asset.room.floor.name} → {asset.room.name}
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
              <th className="px-4 py-3 text-app-heading font-semibold">ยี่ห้อ / รุ่น</th>
              <th className="px-4 py-3 text-app-heading font-semibold">BTU</th>
              <th className="px-4 py-3 text-app-heading font-semibold">Serial No.</th>
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
                <td colSpan={hasAirConditioner ? 12 : 11} className="px-6 py-12">
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
              filteredAssets.map((asset) => {
                // แปลง assetType enum เป็นชื่อภาษาไทย
                const assetTypeLabels: Record<string, string> = {
                  'AIR_CONDITIONER': 'เครื่องปรับอากาศ',
                  'REFRIGERANT': 'น้ำยาแอร์',
                  'SPARE_PART': 'อะไหล่',
                  'TOOL': 'เครื่องมือ',
                  'OTHER': 'อื่นๆ',
                }
                const assetTypeName = assetTypeLabels[asset.assetType] || 'เครื่องปรับอากาศ'

                // กำหนดประเภททรัพย์สินจาก assetType และ brand/model
                const assetTypeDisplay = asset.brand && asset.model
                  ? `${assetTypeName} - ${asset.brand} ${asset.model}`.trim()
                  : asset.brand
                    ? `${assetTypeName} - ${asset.brand}`.trim()
                    : asset.model
                      ? `${assetTypeName} - ${asset.model}`.trim()
                      : assetTypeName

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
                    <td className="px-4 py-3 text-app-body">
                      {assetTypeDisplay}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-app-heading">
                        {asset.brand || '-'}
                      </div>
                      <div className="text-xs text-app-muted">
                        {asset.model || '-'}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-app-body">
                      {asset.btu ? `${asset.btu.toLocaleString()} BTU` : '-'}
                    </td>
                    <td className="px-4 py-3 text-app-body font-mono text-xs">
                      {asset.serialNo || '-'}
                    </td>
                    <td className="px-4 py-3 text-app-body">
                      {asset.room.floor.building.name}
                    </td>
                    <td className="px-4 py-3 text-app-body">
                      {asset.room.floor.name}
                    </td>
                    <td className="px-4 py-3 text-app-body">
                      {asset.room.name}
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

      {filteredAssets.length > 0 && (
        <div className="mt-4 text-sm text-gray-600">
          แสดง {filteredAssets.length} จาก {assets.length} รายการ
        </div>
      )}
    </>
  )
}
