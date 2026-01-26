'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { updateSite } from '@/app/actions/index'
import Link from 'next/link'
import toast from 'react-hot-toast'

interface Client {
  id: string
  name: string
}

interface Site {
  id: string
  name: string
  address: string | null
  clientId: string
  client: {
    id: string
    name: string
  }
}

interface Props {
  site: Site
  clients: Client[]
}

export default function EditSiteForm({ site, clients }: Props) {
  const router = useRouter()
  const [selectedClientId, setSelectedClientId] = useState<string>(site.clientId)
  const [name, setName] = useState<string>(site.name)
  const [address, setAddress] = useState<string>(site.address || '')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsSubmitting(true)
    const newErrors: Record<string, string> = {}

    // Validation
    if (!selectedClientId) {
      newErrors.clientId = 'กรุณาเลือกลูกค้า'
    }
    if (!name || name.trim() === '') {
      newErrors.name = 'กรุณากรอกชื่อสถานที่'
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
    formData.set('siteId', site.id)
    formData.set('clientId', selectedClientId)
    formData.set('name', name)
    formData.set('address', address)

    try {
      await updateSite(formData)
      toast.success('อัพเดทข้อมูลสถานที่เรียบร้อยแล้ว')
      router.push('/locations')
      router.refresh()
    } catch (error) {
      console.error('Error updating site:', error)
      const errorMessage = error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการอัพเดท'
      toast.error(errorMessage)
      setErrors({ submit: errorMessage })
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-gray-100">
      <div className="space-y-6">
        {/* Site ID (Hidden) */}
        <input type="hidden" name="siteId" value={site.id} />

        {/* Client Selection */}
        <div data-error={errors.clientId ? 'true' : undefined}>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            ลูกค้า <span className="text-red-500">*</span>
          </label>
          <select
            name="clientId"
            value={selectedClientId}
            onChange={(e) => {
              setSelectedClientId(e.target.value)
              if (errors.clientId) setErrors({ ...errors, clientId: '' })
            }}
            className={`w-full border rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white/50 backdrop-blur-sm hover:bg-white text-gray-900 ${
              errors.clientId ? 'border-red-400 bg-red-50/50' : 'border-gray-200'
            }`}
          >
            <option value="">-- เลือกลูกค้า --</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.name}
              </option>
            ))}
          </select>
          {errors.clientId && (
            <div className="mt-2 flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              <span>{errors.clientId}</span>
            </div>
          )}
        </div>

        {/* Site Name */}
        <div data-error={errors.name ? 'true' : undefined}>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            ชื่อสถานที่ <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="name"
            value={name}
            onChange={(e) => {
              setName(e.target.value)
              if (errors.name) setErrors({ ...errors, name: '' })
            }}
            className={`w-full border rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white/50 backdrop-blur-sm hover:bg-white text-gray-900 placeholder:text-gray-400 ${
              errors.name ? 'border-red-400 bg-red-50/50' : 'border-gray-200'
            }`}
            placeholder="เช่น สุขุมวิท, โรงงาน A, สำนักงานใหญ่"
            autoFocus
          />
          {errors.name && (
            <div className="mt-2 flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              <span>{errors.name}</span>
            </div>
          )}
        </div>

        {/* Address */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            ที่อยู่
          </label>
          <textarea
            name="address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            rows={3}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white/50 backdrop-blur-sm hover:bg-white text-gray-900 placeholder:text-gray-400 resize-none"
            placeholder="ที่อยู่เต็ม รวมถึงเลขที่ ถนน ตำบล อำเภอ จังหวัด รหัสไปรษณีย์"
          />
          <p className="mt-2 text-xs text-gray-500">ที่อยู่สำหรับการติดต่อและประสานงาน (ไม่บังคับ)</p>
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
            disabled={isSubmitting || !name.trim() || !selectedClientId}
            className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-6 py-3 rounded-xl hover:shadow-xl hover:scale-105 font-semibold transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            <span>{isSubmitting ? 'กำลังบันทึก...' : 'บันทึกการแก้ไข'}</span>
          </button>
          <Link
            href="/locations"
            className="sm:flex-none px-8 py-3 border-2 border-gray-300 rounded-xl hover:bg-gray-50 hover:border-gray-400 font-medium text-center transition-all duration-200 text-gray-700"
          >
            ยกเลิก
          </Link>
        </div>
      </div>
    </form>
  )
}

