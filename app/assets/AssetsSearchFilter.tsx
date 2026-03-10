'use client'

import { useState } from 'react'

interface Props {
  onSearchChange: (search: string) => void
  onStatusFilterChange: (status: string) => void
  onTypeFilterChange: (type: string) => void
  onSiteFilterChange: (site: string) => void
  searchValue: string
  statusFilter: string
  typeFilter: string
  siteFilter: string
  sites: string[]
}

export default function AssetsSearchFilter({
  onSearchChange,
  onStatusFilterChange,
  onTypeFilterChange,
  onSiteFilterChange,
  searchValue,
  statusFilter,
  typeFilter,
  siteFilter,
  sites
}: Props) {
  return (
    <div className="mb-6 flex flex-col sm:flex-row gap-4">
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
          placeholder="ค้นหาตาม QR Code, ยี่ห้อ, รุ่น, Serial No., สถานที่..."
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full px-4 py-2 border border-app rounded-lg bg-app-card text-app-body focus:ring-2 focus:ring-[var(--app-btn-primary)] focus:border-[var(--app-btn-primary)] transition-all"
        />
      </div>

      {/* Type Filter */}
      <div className="sm:w-48">
        <select
          value={typeFilter}
          onChange={(e) => onTypeFilterChange(e.target.value)}
          className="w-full px-4 py-2 border border-app rounded-lg bg-app-card text-app-body focus:ring-2 focus:ring-[var(--app-btn-primary)] focus:border-[var(--app-btn-primary)] transition-all"
        >
          <option value="ALL">ทุกประเภท (Type)</option>
          <option value="AIR_CONDITIONER">เครื่องปรับอากาศ (รวมทั้งหมด)</option>
          <option value="SPLIT_TYPE">แอร์แยกส่วน (Split Type)</option>
          <option value="FCU">FCU</option>
          <option value="AHU">AHU</option>
          <option value="VRF">VRF</option>
          <option value="EXHAUST">พัดลมดูดอากาศ (Exhaust)</option>
          <option value="OTHER">อื่นๆ</option>
        </select>
      </div>

      {/* Status Filter */}
      <div className="sm:w-48">
        <select
          value={statusFilter}
          onChange={(e) => onStatusFilterChange(e.target.value)}
          className="w-full px-4 py-2 border border-app rounded-lg bg-app-card text-app-body focus:ring-2 focus:ring-[var(--app-btn-primary)] focus:border-[var(--app-btn-primary)] transition-all"
        >
          <option value="ALL">ทุกสถานะ</option>
          <option value="ACTIVE">ใช้งาน</option>
          <option value="BROKEN">ชำรุด</option>
          <option value="RETIRED">เลิกใช้งาน</option>
        </select>
      </div>
    </div>
  )
}


