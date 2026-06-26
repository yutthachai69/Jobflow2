'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createAdHocRepair } from '@/app/actions/work-orders'
import { REPORT_FORM_TYPES } from '@/lib/report-types'
import toast from 'react-hot-toast'

interface Site {
  id: string
  name: string
  client: { name: string }
}

interface Technician {
  id: string
  fullName: string | null
  username: string
}

interface Props {
  sites: Site[]
  technicians: Technician[]
}

const REPAIR_TYPES = [
  { value: 'WASH_AC', label: 'ล้างแอร์' },
  { value: 'REPAIR_AC', label: 'ซ่อมแอร์' },
  { value: 'WASH_FAN', label: 'ล้างพัดลม' },
  { value: 'REPAIR_FAN', label: 'ซ่อมพัดลม' },
  { value: 'OTHER', label: 'อื่นๆ' },
]

export default function AdHocRepairForm({ sites, technicians }: Props) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsSubmitting(true)
    const newErrors: Record<string, string> = {}

    const formData = new FormData(e.currentTarget)
    const siteId = formData.get('siteId') as string
    const repairType = formData.get('repairType') as string
    const locationDescription = formData.get('locationDescription') as string
    const problemDescription = formData.get('problemDescription') as string
    const scheduledDate = formData.get('scheduledDate') as string
    const technicianId = formData.get('technicianId') as string
    const reportType = formData.get('reportType') as string

    if (!siteId) newErrors.siteId = 'กรุณาเลือกสถานที่'
    if (!repairType) newErrors.repairType = 'กรุณาเลือกประเภทการซ่อม'
    if (!locationDescription) newErrors.locationDescription = 'กรุณากรอกสถานที่'
    if (!problemDescription) newErrors.problemDescription = 'กรุณากรอกรายละเอียดปัญหา'
    if (!scheduledDate) newErrors.scheduledDate = 'กรุณาเลือกวันที่'
    if (!technicianId) newErrors.technicianId = 'กรุณาเลือกช่าง'
    if (!reportType) newErrors.reportType = 'กรุณาเลือกรายงาน'

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      setIsSubmitting(false)
      return
    }

    try {
      setErrors({})
      await createAdHocRepair(formData)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'เกิดข้อผิดพลาด'
      toast.error(message)
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-gray-100">
      <div className="space-y-6">
        {/* สถานที่ */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            สถานที่ <span className="text-red-500">*</span>
          </label>
          <select
            name="siteId"
            className={`w-full border rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
              errors.siteId ? 'border-red-400 bg-red-50' : 'border-gray-200 bg-white'
            }`}
          >
            <option value="">-- เลือกสถานที่ --</option>
            {sites.map((site) => (
              <option key={site.id} value={site.id}>
                {site.name} ({site.client.name})
              </option>
            ))}
          </select>
          {errors.siteId && <p className="mt-1 text-sm text-red-600">{errors.siteId}</p>}
        </div>

        {/* ประเภทการซ่อม */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            ประเภทการซ่อม <span className="text-red-500">*</span>
          </label>
          <select
            name="repairType"
            className={`w-full border rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
              errors.repairType ? 'border-red-400 bg-red-50' : 'border-gray-200 bg-white'
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
            className={`w-full border rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
              errors.locationDescription ? 'border-red-400 bg-red-50' : 'border-gray-200 bg-white'
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
            className={`w-full border rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none ${
              errors.problemDescription ? 'border-red-400 bg-red-50' : 'border-gray-200 bg-white'
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
            className={`w-full border rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
              errors.scheduledDate ? 'border-red-400 bg-red-50' : 'border-gray-200 bg-white'
            }`}
          />
          {errors.scheduledDate && <p className="mt-1 text-sm text-red-600">{errors.scheduledDate}</p>}
        </div>

        {/* ช่าง */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            เลือกช่าง <span className="text-red-500">*</span>
          </label>
          <select
            name="technicianId"
            className={`w-full border rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
              errors.technicianId ? 'border-red-400 bg-red-50' : 'border-gray-200 bg-white'
            }`}
          >
            <option value="">-- เลือกช่าง --</option>
            {technicians.map((tech) => (
              <option key={tech.id} value={tech.id}>
                {tech.fullName || tech.username}
              </option>
            ))}
          </select>
          {errors.technicianId && <p className="mt-1 text-sm text-red-600">{errors.technicianId}</p>}
        </div>

        {/* รายงาน */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            เลือกรายงาน <span className="text-red-500">*</span>
          </label>
          <select
            name="reportType"
            className={`w-full border rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
              errors.reportType ? 'border-red-400 bg-red-50' : 'border-gray-200 bg-white'
            }`}
          >
            <option value="">-- เลือกแบบฟอร์ม --</option>
            {REPORT_FORM_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
          {errors.reportType && <p className="mt-1 text-sm text-red-600">{errors.reportType}</p>}
        </div>

        {/* Buttons */}
        <div className="flex gap-3 pt-6 border-t border-gray-200">
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-6 py-3 rounded-xl hover:shadow-xl hover:scale-105 font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'กำลังสร้าง...' : 'สร้างใบแจ้งซ่อม'}
          </button>
          <button
            type="button"
            onClick={() => router.push('/ad-hoc-repairs')}
            className="px-8 py-3 border-2 border-gray-300 rounded-xl hover:bg-gray-50 font-medium text-gray-700 transition-all"
          >
            ยกเลิก
          </button>
        </div>
      </div>
    </form>
  )
}
