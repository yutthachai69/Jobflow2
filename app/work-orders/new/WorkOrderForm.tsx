'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createWorkOrder } from '@/app/actions'
import Tooltip from '@/app/components/Tooltip'
import toast from 'react-hot-toast'

interface NewAssetEntry {
  brand: string
  model: string
  serialNo: string
  btu: string
}

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
  assets: Asset[]
}

interface Asset {
  id: string
  qrCode: string
  brand: string | null
  model: string | null
  btu: number | null
}

interface Props {
  sites: Site[]
}

type SelectionStage = 'site' | 'building' | 'floor' | 'room' | 'done'

export default function WorkOrderForm({ sites }: Props) {
  const router = useRouter()
  const [selectedSiteId, setSelectedSiteId] = useState<string>('')
  const [selectedBuildingId, setSelectedBuildingId] = useState<string>('')
  const [selectedFloorId, setSelectedFloorId] = useState<string>('')
  const [selectedRoomId, setSelectedRoomId] = useState<string>('')
  const [currentStage, setCurrentStage] = useState<SelectionStage>('site')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [showDropdown, setShowDropdown] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [jobType, setJobType] = useState<string>('')
  const [newAssets, setNewAssets] = useState<NewAssetEntry[]>([{ brand: '', model: '', serialNo: '', btu: '' }])

  const selectedSite = sites.find(s => s.id === selectedSiteId)
  const selectedBuilding = selectedSite?.buildings.find(b => b.id === selectedBuildingId)
  const selectedFloor = selectedBuilding?.floors.find(f => f.id === selectedFloorId)
  const selectedRoom = selectedFloor?.rooms.find(r => r.id === selectedRoomId)

  // สร้าง breadcrumb path
  const locationPath = selectedRoom
    ? `${selectedSite?.name} → ${selectedBuilding?.name} → ${selectedFloor?.name} → ${selectedRoom.name}`
    : selectedFloor
      ? `${selectedSite?.name} → ${selectedBuilding?.name} → ${selectedFloor.name}`
      : selectedBuilding
        ? `${selectedSite?.name} → ${selectedBuilding.name}`
        : selectedSite
          ? selectedSite.name
          : ''

  // ดึง options ตาม stage ปัจจุบัน
  const getCurrentOptions = () => {
    const query = searchQuery.toLowerCase()

    if (currentStage === 'site') {
      return sites
        .filter(site =>
          site.name.toLowerCase().includes(query) ||
          site.client.name.toLowerCase().includes(query)
        )
        .map(site => ({
          id: site.id,
          label: `${site.name} (${site.client.name})`,
          type: 'site' as const,
        }))
    }

    if (currentStage === 'building' && selectedSite) {
      return selectedSite.buildings
        .filter(building => building.name.toLowerCase().includes(query))
        .map(building => ({
          id: building.id,
          label: building.name,
          type: 'building' as const,
        }))
    }

    if (currentStage === 'floor' && selectedBuilding) {
      return selectedBuilding.floors
        .filter(floor => floor.name.toLowerCase().includes(query))
        .map(floor => ({
          id: floor.id,
          label: floor.name,
          type: 'floor' as const,
        }))
    }

    if (currentStage === 'room' && selectedFloor) {
      return selectedFloor.rooms
        .filter(room => room.name.toLowerCase().includes(query))
        .map(room => ({
          id: room.id,
          label: room.name,
          type: 'room' as const,
        }))
    }

    return []
  }

  const handleOptionSelect = (option: { id: string; label: string; type: string }) => {
    setSearchQuery('')
    setShowDropdown(false)

    if (option.type === 'site') {
      setSelectedSiteId(option.id)
      setSelectedBuildingId('')
      setSelectedFloorId('')
      setSelectedRoomId('')
      setCurrentStage('building')
      if (errors.siteId) setErrors({ ...errors, siteId: '' })
    } else if (option.type === 'building') {
      setSelectedBuildingId(option.id)
      setSelectedFloorId('')
      setSelectedRoomId('')
      setCurrentStage('floor')
      if (errors.buildingId) setErrors({ ...errors, buildingId: '' })
    } else if (option.type === 'floor') {
      setSelectedFloorId(option.id)
      setSelectedRoomId('')
      setCurrentStage('room')
      if (errors.floorId) setErrors({ ...errors, floorId: '' })
    } else if (option.type === 'room') {
      setSelectedRoomId(option.id)
      setCurrentStage('done')
      if (errors.roomId) setErrors({ ...errors, roomId: '' })
    }
  }

  const handleReset = () => {
    // ย้อนกลับทีละขั้น จาก room -> floor -> building -> site
    if (selectedRoomId) {
      setSelectedRoomId('')
      setCurrentStage('room')
      setErrors((prev) => ({ ...prev, roomId: '' }))
    } else if (selectedFloorId) {
      setSelectedFloorId('')
      setCurrentStage('floor')
      setErrors((prev) => ({ ...prev, floorId: '' }))
    } else if (selectedBuildingId) {
      setSelectedBuildingId('')
      setCurrentStage('building')
      setErrors((prev) => ({ ...prev, buildingId: '' }))
    } else if (selectedSiteId) {
      setSelectedSiteId('')
      setCurrentStage('site')
      setErrors((prev) => ({ ...prev, siteId: '' }))
    }

    setSearchQuery('')
    setShowDropdown(true)
  }

  // รวบรวมแอร์ทั้งหมดจากห้องที่เลือก (ถ้าเลือกห้อง) หรือจากชั้นที่เลือก (ถ้ายังไม่เลือกห้อง)
  const filteredAssets: Array<{
    asset: Asset
    siteName: string
    buildingName: string
    floorName: string
    roomName: string
  }> = selectedRoom
      ? selectedRoom.assets.map((asset) => ({
        asset,
        siteName: selectedSite!.name,
        buildingName: selectedBuilding!.name,
        floorName: selectedFloor!.name,
        roomName: selectedRoom.name,
      }))
      : selectedFloor
        ? selectedFloor.rooms.flatMap((room) =>
          room.assets.map((asset) => ({
            asset,
            siteName: selectedSite!.name,
            buildingName: selectedBuilding!.name,
            floorName: selectedFloor.name,
            roomName: room.name,
          }))
        )
        : []

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

    const formData = new FormData(e.currentTarget)
    const jobType = formData.get('jobType') as string
    if (!jobType) {
      newErrors.jobType = 'กรุณาเลือกชนิดงาน'
    }

    const scheduledDate = formData.get('scheduledDate') as string
    if (!scheduledDate) {
      newErrors.scheduledDate = 'กรุณาเลือกวันนัดหมาย'
    }

    const assetIds = formData.getAll('assetIds')

    if (jobType === 'INSTALL') {
      // INSTALL: ต้องกรอกข้อมูลเครื่องใหม่อย่างน้อย 1 เครื่อง
      const validAssets = newAssets.filter(a => a.brand.trim() !== '')
      if (validAssets.length === 0) {
        newErrors.newAssets = 'กรุณากรอกรายละเอียดเครื่องที่จะติดตั้งอย่างน้อย 1 เครื่อง'
      }
      if (!selectedRoomId) {
        newErrors.roomId = 'กรุณาเลือกห้องสำหรับติดตั้งเครื่องใหม่'
      }
    } else {
      // PM/CM: ต้องเลือก asset อย่างน้อย 1
      if (assetIds.length === 0) {
        newErrors.assetIds = 'กรุณาเลือกเครื่องปรับอากาศอย่างน้อย 1 เครื่อง'
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
    formData.set('siteId', selectedSiteId)

    // สำหรับ INSTALL ส่ง newAssets + roomId
    if (jobType === 'INSTALL') {
      const validAssets = newAssets.filter(a => a.brand.trim() !== '')
      formData.set('newAssets', JSON.stringify(validAssets))
      formData.set('roomId', selectedRoomId)
    }

    await createWorkOrder(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 md:p-8 border border-gray-100">
      <div className="space-y-6">
        {/* เลือกสถานที่ (Single Autocomplete Field) */}
        <div data-error={(errors.siteId || errors.buildingId || errors.floorId) ? 'true' : undefined}>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            <span className="flex items-center gap-2">
              สถานที่ติดตั้ง <span className="text-red-500">*</span>
              <Tooltip content="เลือกสถานที่ อาคาร และชั้นที่ต้องการทำงาน">
                <span className="text-gray-400 hover:text-gray-600 cursor-help text-xs">ℹ️</span>
              </Tooltip>
            </span>
          </label>

          {/* Breadcrumb Display + ปุ่มย้อนกลับระดับสถานที่ */}
          {locationPath && (
            <div className="mb  -2 flex items-center gap-2 flex-wrap">
              <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 flex items-center gap-2">
                <span className="text-blue-700 font-medium">{locationPath}</span>
                <button
                  type="button"
                  onClick={handleReset}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  ย้อนกลับ
                </button>
              </div>
            </div>
          )}

          {/* Search Input (always visible so user can change selection) */}
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setShowDropdown(true)
              }}
              onFocus={() => {
                // ถ้าเลือกครบแล้ว แต่อยากเปลี่ยน แค่ย้อนกลับไปเลือกห้องใหม่ (คง Site/อาคาร/ชั้น เดิม)
                if (currentStage === 'done') {
                  setCurrentStage('room')
                  setSelectedRoomId('')
                }
                setShowDropdown(true)
              }}
              onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
              aria-label="ค้นหาหรือเลือกสถานที่"
              aria-required="true"
              aria-invalid={(errors.siteId || errors.buildingId || errors.floorId) ? 'true' : 'false'}
              placeholder={
                currentStage === 'site' ? 'ค้นหาหรือเลือกสถานที่...' :
                  currentStage === 'building' ? 'ค้นหาหรือเลือกอาคาร...' :
                    currentStage === 'floor' ? 'ค้นหาหรือเลือกชั้น...' :
                      'ค้นหาหรือเลือกห้อง...'
              }
              className={`w-full border rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white/50 backdrop-blur-sm hover:bg-white text-gray-900 placeholder:text-gray-400 ${(errors.siteId || errors.buildingId || errors.floorId) ? 'border-red-400 bg-red-50/50' : 'border-gray-200'
                }`}
            />

            {/* Dropdown Options */}
            {showDropdown && getCurrentOptions().length > 0 && (
              <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-xl max-h-60 overflow-y-auto">
                {getCurrentOptions().map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => handleOptionSelect(option)}
                    className="w-full text-left px-4 py-3 hover:bg-blue-50 transition-colors border-b border-gray-100 last:border-b-0"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-gray-900">{option.label}</span>
                      <span className="text-xs text-gray-500">
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Error Messages */}
          {errors.siteId && (
            <div className="mt-2 flex items-start gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2" role="alert">
              <span>⚠️</span>
              <div>
                <p className="font-semibold">{errors.siteId}</p>
                <p className="text-xs text-red-500 mt-1">💡 กรุณาเลือกสถานที่ก่อนดำเนินการต่อ</p>
              </div>
            </div>
          )}
          {errors.buildingId && (
            <div className="mt-2 flex items-start gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2" role="alert">
              <span>⚠️</span>
              <div>
                <p className="font-semibold">{errors.buildingId}</p>
                <p className="text-xs text-red-500 mt-1">💡 กรุณาเลือกอาคารก่อนดำเนินการต่อ</p>
              </div>
            </div>
          )}
          {errors.floorId && (
            <div className="mt-2 flex items-start gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2" role="alert">
              <span>⚠️</span>
              <div>
                <p className="font-semibold">{errors.floorId}</p>
                <p className="text-xs text-red-500 mt-1">💡 กรุณาเลือกชั้นก่อนดำเนินการต่อ</p>
              </div>
            </div>
          )}

          {/* Helper Text */}
          {!errors.siteId && !errors.buildingId && !errors.floorId && (
            <p className="mt-2 text-xs text-gray-500">
              {currentStage === 'site' && 'ค้นหาหรือเลือกสถานที่ที่ต้องการทำงาน'}
              {currentStage === 'building' && 'ค้นหาหรือเลือกอาคาร'}
              {currentStage === 'floor' && 'ค้นหาหรือเลือกชั้น'}
              {currentStage === 'room' && 'ค้นหาหรือเลือกห้อง (ไม่บังคับ - สามารถเลือกทั้งหมดในชั้นได้)'}
              {currentStage === 'done' && 'เลือกสถานที่เรียบร้อยแล้ว'}
            </p>
          )}
        </div>

        {/* ชนิดงาน */}
        <div data-error={errors.jobType ? 'true' : undefined}>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            <span className="flex items-center gap-2">
              ชนิดงาน <span className="text-red-500">*</span>
              <Tooltip content="เลือกประเภทงาน: PM (บำรุงรักษาประจำ), CM (ซ่อมฉุกเฉิน), หรือ INSTALL (ติดตั้งใหม่)">
                <span className="text-gray-400 hover:text-gray-600 cursor-help text-xs">ℹ️</span>
              </Tooltip>
            </span>
          </label>
          <select
            name="jobType"
            aria-label="เลือกชนิดงาน"
            aria-required="true"
            aria-invalid={errors.jobType ? 'true' : 'false'}
            onChange={(e) => {
              const val = e.target.value
              setJobType(val)
              if (errors.jobType) setErrors({ ...errors, jobType: '' })
              // Reset newAssets when switching to INSTALL
              if (val === 'INSTALL') {
                setNewAssets([{ brand: '', model: '', serialNo: '', btu: '' }])
              }
            }}
            className={`w-full border rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white/50 backdrop-blur-sm hover:bg-white text-gray-900 ${errors.jobType ? 'border-red-400 bg-red-50/50' : 'border-gray-200'
              }`}
          >
            <option value="">-- เลือกชนิดงาน --</option>
            <option value="PM">🔧 PM - บำรุงรักษาประจำ</option>
            <option value="CM">⚡ CM - ซ่อมฉุกเฉิน</option>
            <option value="INSTALL">🆕 INSTALL - ติดตั้งใหม่</option>
          </select>
          {errors.jobType && (
            <div className="mt-2 flex items-start gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2" role="alert">
              <span>⚠️</span>
              <div>
                <p className="font-semibold">{errors.jobType}</p>
                <p className="text-xs text-red-500 mt-1">💡 กรุณาเลือกชนิดงานก่อนดำเนินการต่อ</p>
              </div>
            </div>
          )}
          {!errors.jobType && (
            <p className="mt-2 text-xs text-gray-500">
              ประเภทของงานที่ต้องการทำ
            </p>
          )}
        </div>

        {/* วันนัดหมาย */}
        <div data-error={errors.scheduledDate ? 'true' : undefined}>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            <span className="flex items-center gap-2">
              วันนัดหมาย <span className="text-red-500">*</span>
              <Tooltip content="เลือกวันและเวลาที่ต้องการให้ช่างเข้าทำงาน">
                <span className="text-gray-400 hover:text-gray-600 cursor-help text-xs">ℹ️</span>
              </Tooltip>
            </span>
          </label>
          <input
            type="datetime-local"
            name="scheduledDate"
            aria-label="เลือกวันนัดหมาย"
            aria-required="true"
            aria-invalid={errors.scheduledDate ? 'true' : 'false'}
            onChange={(e) => {
              if (errors.scheduledDate) setErrors({ ...errors, scheduledDate: '' })
            }}
            className={`w-full border rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white/50 backdrop-blur-sm hover:bg-white text-gray-900 ${errors.scheduledDate ? 'border-red-400 bg-red-50/50' : 'border-gray-200'
              }`}
          />
          {errors.scheduledDate && (
            <div className="mt-2 flex items-start gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2" role="alert">
              <span>⚠️</span>
              <div>
                <p className="font-semibold">{errors.scheduledDate}</p>
                <p className="text-xs text-red-500 mt-1">💡 กรุณาเลือกวันนัดหมายก่อนดำเนินการต่อ</p>
              </div>
            </div>
          )}
          {!errors.scheduledDate && (
            <p className="mt-2 text-xs text-gray-500">
              📅 วันและเวลาที่ต้องการให้ช่างเข้าทำงาน
            </p>
          )}
        </div>

        {/* ทีมที่รับผิดชอบ */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            ทีมที่รับผิดชอบ
          </label>
          <input
            type="text"
            name="assignedTeam"
            placeholder="เช่น ทีมช่าง A, สมชาย งานดี"
            className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white/50 backdrop-blur-sm hover:bg-white text-gray-900 placeholder:text-gray-400"
          />
          <p className="mt-2 text-xs text-gray-500">
            👥 ระบุชื่อทีมหรือช่างที่รับผิดชอบ (ไม่บังคับ)
          </p>
        </div>

        {/* เลือกแอร์ หรือ กรอกข้อมูลแอร์ใหม่ */}
        {jobType === 'INSTALL' ? (
          /* ===== INSTALL MODE: กรอกรายละเอียดเครื่องใหม่ ===== */
          <div data-error={errors.newAssets ? 'true' : undefined}>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              <span className="flex items-center gap-2">
                🆕 รายละเอียดเครื่องที่จะติดตั้ง <span className="text-red-500">*</span>
                <Tooltip content="กรอกข้อมูลเครื่องปรับอากาศที่จะติดตั้งใหม่ ระบบจะสร้าง Asset ให้อัตโนมัติ">
                  <span className="text-gray-400 hover:text-gray-600 cursor-help text-xs">ℹ️</span>
                </Tooltip>
              </span>
            </label>

            {!selectedRoomId ? (
              <div className="border-2 border-dashed border-amber-300 rounded-xl p-8 text-center bg-amber-50">
                <p className="text-amber-700 font-medium mb-2">กรุณาเลือก &quot;ห้อง&quot; สำหรับติดตั้งเครื่องใหม่</p>
                <p className="text-sm text-amber-600">งาน INSTALL ต้องระบุห้องที่จะติดตั้ง</p>
              </div>
            ) : (
              <>
                <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl p-4 mb-3">
                  <div className="flex items-center gap-2 text-sm text-emerald-800">
                    <span>📍</span>
                    <span>ติดตั้งที่: <span className="font-bold">{locationPath}</span></span>
                  </div>
                </div>

                <div className="space-y-4">
                  {newAssets.map((entry, index) => (
                    <div key={index} className="border-2 border-gray-200 rounded-xl p-4 bg-white relative group hover:border-blue-200 transition-colors">
                      {/* Header */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="bg-blue-100 text-blue-700 w-7 h-7 rounded-lg flex items-center justify-center text-sm font-bold">{index + 1}</span>
                          <span className="text-sm font-semibold text-gray-700">เครื่องที่ {index + 1}</span>
                        </div>
                        {newAssets.length > 1 && (
                          <button
                            type="button"
                            onClick={() => setNewAssets(newAssets.filter((_, i) => i !== index))}
                            className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                            title="ลบเครื่องนี้"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                          </button>
                        )}
                      </div>

                      {/* Fields Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">ยี่ห้อ <span className="text-red-500">*</span></label>
                          <input
                            type="text"
                            value={entry.brand}
                            onChange={(e) => {
                              const updated = [...newAssets]
                              updated[index] = { ...updated[index], brand: e.target.value }
                              setNewAssets(updated)
                              if (errors.newAssets) setErrors({ ...errors, newAssets: '' })
                            }}
                            placeholder="เช่น Daikin, Mitsubishi"
                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">รุ่น</label>
                          <input
                            type="text"
                            value={entry.model}
                            onChange={(e) => {
                              const updated = [...newAssets]
                              updated[index] = { ...updated[index], model: e.target.value }
                              setNewAssets(updated)
                            }}
                            placeholder="เช่น FTKM09XV2S"
                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">Serial No.</label>
                          <input
                            type="text"
                            value={entry.serialNo}
                            onChange={(e) => {
                              const updated = [...newAssets]
                              updated[index] = { ...updated[index], serialNo: e.target.value }
                              setNewAssets(updated)
                            }}
                            placeholder="หมายเลขเครื่อง (ถ้ามี)"
                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">BTU</label>
                          <input
                            type="number"
                            value={entry.btu}
                            onChange={(e) => {
                              const updated = [...newAssets]
                              updated[index] = { ...updated[index], btu: e.target.value }
                              setNewAssets(updated)
                            }}
                            placeholder="เช่น 9000, 12000, 18000"
                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* ปุ่มเพิ่มเครื่อง */}
                <button
                  type="button"
                  onClick={() => setNewAssets([...newAssets, { brand: '', model: '', serialNo: '', btu: '' }])}
                  className="mt-3 w-full border-2 border-dashed border-blue-300 rounded-xl py-3 text-blue-600 font-semibold hover:bg-blue-50 hover:border-blue-400 transition-colors flex items-center justify-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                  </svg>
                  เพิ่มเครื่องอีก 1 เครื่อง
                </button>

                <p className="text-xs text-gray-500 mt-2">
                  💡 ระบบจะสร้าง QR Code และข้อมูลทรัพย์สินให้อัตโนมัติเมื่อสร้างใบสั่งงาน
                </p>
              </>
            )}

            {errors.newAssets && (
              <div className="mt-3 flex items-start gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3" role="alert">
                <span>⚠️</span>
                <div>
                  <p className="font-semibold">{errors.newAssets}</p>
                </div>
              </div>
            )}
            {errors.roomId && (
              <div className="mt-3 flex items-start gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3" role="alert">
                <span>⚠️</span>
                <div>
                  <p className="font-semibold">{errors.roomId}</p>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* ===== PM/CM MODE: เลือกเครื่องที่มีอยู่ ===== */
          <div data-error={errors.assetIds ? 'true' : undefined}>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              <span className="flex items-center gap-2">
                เลือกเครื่องปรับอากาศ <span className="text-red-500">*</span>
                <Tooltip content="เลือกเครื่องปรับอากาศที่ต้องการบำรุงรักษาในใบสั่งงานนี้ (เลือกได้หลายเครื่อง)">
                  <span className="text-gray-400 hover:text-gray-600 cursor-help text-xs">ℹ️</span>
                </Tooltip>
              </span>
            </label>

            {!selectedSiteId ? (
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center bg-gray-50">
                <p className="text-gray-600 font-medium mb-2">กรุณาเลือกสถานที่ก่อน</p>
                <p className="text-sm text-gray-500">หลังจากเลือกสถานที่ อาคาร และชั้นแล้ว จะแสดงเครื่องปรับอากาศ</p>
              </div>
            ) : !selectedBuildingId ? (
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center bg-gray-50">
                <p className="text-gray-600 font-medium mb-2">กรุณาเลือกอาคารก่อน</p>
                <p className="text-sm text-gray-500">หลังจากเลือกอาคารและชั้นแล้ว จะแสดงเครื่องปรับอากาศ</p>
              </div>
            ) : !selectedFloorId ? (
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center bg-gray-50">
                <p className="text-gray-600 font-medium mb-2">กรุณาเลือกชั้นก่อน</p>
                <p className="text-sm text-gray-500">หลังจากเลือกชั้นแล้ว จะแสดงเครื่องปรับอากาศในชั้นนั้น</p>
              </div>
            ) : filteredAssets.length === 0 ? (
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center bg-gray-50">
                <p className="text-gray-600 font-medium mb-2">
                  {selectedRoomId
                    ? 'ไม่พบเครื่องปรับอากาศในห้องนี้'
                    : 'ไม่พบเครื่องปรับอากาศในชั้นนี้'}
                </p>
                <p className="text-sm text-gray-500">
                  {selectedRoomId
                    ? 'ห้องนี้ยังไม่มีเครื่องปรับอากาศ'
                    : 'ชั้นนี้ยังไม่มีเครื่องปรับอากาศ'}
                </p>
              </div>
            ) : (
              <>
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4 mb-3">
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <span>
                      พบเครื่องปรับอากาศทั้งหมด <span className="font-bold text-blue-700">{filteredAssets.length}</span> เครื่อง
                      {selectedRoomId ? ` ในห้อง ${selectedRoom?.name}` : ` ในชั้น ${selectedFloor?.name}`}
                    </span>
                  </div>
                </div>

                <div className="border-2 border-gray-200 rounded-xl p-4 max-h-96 overflow-y-auto space-y-3 bg-gray-50">
                  {filteredAssets.map((item) => (
                    <label
                      key={item.asset.id}
                      className="flex items-start gap-3 p-4 hover:bg-white rounded-xl border-2 border-gray-200 hover:border-blue-300 cursor-pointer transition-all duration-200 bg-white"
                    >
                      <input
                        type="checkbox"
                        name="assetIds"
                        value={item.asset.id}
                        className="mt-1.5 w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="font-semibold text-gray-900">
                            {item.asset.brand || 'ไม่มียี่ห้อ'} {item.asset.model || ''}
                          </div>
                          <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded text-gray-600">
                            {item.asset.qrCode}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600 mb-1 flex-wrap">
                          <span>{item.siteName}</span>
                          <span className="text-gray-400">→</span>
                          <span>{item.buildingName}</span>
                          <span className="text-gray-400">→</span>
                          <span>{item.floorName}</span>
                          <span className="text-gray-400">→</span>
                          <span>{item.roomName}</span>
                        </div>
                        {item.asset.btu && (
                          <div className="text-xs text-gray-500 flex items-center gap-1">
                            <span>💨</span>
                            <span>{item.asset.btu.toLocaleString()} BTU</span>
                          </div>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-3 flex items-center gap-1">
                  <span>เลือกเครื่องที่ต้องการบำรุงรักษาในใบสั่งงานนี้ (เลือกได้หลายเครื่อง)</span>
                </p>
              </>
            )}

            {errors.assetIds && (
              <div className="mt-3 flex items-start gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3" role="alert">
                <span>⚠️</span>
                <div>
                  <p className="font-semibold">{errors.assetIds}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ปุ่ม Submit */}
        <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-gray-200">
          <button
            type="submit"
            disabled={isSubmitting || !selectedSiteId || !selectedBuildingId || !selectedFloorId || (jobType !== 'INSTALL' && filteredAssets.length === 0)}
            aria-label="สร้างใบสั่งงาน"
            className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl hover:shadow-xl hover:scale-105 font-semibold transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 active:scale-95"
          >
            <span>{isSubmitting ? 'กำลังสร้าง...' : 'สร้างใบสั่งงาน'}</span>
          </button>
          <button
            type="button"
            onClick={() => router.push('/work-orders')}
            aria-label="ยกเลิกและกลับไปหน้ารายการ"
            className="sm:flex-none px-8 py-3 border-2 border-gray-300 rounded-xl hover:bg-gray-50 hover:border-gray-400 font-medium text-center transition-all duration-200 text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                router.push('/work-orders')
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

