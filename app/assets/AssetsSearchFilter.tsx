'use client'

import { useState } from 'react'

interface Props {
  onSearchChange: (search: string) => void
  onStatusFilterChange: (status: string) => void
  onAssetTypeFilterChange: (type: string) => void
  onMachineTypeFilterChange: (type: string) => void
  onSiteFilterChange: (site: string) => void
  onClearAll: () => void
  searchValue: string
  statusFilter: string
  assetTypeFilter: string
  machineTypeFilter: string
  siteFilter: string
  sites: string[]
}

export default function AssetsSearchFilter({
  onSearchChange,
  onStatusFilterChange,
  onAssetTypeFilterChange,
  onMachineTypeFilterChange,
  onSiteFilterChange,
  onClearAll,
  searchValue,
  statusFilter,
  assetTypeFilter,
  machineTypeFilter,
  siteFilter,
  sites
}: Props) {
  const isFiltered = searchValue || assetTypeFilter !== 'ALL' || machineTypeFilter !== 'ALL' || statusFilter !== 'ALL' || siteFilter !== 'ALL'

  return (
    <div className="mb-6 flex flex-col gap-4">
      {/* Row 1: Site + Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Site Filter */}
        <div className="sm:w-48">
          <select
            value={siteFilter}
            onChange={(e) => onSiteFilterChange(e.target.value)}
            className="w-full px-4 py-2 border border-app rounded-lg bg-app-card text-app-body focus:ring-2 focus:ring-[var(--app-btn-primary)] focus:border-[var(--app-btn-primary)] transition-all"
          >
            <option value="ALL">ทุกสถานที่ (Site)</option>
            {sites.map(site => (
              <option key={site} value={site}>{site}</option>
            ))}
          </select>
        </div>

        {/* Search Input */}
        <div className="flex-1">
          <input
            type="text"
            placeholder="ค้นหาตาม QR Code, ห้อง, ชั้น, อาคาร..."
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full px-4 py-2 border border-app rounded-lg bg-app-card text-app-body focus:ring-2 focus:ring-[var(--app-btn-primary)] focus:border-[var(--app-btn-primary)] transition-all"
          />
        </div>
      </div>

      {/* Row 2: Asset Type + Machine Type + Status + Clear */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Asset Type Filter */}
        <div className="sm:w-48">
          <select
            value={assetTypeFilter}
            onChange={(e) => {
              onAssetTypeFilterChange(e.target.value)
              if (e.target.value !== 'AIR_CONDITIONER') {
                onMachineTypeFilterChange('ALL')
              }
            }}
            className="w-full px-4 py-2 border border-app rounded-lg bg-app-card text-app-body focus:ring-2 focus:ring-[var(--app-btn-primary)] focus:border-[var(--app-btn-primary)] transition-all"
          >
            <option value="ALL">ทุกประเภท (Asset)</option>
            <option value="AIR_CONDITIONER">เครื่องปรับอากาศ</option>
            <option value="EXHAUST_DUCT">พัดลมดูดอากาศ - ท่อ (ExD)</option>
            <option value="EXHAUST_FAN">พัดลมดูดอากาศ - พัดลม (ExF)</option>
            <option value="FRESH_AIR">พัดลมเฟรชแอร์ (FA)</option>
            <option value="REFRIGERANT">น้ำยาแอร์</option>
            <option value="SPARE_PART">อะไหล่</option>
            <option value="TOOL">เครื่องมือ</option>
          </select>
        </div>

        {/* Machine Type Filter (only for AC) */}
        {assetTypeFilter === 'AIR_CONDITIONER' && (
          <div className="sm:w-48">
            <select
              value={machineTypeFilter}
              onChange={(e) => onMachineTypeFilterChange(e.target.value)}
              className="w-full px-4 py-2 border border-app rounded-lg bg-app-card text-app-body focus:ring-2 focus:ring-[var(--app-btn-primary)] focus:border-[var(--app-btn-primary)] transition-all"
            >
              <option value="ALL">ทั้งหมด (Machine)</option>
              <option value="SPLIT_TYPE">Split Type (แอร์แยกส่วน)</option>
              <option value="FCU">FCU (อุปกรณ์เป่าลม)</option>
              <option value="AHU">AHU (ระบบลมเย็นกลาง)</option>
              <option value="VRF">VRF (ระบบ VRF)</option>
            </select>
          </div>
        )}

        {/* Status Filter */}
        <div className="sm:w-40">
          <select
            value={statusFilter}
            onChange={(e) => onStatusFilterChange(e.target.value)}
            className="w-full px-4 py-2 border border-app rounded-lg bg-app-card text-app-body focus:ring-2 focus:ring-[var(--app-btn-primary)] focus:border-[var(--app-btn-primary)] transition-all"
          >
            <option value="ALL">ทุกสถานะ</option>
            <option value="ACTIVE">✅ ใช้งาน</option>
            <option value="BROKEN">⚠️ ชำรุด</option>
            <option value="RETIRED">⏸️ เลิกใช้งาน</option>
          </select>
        </div>

        {/* Clear Button */}
        {isFiltered && (
          <button
            onClick={onClearAll}
            className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium text-sm transition-all whitespace-nowrap"
          >
            🗑️ เคลียร์ทั้งหมด
          </button>
        )}
      </div>
    </div>
  )
}


