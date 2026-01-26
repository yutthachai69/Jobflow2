'use client'

import Link from 'next/link'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { updateAsset } from '@/app/actions/index'

interface Site {
  id: string
  name: string
  client: {
    name: string
  }
  buildings: Building[]
}

interface Building {
  id: string
  name: string
  floors: Floor[]
}

interface Floor {
  id: string
  name: string
  rooms: Room[]
}

interface Room {
  id: string
  name: string
}

interface Asset {
  id: string
  qrCode: string
  assetType: string
  brand: string | null
  model: string | null
  serialNo: string | null
  btu: number | null
  installDate: Date | null
  status: 'ACTIVE' | 'BROKEN' | 'RETIRED'
  room: {
    id: string
    name: string
    floor: {
      id: string
      name: string
      building: {
        id: string
        name: string
        site: {
          id: string
          name: string
        }
      }
    }
  }
}

interface Props {
  asset: Asset
  sites: Site[]
}

export default function EditAssetForm({ asset, sites }: Props) {
  const router = useRouter()
  const [selectedSiteId, setSelectedSiteId] = useState<string>(
    asset.room.floor.building.site.id
  )
  const [selectedBuildingId, setSelectedBuildingId] = useState<string>(
    asset.room.floor.building.id
  )
  const [selectedFloorId, setSelectedFloorId] = useState<string>(
    asset.room.floor.id
  )
  const [selectedRoomId, setSelectedRoomId] = useState<string>(asset.room.id)
  const [assetType, setAssetType] = useState<string>(asset.assetType || 'AIR_CONDITIONER')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const selectedSite = sites.find(s => s.id === selectedSiteId)
  const selectedBuilding = selectedSite?.buildings.find(b => b.id === selectedBuildingId)
  const selectedFloor = selectedBuilding?.floors.find(f => f.id === selectedFloorId)
  const availableRooms = selectedFloor?.rooms || []

  // Reset building when site changes
  const handleSiteChange = (siteId: string) => {
    setSelectedSiteId(siteId)
    setSelectedBuildingId('')
    setSelectedFloorId('')
    setSelectedRoomId('')
  }

  // Reset floor when building changes
  const handleBuildingChange = (buildingId: string) => {
    setSelectedBuildingId(buildingId)
    setSelectedFloorId('')
    setSelectedRoomId('')
  }

  // Reset room when floor changes
  const handleFloorChange = (floorId: string) => {
    setSelectedFloorId(floorId)
    setSelectedRoomId('')
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsSubmitting(true)
    const newErrors: Record<string, string> = {}

    const formData = new FormData(e.currentTarget)
    const serialNo = (formData.get('serialNo') as string)?.trim() || ''
    const assetTypeValue = (formData.get('assetType') as string) || assetType

    // Validation
    // QR Code/Serial Number เป็น required เฉพาะเครื่องปรับอากาศ
    if (assetTypeValue === 'AIR_CONDITIONER') {
      if (!serialNo) {
        newErrors.serialNo = 'กรุณากรอก Serial Number / QR Code'
      } else if (serialNo.length > 100) {
        newErrors.serialNo = 'Serial Number ต้องไม่เกิน 100 ตัวอักษร'
      }
    }

    if (!selectedRoomId) {
      newErrors.roomId = 'กรุณาเลือกห้อง'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      setIsSubmitting(false)
      const firstErrorField = document.querySelector('[data-error]')
      firstErrorField?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }

    setErrors({})

    try {
      const submitFormData = new FormData()
      submitFormData.append('assetId', asset.id)
      submitFormData.append('roomId', selectedRoomId)
      submitFormData.append('serialNo', serialNo)
      submitFormData.append('assetType', (formData.get('assetType') as string) || asset.assetType || 'AIR_CONDITIONER')
      submitFormData.append('brand', (formData.get('brand') as string) || '')
      submitFormData.append('model', (formData.get('model') as string) || '')
      submitFormData.append('btu', (formData.get('btu') as string) || '')
      submitFormData.append('installDate', (formData.get('installDate') as string) || '')
      submitFormData.append('status', (formData.get('status') as string) || 'ACTIVE')

      await updateAsset(submitFormData)
      router.push(`/assets/${asset.id}`)
      router.refresh()
    } catch (error: any) {
      setErrors({ submit: error.message || 'เกิดข้อผิดพลาดในการแก้ไขข้อมูลทรัพย์สิน' })
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-gray-100">
      <div className="space-y-6">
        {/* Asset Type */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            ประเภททรัพย์สิน <span className="text-red-500">*</span>
          </label>
          <select
            name="assetType"
            value={assetType}
            onChange={(e) => setAssetType(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white text-gray-900"
          >
            <option value="AIR_CONDITIONER">เครื่องปรับอากาศ</option>
            <option value="REFRIGERANT">น้ำยาแอร์</option>
            <option value="SPARE_PART">อะไหล่</option>
            <option value="TOOL">เครื่องมือ</option>
            <option value="OTHER">อื่นๆ</option>
          </select>
        </div>

        {/* Serial Number / QR Code */}
        {assetType === 'AIR_CONDITIONER' ? (
          <div data-error={errors.serialNo ? 'true' : undefined}>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Serial Number / QR Code <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="serialNo"
              defaultValue={asset.qrCode}
              className={`w-full border rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white text-gray-900 placeholder:text-gray-400 ${
                errors.serialNo ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-200'
              }`}
              placeholder="เช่น ABC123456"
            />
            {errors.serialNo && (
              <p className="mt-2 text-sm text-red-600">{errors.serialNo}</p>
            )}
            <p className="mt-2 text-xs text-gray-500">
              Serial Number จะถูกใช้เป็น QR Code สำหรับสแกนหาทรัพย์สิน
            </p>
          </div>
        ) : (
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              รหัสทรัพย์สิน
            </label>
            <input
              type="text"
              name="serialNo"
              defaultValue={asset.qrCode}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white text-gray-900 placeholder:text-gray-400"
              placeholder="เช่น REF-001, PART-001"
            />
            <p className="mt-2 text-xs text-gray-500">
              รหัสสำหรับระบุทรัพย์สิน (ไม่จำเป็นต้องมี QR Code)
            </p>
          </div>
        )}

        {/* Location Selection */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            สถานที่ติดตั้ง <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Site */}
            <div>
              <label className="block text-xs text-gray-600 mb-1">สาขา</label>
              <select
                value={selectedSiteId}
                onChange={(e) => handleSiteChange(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white text-gray-900"
              >
                <option value="">เลือกสาขา</option>
                {sites.map((site) => (
                  <option key={site.id} value={site.id}>
                    {site.name} ({site.client.name})
                  </option>
                ))}
              </select>
            </div>

            {/* Building */}
            <div>
              <label className="block text-xs text-gray-600 mb-1">อาคาร</label>
              <select
                value={selectedBuildingId}
                onChange={(e) => handleBuildingChange(e.target.value)}
                disabled={!selectedSiteId}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white text-gray-900 disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                <option value="">เลือกอาคาร</option>
                {selectedSite?.buildings.map((building) => (
                  <option key={building.id} value={building.id}>
                    {building.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Floor */}
            <div>
              <label className="block text-xs text-gray-600 mb-1">ชั้น</label>
              <select
                value={selectedFloorId}
                onChange={(e) => handleFloorChange(e.target.value)}
                disabled={!selectedBuildingId}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white text-gray-900 disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                <option value="">เลือกชั้น</option>
                {selectedBuilding?.floors.map((floor) => (
                  <option key={floor.id} value={floor.id}>
                    {floor.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Room */}
            <div data-error={errors.roomId ? 'true' : undefined}>
              <label className="block text-xs text-gray-600 mb-1">ห้อง</label>
              <select
                name="roomId"
                value={selectedRoomId}
                onChange={(e) => setSelectedRoomId(e.target.value)}
                disabled={!selectedFloorId}
                className={`w-full border rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white text-gray-900 disabled:bg-gray-100 disabled:cursor-not-allowed ${
                  errors.roomId ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-200'
                }`}
              >
                <option value="">เลือกห้อง</option>
                {availableRooms.map((room) => (
                  <option key={room.id} value={room.id}>
                    {room.name}
                  </option>
                ))}
              </select>
              {errors.roomId && (
                <p className="mt-1 text-xs text-red-600">{errors.roomId}</p>
              )}
            </div>
          </div>
        </div>

        {/* Brand and Model */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              ยี่ห้อ
            </label>
            <input
              type="text"
              name="brand"
              defaultValue={asset.brand || ''}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white text-gray-900 placeholder:text-gray-400"
              placeholder="เช่น Daikin, Mitsubishi"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              รุ่น
            </label>
            <input
              type="text"
              name="model"
              defaultValue={asset.model || ''}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white text-gray-900 placeholder:text-gray-400"
              placeholder="เช่น FTXS25LVMA"
            />
          </div>
        </div>

        {/* BTU - แสดงเฉพาะเครื่องปรับอากาศ */}
        {assetType === 'AIR_CONDITIONER' && (
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              BTU
            </label>
            <input
              type="number"
              name="btu"
              defaultValue={asset.btu || ''}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white text-gray-900 placeholder:text-gray-400"
              placeholder="เช่น 18000"
            />
          </div>
        )}

        {/* Install Date */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              วันที่ติดตั้ง
            </label>
            <input
              type="date"
              name="installDate"
              defaultValue={asset.installDate ? asset.installDate.toISOString().split('T')[0] : ''}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white text-gray-900"
            />
          </div>
        </div>

        {/* Status */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            สถานะ <span className="text-red-500">*</span>
          </label>
          <select
            name="status"
            defaultValue={asset.status}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white text-gray-900"
          >
            <option value="ACTIVE">ใช้งานได้</option>
            <option value="BROKEN">ชำรุด</option>
            <option value="RETIRED">เลิกใช้งาน</option>
          </select>
        </div>

        {/* Error Message */}
        {errors.submit && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <p className="text-sm text-red-600">{errors.submit}</p>
          </div>
        )}

        {/* Submit and Cancel Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200">
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl hover:shadow-xl hover:scale-105 font-semibold transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            <span>{isSubmitting ? 'กำลังบันทึก...' : 'บันทึกการแก้ไข'}</span>
          </button>
          <Link
            href={`/assets/${asset.id}`}
            className="sm:flex-none px-8 py-3 border-2 border-gray-300 rounded-xl hover:bg-gray-50 hover:border-gray-400 font-medium text-center transition-all duration-200 text-gray-700"
          >
            ยกเลิก
          </Link>
        </div>
      </div>
    </form>
  )
}

