'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createAsset } from '@/app/actions/index'
import Tooltip from '@/app/components/Tooltip'

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

interface Props {
  sites: Site[]
}

export default function AssetForm({ sites }: Props) {
  const router = useRouter()
  const [selectedSiteId, setSelectedSiteId] = useState<string>('')
  const [selectedBuildingId, setSelectedBuildingId] = useState<string>('')
  const [selectedFloorId, setSelectedFloorId] = useState<string>('')
  const [selectedRoomId, setSelectedRoomId] = useState<string>('')
  const [assetType, setAssetType] = useState<string>('AIR_CONDITIONER')
  const [machineType, setMachineType] = useState<string>('SPLIT_TYPE')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const selectedSite = sites.find(s => s.id === selectedSiteId)
  const selectedBuilding = selectedSite?.buildings.find(b => b.id === selectedBuildingId)
  const selectedFloor = selectedBuilding?.floors.find(f => f.id === selectedFloorId)
  const availableRooms = selectedFloor?.rooms || []

  const handleSiteChange = (siteId: string) => {
    setSelectedSiteId(siteId)
    setSelectedBuildingId('')
    setSelectedFloorId('')
    setSelectedRoomId('')
  }

  const handleBuildingChange = (buildingId: string) => {
    setSelectedBuildingId(buildingId)
    setSelectedFloorId('')
    setSelectedRoomId('')
  }

  const handleFloorChange = (floorId: string) => {
    setSelectedFloorId(floorId)
    setSelectedRoomId('')
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsSubmitting(true)
    const newErrors: Record<string, string> = {}

    // Validation
    if (!selectedSiteId) {
      newErrors.siteId = 'กรุณาเลือกสถานที่'
    }
    if (!selectedBuildingId) {
      newErrors.buildingId = 'กรุณาเลือกอาคาร'
    }
    if (!selectedFloorId) {
      newErrors.floorId = 'กรุณาเลือกชั้น'
    }
    if (!selectedRoomId) {
      newErrors.roomId = 'กรุณาเลือกห้อง'
    }

    const formData = new FormData(e.currentTarget)
    const serialNo = formData.get('serialNo') as string
    const assetTypeValue = formData.get('assetType') as string || 'AIR_CONDITIONER'
    const machineTypeValue = formData.get('machineType') as string || 'SPLIT_TYPE'

    // QR Code/Serial Number เป็น required เฉพาะเครื่องปรับอากาศ
    if (assetTypeValue === 'AIR_CONDITIONER') {
      if (!serialNo || serialNo.trim() === '') {
        newErrors.serialNo = 'กรุณากรอก Serial Number / QR Code'
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      setIsSubmitting(false)
      // Scroll to first error
      const firstErrorField = document.querySelector('[data-error]')
      firstErrorField?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }

    setErrors({})
    formData.set('roomId', selectedRoomId)
    await createAsset(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-gray-100">
      <div className="space-y-6">
        {/* เลือกสถานที่ */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            สถานที่ <span className="text-red-500">*</span>
          </label>
          <select
            value={selectedSiteId}
            onChange={(e) => handleSiteChange(e.target.value)}
            aria-label="เลือกสถานที่"
            aria-required="true"
            className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white/50 backdrop-blur-sm hover:bg-white text-gray-900"
          >
            <option value="">-- เลือกสถานที่ --</option>
            {sites.map((site) => (
              <option key={site.id} value={site.id}>
                {site.name} ({site.client.name})
              </option>
            ))}
          </select>
          <p className="mt-2 text-xs text-gray-500">
            เลือกสถานที่ที่ต้องการติดตั้งทรัพย์สิน
          </p>
        </div>

        {/* เลือกอาคาร */}
        {selectedSite && selectedSite.buildings.length > 0 && (
          <div data-error={errors.buildingId ? 'true' : undefined}>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              อาคาร <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedBuildingId}
              onChange={(e) => {
                handleBuildingChange(e.target.value)
                if (errors.buildingId) setErrors({ ...errors, buildingId: '' })
              }}
              className={`w-full border rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white/50 backdrop-blur-sm hover:bg-white text-gray-900 ${errors.buildingId ? 'border-red-400 bg-red-50/50' : 'border-gray-200'
                }`}
            >
              <option value="">-- เลือกอาคาร --</option>
              {selectedSite.buildings.map((building) => (
                <option key={building.id} value={building.id}>
                  {building.name}
                </option>
              ))}
            </select>
            {errors.buildingId && (
              <div className="mt-2 flex items-start gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2" role="alert">
                <span>⚠️</span>
                <div>
                  <p className="font-semibold">{errors.buildingId}</p>
                  <p className="text-xs text-red-500 mt-1">💡 กรุณาเลือกอาคารก่อนดำเนินการต่อ</p>
                </div>
              </div>
            )}
            {!errors.buildingId && (
              <p className="mt-2 text-xs text-gray-500">
                เลือกอาคารที่ต้องการติดตั้ง
              </p>
            )}
          </div>
        )}

        {/* เลือกชั้น */}
        {selectedBuilding && selectedBuilding.floors.length > 0 && (
          <div data-error={errors.floorId ? 'true' : undefined}>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              ชั้น <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedFloorId}
              onChange={(e) => {
                handleFloorChange(e.target.value)
                if (errors.floorId) setErrors({ ...errors, floorId: '' })
              }}
              className={`w-full border rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white/50 backdrop-blur-sm hover:bg-white text-gray-900 ${errors.floorId ? 'border-red-400 bg-red-50/50' : 'border-gray-200'
                }`}
            >
              <option value="">-- เลือกชั้น --</option>
              {selectedBuilding.floors.map((floor) => (
                <option key={floor.id} value={floor.id}>
                  {floor.name}
                </option>
              ))}
            </select>
            {errors.floorId && (
              <div className="mt-2 flex items-start gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2" role="alert">
                <span>⚠️</span>
                <div>
                  <p className="font-semibold">{errors.floorId}</p>
                  <p className="text-xs text-red-500 mt-1">💡 กรุณาเลือกชั้นก่อนดำเนินการต่อ</p>
                </div>
              </div>
            )}
            {!errors.floorId && (
              <p className="mt-2 text-xs text-gray-500">
                เลือกชั้นที่ต้องการติดตั้ง
              </p>
            )}
          </div>
        )}

        {/* เลือกห้อง */}
        {selectedFloor && availableRooms.length > 0 && (
          <div data-error={errors.roomId ? 'true' : undefined}>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              ห้อง <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedRoomId}
              onChange={(e) => {
                setSelectedRoomId(e.target.value)
                if (errors.roomId) setErrors({ ...errors, roomId: '' })
              }}
              className={`w-full border rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white/50 backdrop-blur-sm hover:bg-white text-gray-900 ${errors.roomId ? 'border-red-400 bg-red-50/50' : 'border-gray-200'
                }`}
            >
              <option value="">-- เลือกห้อง --</option>
              {availableRooms.map((room) => (
                <option key={room.id} value={room.id}>
                  {room.name}
                </option>
              ))}
            </select>
            {errors.roomId && (
              <div className="mt-2 flex items-start gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2" role="alert">
                <span>⚠️</span>
                <div>
                  <p className="font-semibold">{errors.roomId}</p>
                  <p className="text-xs text-red-500 mt-1">💡 กรุณาเลือกห้องก่อนดำเนินการต่อ</p>
                </div>
              </div>
            )}
            {!errors.roomId && (
              <p className="mt-2 text-xs text-gray-500">
                เลือกห้องที่ต้องการติดตั้งทรัพย์สิน
              </p>
            )}
          </div>
        )}

        {selectedSite && selectedSite.buildings.length === 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
            <p className="text-sm text-yellow-800">
              สถานที่นี้ยังไม่มีอาคาร กรุณาเพิ่มอาคารก่อน
            </p>
          </div>
        )}

        {selectedBuilding && selectedBuilding.floors.length === 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
            <p className="text-sm text-yellow-800">
              อาคารนี้ยังไม่มีชั้น กรุณาเพิ่มชั้นก่อน
            </p>
          </div>
        )}

        {selectedFloor && availableRooms.length === 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
            <p className="text-sm text-yellow-800">
              ชั้นนี้ยังไม่มีห้อง กรุณาเพิ่มห้องก่อน
            </p>
          </div>
        )}

        {/* Asset Type */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            ประเภททรัพย์สิน <span className="text-red-500">*</span>
          </label>
          <select
            name="assetType"
            value={assetType}
            onChange={(e) => setAssetType(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white/50 backdrop-blur-sm hover:bg-white text-gray-900"
          >
            <option value="AIR_CONDITIONER">เครื่องปรับอากาศ</option>
            <option value="REFRIGERANT">น้ำยาแอร์</option>
            <option value="SPARE_PART">อะไหล่</option>
            <option value="TOOL">เครื่องมือ</option>
            <option value="OTHER">อื่นๆ</option>
          </select>
          <p className="mt-2 text-xs text-gray-500">
            เลือกประเภทของทรัพย์สินที่ต้องการเพิ่ม
          </p>
        </div>

        {/* Machine Type (เฉพาะแอร์) */}
        {assetType === 'AIR_CONDITIONER' && (
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              ชนิดแอร์ (Machine Type) <span className="text-red-500">*</span>
            </label>
            <select
              name="machineType"
              value={machineType}
              onChange={(e) => setMachineType(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white/50 backdrop-blur-sm hover:bg-white text-gray-900"
            >
              <option value="SPLIT_TYPE">แอร์แบบแยกส่วน (Split Type)</option>
              <option value="FCU">เครื่องเป่าลมเย็น (FCU)</option>
              <option value="AHU">เครื่องส่งลมเย็นขนาดใหญ่ (AHU)</option>
              <option value="EXHAUST">พัดลมดูดอากาศ (Exhaust)</option>
              <option value="VRF">เครื่องปรับอากาศแบบ VRF</option>
              <option value="OTHER">อื่นๆ</option>
            </select>
            <p className="mt-2 text-xs text-gray-500">
              เลือกชนิดของแอร์เพื่อใช้จัดกลุ่มในรายงาน Dashboard
            </p>
          </div>
        )}

        {/* Brand และ Model */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              ยี่ห้อ
            </label>
            <input
              type="text"
              name="brand"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white/50 backdrop-blur-sm hover:bg-white text-gray-900 placeholder:text-gray-400"
              placeholder="เช่น Daikin, Carrier"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              รุ่น
            </label>
            <input
              type="text"
              name="model"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white/50 backdrop-blur-sm hover:bg-white text-gray-900 placeholder:text-gray-400"
              placeholder="เช่น Model-X1"
            />
          </div>
        </div>

        {/* Serial Number และ BTU */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {assetType === 'AIR_CONDITIONER' ? (
            <div data-error={errors.serialNo ? 'true' : undefined}>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <span className="flex items-center gap-2">
                  Serial Number / QR Code <span className="text-red-500">*</span>
                  <Tooltip content="Serial Number จะถูกใช้เป็น QR Code สำหรับสแกนหาทรัพย์สิน ต้องไม่ซ้ำกับทรัพย์สินอื่น">
                    <span className="text-gray-400 hover:text-gray-600 cursor-help text-xs">ℹ️</span>
                  </Tooltip>
                </span>
              </label>
              <input
                type="text"
                name="serialNo"
                autoFocus
                className={`w-full border rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white/50 backdrop-blur-sm hover:bg-white text-gray-900 placeholder:text-gray-400 ${errors.serialNo ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-200'
                  }`}
                placeholder="เช่น SN-00001"
              />
              {errors.serialNo && (
                <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                  <span>{errors.serialNo}</span>
                </p>
              )}
              {!errors.serialNo && (
                <p className="mt-2 text-xs text-gray-500">
                  🔖 Serial Number นี้จะใช้เป็น QR Code (ต้องไม่ซ้ำ)
                </p>
              )}
            </div>
          ) : (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                รหัสทรัพย์สิน
              </label>
              <input
                type="text"
                name="serialNo"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white/50 backdrop-blur-sm hover:bg-white text-gray-900 placeholder:text-gray-400"
                placeholder="เช่น REF-001, PART-001"
              />
              <p className="mt-2 text-xs text-gray-500">
                รหัสสำหรับระบุทรัพย์สิน (ไม่จำเป็นต้องมี QR Code)
              </p>
            </div>
          )}

          {assetType === 'AIR_CONDITIONER' && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                BTU
              </label>
              <input
                type="number"
                name="btu"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white/50 backdrop-blur-sm hover:bg-white text-gray-900 placeholder:text-gray-400"
                placeholder="เช่น 18000"
              />
            </div>
          )}
        </div>

        {/* วันที่ติดตั้ง */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            วันที่ติดตั้ง
          </label>
          <input
            type="date"
            name="installDate"
            className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white/50 backdrop-blur-sm hover:bg-white text-gray-900"
          />
          <p className="mt-2 text-xs text-gray-500">
            📅 วันที่ติดตั้งทรัพย์สิน (ไม่บังคับ)
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-gray-200">
          <button
            type="submit"
            disabled={!selectedRoomId}
            aria-label="บันทึกข้อมูลทรัพย์สิน"
            className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-6 py-3 rounded-xl hover:shadow-xl hover:scale-105 font-semibold transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 active:scale-95"
          >
            <span>บันทึก</span>
          </button>
          <button
            type="button"
            onClick={() => router.push('/assets')}
            aria-label="ยกเลิกและกลับไปหน้ารายการ"
            className="sm:flex-none px-8 py-3 border-2 border-gray-300 rounded-xl hover:bg-gray-50 hover:border-gray-400 font-medium text-center transition-all duration-200 text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                router.push('/assets')
              }
            }}
          >
            ยกเลิก
          </button>
        </div>
      </div>
    </form>
  )
}
