'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { updateFloor } from '@/app/actions'
import Link from 'next/link'
import toast from 'react-hot-toast'

interface Floor {
  id: string
  name: string
  building: {
    id: string
    name: string
    site: {
      name: string
      client: {
        name: string
      }
    }
  }
}

interface Props {
  floor: Floor
}

export default function EditFloorForm({ floor }: Props) {
  const router = useRouter()
  const [name, setName] = useState<string>(floor.name)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsSubmitting(true)
    const newErrors: Record<string, string> = {}

    // Validation
    if (!name || name.trim() === '') {
      newErrors.name = 'กรุณากรอกชื่อชั้น'
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
    formData.set('floorId', floor.id)
    formData.set('buildingId', floor.building.id)

    try {
      await updateFloor(formData)
      toast.success('แก้ไขชั้นเรียบร้อยแล้ว')
      router.push('/locations')
      router.refresh()
    } catch (error) {
      console.error('Error updating floor:', error)
      const errorMessage = error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการแก้ไขข้อมูล'
      toast.error(errorMessage)
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-gray-100">
      <input type="hidden" name="floorId" value={floor.id} />
      <input type="hidden" name="buildingId" value={floor.building.id} />

      <div className="space-y-6">
        <div>
          <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-2">
            ชื่อชั้น <span className="text-red-500">*</span>
          </label>
          <input
            id="name"
            name="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            data-error={errors.name ? true : undefined}
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200 text-gray-900 ${
              errors.name ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-white'
            }`}
            placeholder="เช่น ชั้น 1, ชั้น 2, ชั้นใต้ดิน"
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-600">{errors.name}</p>
          )}
        </div>

        <div className="flex items-center gap-4 pt-4">
          <button
            type="submit"
            disabled={isSubmitting || !name.trim()}
            className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-6 py-3 rounded-lg hover:shadow-lg hover:scale-[1.02] font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
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

