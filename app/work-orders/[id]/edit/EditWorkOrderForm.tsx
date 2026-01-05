'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { updateWorkOrder } from '@/app/actions'

interface Site {
  id: string
  name: string
  client: {
    name: string
  }
}

interface WorkOrder {
  id: string
  jobType: 'PM' | 'CM' | 'INSTALL'
  scheduledDate: Date
  assignedTeam: string | null
  site: {
    id: string
    name: string
    client: {
      name: string
    }
  }
}

interface Props {
  workOrder: WorkOrder
  sites: Site[]
}

export default function EditWorkOrderForm({ workOrder, sites }: Props) {
  const router = useRouter()
  const [selectedSiteId, setSelectedSiteId] = useState<string>(workOrder.site.id)
  const [jobType, setJobType] = useState<'PM' | 'CM' | 'INSTALL'>(workOrder.jobType)
  const [scheduledDate, setScheduledDate] = useState<string>(() => {
    const date = new Date(workOrder.scheduledDate)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    return `${year}-${month}-${day}T${hours}:${minutes}`
  })
  const [assignedTeam, setAssignedTeam] = useState<string>(workOrder.assignedTeam || '')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsSubmitting(true)
    const newErrors: Record<string, string> = {}

    // Validation
    if (!selectedSiteId) {
      newErrors.siteId = 'กรุณาเลือกสถานที่'
    }
    if (!jobType) {
      newErrors.jobType = 'กรุณาเลือกประเภทงาน'
    }
    if (!scheduledDate) {
      newErrors.scheduledDate = 'กรุณาเลือกวันนัดหมาย'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      setIsSubmitting(false)
      const firstErrorField = document.querySelector('[data-error]')
      firstErrorField?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }

    setErrors({})
    const formData = new FormData(e.currentTarget)
    formData.set('workOrderId', workOrder.id)
    formData.set('siteId', selectedSiteId)
    formData.set('jobType', jobType)
    formData.set('scheduledDate', scheduledDate)
    formData.set('assignedTeam', assignedTeam)

    try {
      await updateWorkOrder(formData)
    } catch (error) {
      console.error('Error updating work order:', error)
      setErrors({ submit: error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการอัพเดท' })
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-gray-100">
      <div className="space-y-6">
        {/* Site */}
        <div data-error={errors.siteId ? 'true' : undefined}>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            สถานที่ <span className="text-red-500">*</span>
          </label>
          <select
            value={selectedSiteId}
            onChange={(e) => {
              setSelectedSiteId(e.target.value)
              if (errors.siteId) setErrors({ ...errors, siteId: '' })
            }}
            className={`w-full border rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white/50 backdrop-blur-sm hover:bg-white text-gray-900 ${
              errors.siteId ? 'border-red-400 bg-red-50/50' : 'border-gray-200'
            }`}
          >
            <option value="">-- เลือกสถานที่ --</option>
            {sites.map((site) => (
              <option key={site.id} value={site.id}>
                {site.name} ({site.client.name})
              </option>
            ))}
          </select>
          {errors.siteId && (
            <div className="mt-2 flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              <span>{errors.siteId}</span>
            </div>
          )}
        </div>

        {/* Job Type */}
        <div data-error={errors.jobType ? 'true' : undefined}>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            ประเภทงาน <span className="text-red-500">*</span>
          </label>
          <select
            value={jobType}
            onChange={(e) => {
              setJobType(e.target.value as 'PM' | 'CM' | 'INSTALL')
              if (errors.jobType) setErrors({ ...errors, jobType: '' })
            }}
            className={`w-full border rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white/50 backdrop-blur-sm hover:bg-white text-gray-900 ${
              errors.jobType ? 'border-red-400 bg-red-50/50' : 'border-gray-200'
            }`}
          >
            <option value="PM">PM - Preventive Maintenance (บำรุงรักษา)</option>
            <option value="CM">CM - Corrective Maintenance (แก้ไข)</option>
            <option value="INSTALL">INSTALL - ติดตั้ง</option>
          </select>
          {errors.jobType && (
            <div className="mt-2 flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              <span>{errors.jobType}</span>
            </div>
          )}
        </div>

        {/* Scheduled Date */}
        <div data-error={errors.scheduledDate ? 'true' : undefined}>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            วันนัดหมาย <span className="text-red-500">*</span>
          </label>
          <input
            type="datetime-local"
            value={scheduledDate}
            onChange={(e) => {
              setScheduledDate(e.target.value)
              if (errors.scheduledDate) setErrors({ ...errors, scheduledDate: '' })
            }}
            className={`w-full border rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white/50 backdrop-blur-sm hover:bg-white text-gray-900 ${
              errors.scheduledDate ? 'border-red-400 bg-red-50/50' : 'border-gray-200'
            }`}
          />
          {errors.scheduledDate && (
            <div className="mt-2 flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              <span>{errors.scheduledDate}</span>
            </div>
          )}
        </div>

        {/* Assigned Team */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            ทีมที่รับผิดชอบ
          </label>
          <input
            type="text"
            value={assignedTeam}
            onChange={(e) => setAssignedTeam(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white/50 backdrop-blur-sm hover:bg-white text-gray-900 placeholder:text-gray-400"
            placeholder="เช่น ทีม A, ทีม B"
          />
          <p className="mt-2 text-xs text-gray-500">ระบุทีมที่รับผิดชอบ (ไม่บังคับ)</p>
        </div>

        {/* Submit Error */}
        {errors.submit && (
          <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
            <span>{errors.submit}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-gray-200">
          <button
            type="submit"
            disabled={isSubmitting || !selectedSiteId || !jobType || !scheduledDate}
            className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-6 py-3 rounded-xl hover:shadow-xl hover:scale-105 font-semibold transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            <span>{isSubmitting ? 'กำลังบันทึก...' : 'บันทึกการแก้ไข'}</span>
          </button>
          <button
            type="button"
            onClick={() => router.push(`/work-orders/${workOrder.id}`)}
            className="sm:flex-none px-8 py-3 border-2 border-gray-300 rounded-xl hover:bg-gray-50 hover:border-gray-400 font-medium text-center transition-all duration-200 text-gray-700"
          >
            ยกเลิก
          </button>
        </div>
      </div>
    </form>
  )
}

