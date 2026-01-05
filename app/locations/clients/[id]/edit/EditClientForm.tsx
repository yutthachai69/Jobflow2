'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { updateClient } from '@/app/actions'
import Link from 'next/link'

interface Client {
  id: string
  name: string
  contactInfo: string | null
}

interface Props {
  client: Client
}

export default function EditClientForm({ client }: Props) {
  const router = useRouter()
  const [name, setName] = useState<string>(client.name)
  const [contactInfo, setContactInfo] = useState<string>(client.contactInfo || '')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsSubmitting(true)
    const newErrors: Record<string, string> = {}

    // Validation
    if (!name || name.trim() === '') {
      newErrors.name = 'กรุณากรอกชื่อลูกค้า'
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
    formData.set('clientId', client.id)

    try {
      await updateClient(formData)
    } catch (error) {
      console.error('Error updating client:', error)
      setErrors({ submit: error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการอัพเดท' })
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-gray-100">
      <div className="space-y-6">
        {/* Name */}
        <div data-error={errors.name ? 'true' : undefined}>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            ชื่อลูกค้า <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="name"
            value={name}
            onChange={(e) => {
              setName(e.target.value)
              if (errors.name) setErrors({ ...errors, name: '' })
            }}
            className={`w-full border rounded-xl px-4 py-3 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 bg-white/50 backdrop-blur-sm hover:bg-white text-gray-900 placeholder:text-gray-400 ${
              errors.name ? 'border-red-400 bg-red-50/50' : 'border-gray-200'
            }`}
            placeholder="เช่น Grand Hotel Group"
            autoFocus
          />
          {errors.name && (
            <div className="mt-2 flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              <span>{errors.name}</span>
            </div>
          )}
        </div>

        {/* Contact Info */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            ข้อมูลติดต่อ
          </label>
          <textarea
            name="contactInfo"
            value={contactInfo}
            onChange={(e) => setContactInfo(e.target.value)}
            rows={3}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 bg-white/50 backdrop-blur-sm hover:bg-white text-gray-900 placeholder:text-gray-400 resize-none"
            placeholder="เช่น&#10;โทร: 02-xxx-xxxx&#10;อีเมล: contact@example.com&#10;ที่อยู่: กรุงเทพฯ"
          />
          <p className="mt-2 text-xs text-gray-500">ข้อมูลติดต่อ (ไม่บังคับ)</p>
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
            disabled={isSubmitting || !name.trim()}
            className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-xl hover:shadow-xl hover:scale-105 font-semibold transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
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

