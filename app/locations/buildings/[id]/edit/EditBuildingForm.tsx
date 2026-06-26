'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { updateBuilding } from '@/app/actions/locations'
import Link from 'next/link'
import toast from 'react-hot-toast'

interface Building {
  id: string
  name: string
  buildingCode: string | null
  site: {
    id: string
    name: string
    client: {
      name: string
    }
  }
}

interface Props {
  building: Building
}

export default function EditBuildingForm({ building }: Props) {
  const router = useRouter()
  const [name, setName] = useState<string>(building.name)
  const [buildingCode, setBuildingCode] = useState<string>(building.buildingCode || '')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsSubmitting(true)
    const newErrors: Record<string, string> = {}

    // Validation
    if (!name || name.trim() === '') {
      newErrors.name = 'กรุณากรอกชื่ออาคาร'
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
    formData.set('buildingId', building.id)
    formData.set('siteId', building.site.id)
    formData.set('buildingCode', buildingCode)

    try {
      await updateBuilding(formData)
      toast.success('แก้ไขอาคารเรียบร้อยแล้ว')
      router.push('/locations')
      router.refresh()
    } catch (error: any) {
      // NEXT_REDIRECT ต้อง re-throw ให้ Next.js router จัดการ navigation เอง
      if (error?.message === 'NEXT_REDIRECT' || error?.digest?.includes?.('NEXT_REDIRECT')) throw error
      console.error('Error updating building:', error)
      const errorMessage = error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการแก้ไข'
      toast.error(errorMessage)
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-gray-100">
      <input type="hidden" name="buildingId" value={building.id} />
      <input type="hidden" name="siteId" value={building.site.id} />

      <div className="space-y-6">
        <div>
          <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-2">
            ชื่ออาคาร <span className="text-red-500">*</span>
          </label>
          <input
            id="name"
            name="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            data-error={errors.name ? true : undefined}
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-gray-900 ${
              errors.name ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-white'
            }`}
            placeholder="เช่น อาคาร A, อาคารหลัก"
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-600">{errors.name}</p>
          )}
        </div>

        {/* Building Code */}
        <div>
          <label htmlFor="buildingCode" className="block text-sm font-semibold text-gray-700 mb-2">
            Building Code (รหัสอาคาร)
          </label>
          <input
            id="buildingCode"
            name="buildingCode"
            type="text"
            value={buildingCode}
            onChange={(e) => setBuildingCode(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white text-gray-900 placeholder:text-gray-400"
            placeholder="เช่น A, MAIN, 1 (1-4 ตัวอักษร)"
          />
          <p className="mt-1 text-xs text-gray-500">ใช้ในการสร้าง QR Code อัตโนมัติ (เช่น AC-PTS1-A-F1-001)</p>
        </div>

        <div className="flex items-center gap-4 pt-4">
          <button
            type="submit"
            disabled={isSubmitting || !name.trim()}
            className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-lg hover:shadow-lg hover:scale-[1.02] font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            <span>{isSubmitting ? 'กำลังบันทึก...' : 'บันทึกการแก้ไข'}</span>
          </button>
          <Link
            href="/locations"
            className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition-colors text-center text-gray-700"
          >
            ยกเลิก
          </Link>
        </div>
      </div>
    </form>
  )
}

