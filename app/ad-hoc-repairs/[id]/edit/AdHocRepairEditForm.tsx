'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { updateAdHocRepair } from '@/app/actions/work-orders'
import toast from 'react-hot-toast'

interface Site {
  id: string
  name: string
}

interface Repair {
  id: string
  repairType: string | null
  locationDescription: string | null
  problemDescription: string | null
  scheduledDate: Date
  site: Site
}

interface Props {
  repair: Repair
}

const REPAIR_TYPES = [
  { value: 'WASH_AC', label: 'ล้างแอร์' },
  { value: 'REPAIR_AC', label: 'ซ่อมแอร์' },
  { value: 'WASH_FAN', label: 'ล้างพัดลม' },
  { value: 'REPAIR_FAN', label: 'ซ่อมพัดลม' },
  { value: 'OTHER', label: 'อื่นๆ' },
]

export default function AdHocRepairEditForm({ repair }: Props) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsSubmitting(true)
    const newErrors: Record<string, string> = {}

    const formData = new FormData(e.currentTarget)
    const repairType = formData.get('repairType') as string
    const locationDescription = formData.get('locationDescription') as string
    const problemDescription = formData.get('problemDescription') as string
    const scheduledDate = formData.get('scheduledDate') as string

    if (!repairType) newErrors.repairType = 'กรุณาเลือกประเภทการซ่อม'
    if (!locationDescription) newErrors.locationDescription = 'กรุณากรอกสถานที่'
    if (!problemDescription) newErrors.problemDescription = 'กรุณากรอกรายละเอียดปัญหา'
    if (!scheduledDate) newErrors.scheduledDate = 'กรุณาเลือกวันที่'

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      setIsSubmitting(false)
      return
    }

    try {
      setErrors({})
      formData.append('workOrderId', repair.id)
      await updateAdHocRepair(formData)
      toast.success('บันทึกการเปลี่ยนแปลงเรียบร้อยแล้ว')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'เกิดข้อผิดพลาด'
      toast.error(message)
      setIsSubmitting(false)
    }
  }

  const scheduledDate = new Date(repair.scheduledDate)
  const year = scheduledDate.getFullYear()
  const month = String(scheduledDate.getMonth() + 1).padStart(2, '0')
  const day = String(scheduledDate.getDate()).padStart(2, '0')
  const hours = String(scheduledDate.getHours()).padStart(2, '0')
  const minutes = String(scheduledDate.getMinutes()).padStart(2, '0')
  const defaultDateTime = `${year}-${month}-${day}T${hours}:${minutes}`

  return (
    <form onSubmit={handleSubmit} className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-gray-100">
      <div className="space-y-6">
        {/* สถานที่ (read-only) */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">สถานที่</label>
          <div className="bg-gray-100 px-4 py-3 rounded-xl text-gray-900">
            {repair.site.name}
          </div>
        </div>

        {/* ประเภทการซ่อม */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            ประเภทการซ่อม <span className="text-red-500">*</span>
          </label>
          <select
            name="repairType"
            defaultValue={repair.repairType || ''}
            className={`w-full border rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
              errors.repairType ? 'border-red-400 bg-red-50' : 'border-gray-200 bg-white/50'
            }`}
          >
            <option value="">-- เลือกประเภท --</option>
            {REPAIR_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
          {errors.repairType && <p className="mt-1 text-sm text-red-600">{errors.repairType}</p>}
        </div>

        {/* สถานที่ (รายละเอียด) */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            รายละเอียดสถานที่ <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="locationDescription"
            defaultValue={repair.locationDescription || ''}
            className={`w-full border rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
              errors.locationDescription ? 'border-red-400 bg-red-50' : 'border-gray-200 bg-white/50'
            }`}
            placeholder="เช่น อาคาร A ชั้น 2 ห้อง 201"
          />
          {errors.locationDescription && <p className="mt-1 text-sm text-red-600">{errors.locationDescription}</p>}
        </div>

        {/* รายละเอียดปัญหา */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            รายละเอียดปัญหา <span className="text-red-500">*</span>
          </label>
          <textarea
            name="problemDescription"
            rows={4}
            defaultValue={repair.problemDescription || ''}
            className={`w-full border rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none ${
              errors.problemDescription ? 'border-red-400 bg-red-50' : 'border-gray-200 bg-white/50'
            }`}
            placeholder="บรรยายปัญหาที่เกิดขึ้น..."
          />
          {errors.problemDescription && <p className="mt-1 text-sm text-red-600">{errors.problemDescription}</p>}
        </div>

        {/* วันที่ */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            วันที่ที่ต้องการซ่อม <span className="text-red-500">*</span>
          </label>
          <input
            type="datetime-local"
            name="scheduledDate"
            defaultValue={defaultDateTime}
            className={`w-full border rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
              errors.scheduledDate ? 'border-red-400 bg-red-50' : 'border-gray-200 bg-white/50'
            }`}
          />
          {errors.scheduledDate && <p className="mt-1 text-sm text-red-600">{errors.scheduledDate}</p>}
        </div>

        {/* Buttons */}
        <div className="flex gap-3 pt-6 border-t border-gray-200">
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-6 py-3 rounded-xl hover:shadow-xl hover:scale-105 font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'กำลังบันทึก...' : 'บันทึกการเปลี่ยนแปลง'}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="px-8 py-3 border-2 border-gray-300 rounded-xl hover:bg-gray-50 font-medium text-gray-700 transition-all"
          >
            ยกเลิก
          </button>
        </div>
      </div>
    </form>
  )
}
