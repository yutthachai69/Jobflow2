'use client'

import { useState } from 'react'

interface Props {
  onSearchChange: (search: string) => void
  onStatusFilterChange: (status: string) => void
  searchValue: string
  statusFilter: string
}

export default function AssetsSearchFilter({ 
  onSearchChange, 
  onStatusFilterChange, 
  searchValue, 
  statusFilter 
}: Props) {
  return (
    <div className="mb-6 flex flex-col sm:flex-row gap-4">
      {/* Search Input */}
      <div className="flex-1">
        <input
          type="text"
          placeholder="ค้นหาตาม QR Code, ยี่ห้อ, รุ่น..."
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {/* Status Filter */}
      <div className="sm:w-48">
        <select
          value={statusFilter}
          onChange={(e) => onStatusFilterChange(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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

